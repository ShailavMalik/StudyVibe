import dayjs from "dayjs";

import {
  logStudySession,
  updateStudyStreak,
} from "../services/studyProgress.service.js";

/**
 * Mark a study session complete for today.
 * A session can only be completed on the same day it is scheduled.
 */
export const completeSession = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { subject, date, plannedHours = 0, completedHours } = req.body;

    if (!subject || !date) {
      return res.status(400).json({ error: "subject and date are required" });
    }

    const sessionDate = dayjs(date).startOf("day");
    const today = dayjs().startOf("day");

    if (!sessionDate.isSame(today, "day")) {
      return res.status(400).json({
        error: "You can only complete a session for today",
      });
    }

    const studyLog = await logStudySession({
      userId,
      subject,
      date: sessionDate.toDate(),
      plannedHours,
      completedHours:
        typeof completedHours === "number" ? completedHours : plannedHours,
      skipped: false,
    });

    const streakResult = await updateStudyStreak(userId);

    return res.status(200).json({
      message: "Session completed successfully",
      studyLog,
      streak: streakResult,
    });
  } catch (error) {
    console.error("completeSession error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export default completeSession;
