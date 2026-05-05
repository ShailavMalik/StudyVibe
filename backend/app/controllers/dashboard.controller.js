import {
  getDashboardData,
  logStudySession as logStudySessionService,
  updateStudyStreak,
} from "../services/studyProgress.service.js";
import { rebalanceNextDaySchedule } from "../services/adaptiveScheduler.js";

/**
 * Get dashboard data with today's sessions and streak
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const dashboardData = await getDashboardData(userId);

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("getDashboard error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Log a study session for today and update streak
 */
export const logStudySession = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, date, completedHours, plannedHours, sessionKey } =
      req.body;

    if (!userId || !subject) {
      return res.status(400).json({ error: "Missing userId or subject" });
    }

    // Log the study session
    const sessionLog = await logStudySessionService({
      userId,
      sessionKey,
      subject,
      date: date || new Date(),
      completedHours: Number(completedHours) || 0,
      plannedHours: Number(plannedHours) || 0,
      skipped: false,
    });

    // Update streak based on today's completion
    const streakData = await updateStudyStreak(userId);

    return res.status(200).json({
      sessionLog,
      streakData,
    });
  } catch (error) {
    console.error("logStudySession error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Rebalance study schedule for tomorrow based on today's performance
 */
export const rebalanceSchedule = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const newPlan = await rebalanceNextDaySchedule(userId);

    return res.status(200).json({
      success: true,
      newPlan,
      message: "Schedule rebalanced for tomorrow",
    });
  } catch (error) {
    console.error("rebalanceSchedule error:", error);
    return res.status(500).json({ error: error.message });
  }
};
