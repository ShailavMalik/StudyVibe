import Timetable from "../models/Timetable.js";
import generateSmartTimetable from "../services/groq_api.js";

const parseStudyDate = (dateString) => {
  if (!dateString) return null;

  const parsed = new Date(dateString);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = String(dateString).match(/^([0-3]\d)-([A-Za-z]+)-([12]\d{3})$/);
  if (!match) return null;

  const [, day, monthName, year] = match;
  const monthIndex = new Date(`${monthName} 1, 2000`).getMonth();
  if (Number.isNaN(monthIndex)) return null;

  return new Date(Number(year), monthIndex, Number(day));
};

const normalizePlanToSlots = (plan) => {
  if (!plan || typeof plan !== "object") return [];

  return Object.entries(plan).flatMap(([date, entries]) => {
    const list =
      Array.isArray(entries) ? entries
      : entries && typeof entries === "object" ?
        Object.values(entries).every((value) => typeof value === "number") ?
          Object.entries(entries).map(([subject, hours]) => ({
            subject,
            hours,
          }))
        : [entries]
      : [];

    const parsedDate = parseStudyDate(date);
    if (!parsedDate) return [];

    return list
      .filter((entry) => entry && (entry.subject || entry.name))
      .map((entry) => ({
        date: parsedDate,
        subject: entry.subject || entry.name,
        hours: Number(entry.hours ?? entry.time?.hours ?? 0) || 0,
      }));
  });
};

