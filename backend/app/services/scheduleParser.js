import fs from "fs";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";

/**
 * Parse schedule file using OCR and pattern matching
 * @param {string} filePath - Path to the uploaded file
 * @param {string} fileType - MIME type of the file
 * @returns {Array} Parsed schedule entries
 */
export const parseScheduleFile = async (filePath, fileType) => {
  try {
    // Handle CSV files - accept multiple MIME types
    if (
      fileType === "text/csv" ||
      fileType === "text/plain" ||
      fileType === "application/octet-stream" ||
      fileType === "application/vnd.ms-excel" ||
      filePath.endsWith(".csv")
    ) {
      return await parseCSVSchedule(filePath);
    }

    if (fileType === "application/pdf") {
      return await parsePDFSchedule(filePath);
    }

    if (fileType.startsWith("image/")) {
      return await parseImageSchedule(filePath);
    }

    return [];
  } catch (error) {
    console.error("Error parsing schedule file:", error);
    throw new Error("Failed to parse schedule file: " + error.message);
  }
};

/**
 * Parse image file using Tesseract OCR
 */
const parseImageSchedule = async (filePath) => {
  try {
    console.log("Starting OCR on image:", filePath);

    const worker = createWorker({
      logger: (m) => console.log("OCR Progress:", m),
    });

    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");
    await worker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:-/. ,()&%#@+",
      preserve_interword_spaces: "1",
    });

    const {
      data: { text },
    } = await worker.recognize(filePath, "eng", {
      tessedit_pageseg_mode: "3",
    });

    await worker.terminate();

    const cleanedText = normalizeExtractedText(text);
    console.log("OCR extracted text length:", cleanedText.length);

    return parseScheduleText(cleanedText);
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("OCR failed: " + error.message);
  }
};

/**
 * Parse CSV schedule file
 */
const parseCSVSchedule = async (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length);

    const schedule = [];
    const startIndex =
      (
        lines[0]?.toLowerCase().includes("day") ||
        lines[0]?.toLowerCase().includes("time")
      ) ?
        1
      : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(",").map((part) => part.trim());
      if (parts.length >= 4) {
        schedule.push({
          day: capitalizeDay(parts[0] || ""),
          subject: parts[1] || "",
          startTime: formatTime(parts[2] || ""),
          endTime: formatTime(parts[3] || ""),
        });
      }
    }

    return schedule;
  } catch (error) {
    console.error("CSV parsing error:", error);
    throw new Error("CSV parsing failed: " + error.message);
  }
};

/**
 * Parse PDF schedule file using pdf-parse
 */
const parsePDFSchedule = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const extractedText = normalizeExtractedText(data.text || "");

    if (!extractedText || extractedText.length < 10) {
      throw new Error("PDF text extraction yielded no usable content.");
    }

    return parseScheduleText(extractedText);
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("PDF parsing failed: " + error.message);
  }
};

/**
 * Clean up OCR/PDF extracted text before parsing
 */
const normalizeExtractedText = (text) => {
  return String(text || "")
    .replace(/[\u2012\u2013\u2014\u2015]/g, "-")
    .replace(/[•·]/g, " ")
    .replace(/[^\t\n\r -~]/g, " ")
    .replace(/\r\n|\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};
/**
 * Parse schedule from extracted text using pattern matching
 * Supports text like:
 * - "Monday 9:00-10:00 Math"
 * - "Tue 09:00 AM - 10:00 AM Physics"
 * - table rows separated by tabs, pipes, or multiple spaces
 */
const parseScheduleText = (text) => {
  const schedule = [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length);

  for (const line of lines) {
    const parsed = parseScheduleLine(line);
    if (parsed) {
      schedule.push(parsed);
    }
  }

  return schedule;
};

const dayPatterns =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi;
const timePatterns = /(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi;

const parseScheduleLine = (line) => {
  const normalized = line
    .replace(/\|/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  const day = extractDay(normalized);
  const timeRange = extractTimeRange(normalized);

  if (!day || !timeRange) {
    return null;
  }

  const cells = normalized
    .replace(dayPatterns, "")
    .replace(timeRange.rangeText, "")
    .replace(/[-–—]/g, " ")
    .replace(/\b(am|pm)\b/gi, "")
    .replace(/[^\t\n\r -~]/g, " ")
    .split(/\t|\|/)
    .map((cell) => cell.trim())
    .filter(Boolean);

  let subject = cells.join(" ");

  if (cells.length >= 3) {
    subject = cells
      .slice(2)
      .join(" ")
      .replace(/\b(am|pm)\b/gi, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!subject) {
    return null;
  }

  return {
    day,
    subject,
    startTime: timeRange.start,
    endTime: timeRange.end,
  };
};

const extractDay = (text) => {
  const match = text.match(dayPatterns);
  return match ? capitalizeDay(match[0]) : "";
};

const extractTimeRange = (text) => {
  const rangePattern =
    /(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–—]\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/i;
  const rangeMatch = text.match(rangePattern);

  if (rangeMatch) {
    const start = formatTime(
      `${rangeMatch[1]}:${rangeMatch[2] || "00"}${rangeMatch[3] ? " " + rangeMatch[3] : ""}`,
    );
    const end = formatTime(
      `${rangeMatch[4]}:${rangeMatch[5] || "00"}${rangeMatch[6] ? " " + rangeMatch[6] : ""}`,
    );

    return {
      start,
      end,
      rangeText: rangeMatch[0],
    };
  }

  const matches = Array.from(text.matchAll(timePatterns));
  if (matches.length >= 2) {
    return {
      start: formatTime(matches[0][0]),
      end: formatTime(matches[1][0]),
      rangeText: `${matches[0][0]} ${matches[1][0]}`,
    };
  }

  return null;
};

/**
 * Capitalize and normalize day name
 */
const capitalizeDay = (day) => {
  const dayMap = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  const lowerDay = day.toLowerCase();
  if (dayMap[lowerDay]) {
    return dayMap[lowerDay];
  }

  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
};

/**
 * Format time to HH:MM format
 */
const formatTime = (timeStr) => {
  timeStr = timeStr.replace(/\s+/g, "").toLowerCase();
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?(am|pm)?/i);

  if (!match) {
    return timeStr;
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3];

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export default {
  parseScheduleFile,
  parseScheduleText,
};
