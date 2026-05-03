import Subject from "../models/Subject.js";
import StudyLog from "../models/StudyLog.js";
import Timetable from "../models/Timetable.js";
import {
  generateAdaptivePlan as generateAdaptivePlanFromData,
  rebalanceSchedule as rebalanceScheduleForUser,
} from "./studyProgress.service.js";

/**
 * Backwards-compatible adaptive plan generator.
 * Loads the user's data and delegates to the shared scoring function.
 */
export async function generateAdaptivePlan(userId, totalAvailableHours = 4) {
  const subjects = await Subject.find({ userId }).lean();
  const sessions = await StudyLog.find({ userId }).lean();

  return generateAdaptivePlanFromData({
    subjects,
    sessions,
    totalHours: totalAvailableHours,
  });
}

/**
 * Backwards-compatible rebalance helper.
 * Persists the latest plan only when the timetable has not been updated today.
 */
export async function rebalanceNextDaySchedule(userId) {
  const result = await rebalanceScheduleForUser(userId);

  if (result.updated) {
    return result.plan;
  }

  const timetable = await Timetable.findOne({ userId }).lean();
  return timetable?.plan || [];
}

export default {
  generateAdaptivePlan,
  rebalanceNextDaySchedule,
};
