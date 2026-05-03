import { generateAdaptivePlan } from "../services/studyProgress.service.js";

/**
 * Generate an adaptive plan from the request payload.
 * The caller provides subjects, historical sessions, exam dates, and total hours.
 */
export const generateAdaptivePlanController = async (req, res) => {
  try {
    const {
      subjects,
      sessions = [],
      examDates = {},
      totalHours = 0,
    } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: "subjects are required" });
    }

    const plan = generateAdaptivePlan({
      subjects,
      sessions,
      examDates,
      totalHours,
    });

    return res.status(200).json({ plan });
  } catch (error) {
    console.error("generateAdaptivePlanController error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export default generateAdaptivePlanController;
