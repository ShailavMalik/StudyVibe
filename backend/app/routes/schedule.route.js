import express from "express";
import multer from "multer";
import {
  uploadSchedule,
  parseSchedule,
} from "../controllers/schedule.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/schedules/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, PDFs, and CSV files
    // Support multiple MIME types for CSV
    const allowedMimes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "application/pdf",
      "text/csv",
      "text/plain", // Some systems send CSV as text/plain
      "application/vnd.ms-excel", // Old Excel format
    ];

    // Also check file extension as fallback
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    const allowedExts = ["csv", "png", "jpg", "jpeg", "pdf"];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. File: ${file.originalname}, MIME: ${file.mimetype}. Only PDF, PNG, JPG, and CSV are allowed.`,
        ),
      );
    }
  },
});

// POST /api/schedule/upload - Upload and parse schedule
router.post("/upload", upload.single("schedule"), uploadSchedule);

// POST /api/schedule/parse - Parse uploaded schedule (alternative endpoint)
router.post("/parse", parseSchedule);

export default router;