const saveUserTimetable = async (userId, plan) => {
  const slots = normalizePlanToSlots(plan);

  if (!slots.length) {
    throw new Error("Generated timetable plan is empty or invalid");
  }

  const saved = await Timetable.findOneAndUpdate(
    { userId },
    { userId, plan: slots },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return saved;
};

const normalizePlanEntries = (plan) => {
  if (!plan || typeof plan !== "object") return {};

  const normalized = {};

  Object.entries(plan).forEach(([date, entries]) => {
    if (Array.isArray(entries)) {
      normalized[date] = entries;
      return;
    }

    if (entries && typeof entries === "object") {
      if (Object.values(entries).every((value) => typeof value === "number")) {
        normalized[date] = Object.entries(entries).map(([subject, hours]) => ({
          subject,
          hours,
        }));
        return;
      }

      normalized[date] = [entries];
      return;
    }

    normalized[date] = [];
  });

  return normalized;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSubjectWeight = (subjectName, prompt) => {
  const subject = String(subjectName || "")
    .toLowerCase()
    .trim();
  const text = String(prompt || "").toLowerCase();

  if (!subject) return 1;

  const morePatterns = [
    `focus more on ${subject}`,
    `more on ${subject}`,
    `prioritize ${subject}`,
    `give more time to ${subject}`,
    `spend more time on ${subject}`,
    `extra time on ${subject}`,
  ];

  const lessPatterns = [
    `focus less on ${subject}`,
    `less on ${subject}`,
    `give less time to ${subject}`,
    `reduce time on ${subject}`,
    `less time on ${subject}`,
    `cut time for ${subject}`,
  ];

  if (morePatterns.some((pattern) => text.includes(pattern))) return 1.8;
  if (lessPatterns.some((pattern) => text.includes(pattern))) return 0.6;

  // If the prompt mentions the subject directly, give it a mild boost.
  const directMention = new RegExp(`\\b${escapeRegex(subject)}\\b`, "i");
  return directMention.test(text) ? 1.15 : 1;
};

const applyPromptBiasToPlan = (
  plan,
  subjects,
  availableHoursPerDay,
  customPrompt,
) => {
  const normalizedPlan = normalizePlanEntries(plan);
  const subjectWeights = new Map();

  (subjects || []).forEach((subject) => {
    const subjectName = subject.name || subject.subject;
    if (!subjectName) return;
    subjectWeights.set(
      subjectName.toLowerCase(),
      getSubjectWeight(subjectName, customPrompt),
    );
  });

  const fallbackPerSubject =
    (Number(availableHoursPerDay) || 1) / Math.max(1, subjects?.length || 1);

  const adjustedPlan = {};

  Object.entries(normalizedPlan).forEach(([date, entries]) => {
    if (!entries.length) {
      adjustedPlan[date] = [];
      return;
    }

    const totalHours = entries.reduce((sum, entry) => {
      const hours = Number(
        entry.hours ?? entry.time?.hours ?? fallbackPerSubject,
      );
      return sum + (Number.isFinite(hours) ? hours : fallbackPerSubject);
    }, 0);

    const weighted = entries.map((entry) => {
      const subjectName = (entry.subject || entry.name || "").toLowerCase();
      return subjectWeights.get(subjectName) || 1;
    });

    const totalWeight =
      weighted.reduce((sum, weight) => sum + weight, 0) || entries.length;

    adjustedPlan[date] = entries.map((entry, index) => {
      const hours = Number(
        ((totalHours * weighted[index]) / totalWeight).toFixed(2),
      );

      return {
        ...entry,
        hours,
        timeFormatted: entry.timeFormatted || `${hours.toFixed(2)} hrs`,
      };
    });
  });

  return adjustedPlan;
};

export const saveTimetable = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { plan } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Authentication required to save timetable" });
    }

    const newPlan = await saveUserTimetable(userId, plan);

    res.status(200).json(newPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateSmartTimetableController = async (req, res) => {
  try {
    const { subjects, availableHoursPerDay, customPrompt, modelType } =
      req.body;

    // Validate input
    if (!subjects || !availableHoursPerDay) {
      return res.status(400).json({
        error: "Subjects and available hours per day are required",
      });
    }

    // Generate smart timetable using GROQ model (llama-3.3-70b-versatile)
    try {
      const smartPlan = await generateSmartTimetable(
        subjects,
        availableHoursPerDay,
        customPrompt,
        modelType || "flash",
      );

      const biasedPlan = applyPromptBiasToPlan(
        smartPlan?.plan || smartPlan,
        subjects,
        availableHoursPerDay,
        customPrompt,
      );

      const userId = req.userId;

      if (userId) {
        try {
          const savedTimetable = await saveUserTimetable(userId, biasedPlan);
          return res.status(200).json({
            ...smartPlan,
            plan: biasedPlan,
            saved: true,
            timetableId: savedTimetable._id,
          });
        } catch (saveError) {
          console.error("Failed to save generated timetable:", saveError);
          return res.status(200).json({
            ...smartPlan,
            plan: biasedPlan,
            saved: false,
            saveError: saveError.message,
          });
        }
      }

      return res.status(200).json({
        ...smartPlan,
        plan: biasedPlan,
      });
    } catch (aiErr) {
      console.error(
        "GROQ generation failed, falling back to simple planner:",
        aiErr,
      );

      // Fallback: simple deterministic planner that evenly distributes available hours
      // across the next `horizonDays` days until the nearest exam date.
      const horizonDays = 14; // keep fallback concise
      const result = {};

      // Normalize subject names
      const normalized = (subjects || []).map((s) => ({
        subject: s.name || s.subject || "Unknown",
        examDate: s.examDate || null,
      }));

      for (let i = 0; i < horizonDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateKey = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        const perSubject =
          (availableHoursPerDay || 1) / Math.max(1, normalized.length);
        result[dateKey] = normalized.map((sub) => ({
          subject: sub.subject,
          hours: Number(perSubject.toFixed(2)),
        }));
      }

      const userId = req.userId;
      const biasedFallbackPlan = applyPromptBiasToPlan(
        result,
        subjects,
        availableHoursPerDay,
        customPrompt,
      );

      const fallbackResponse = {
        fallback: true,
        plan: biasedFallbackPlan,
        reason: aiErr.message,
      };

      if (userId) {
        try {
          const savedTimetable = await saveUserTimetable(
            userId,
            biasedFallbackPlan,
          );
          return res.status(200).json({
            ...fallbackResponse,
            saved: true,
            timetableId: savedTimetable._id,
          });
        } catch (saveError) {
          console.error("Failed to save fallback timetable:", saveError);
          return res.status(200).json({
            ...fallbackResponse,
            saved: false,
            saveError: saveError.message,
          });
        }
      }

      return res.status(200).json(fallbackResponse);
    }
  } catch (error) {
    console.error("Error generating smart timetable:", error);
    res.status(500).json({
      error: "Failed to generate smart timetable",
      details: error.message,
    });
  }
};
