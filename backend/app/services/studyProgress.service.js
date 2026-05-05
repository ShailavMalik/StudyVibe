import dayjs from "dayjs";

import User from "../models/User.js";
import Subject from "../models/Subject.js";
import StudyLog from "../models/StudyLog.js";
import Timetable from "../models/Timetable.js";

function startOfDay(value) {
  return dayjs(value).startOf("day");
}

function getTodayRange() {
  const todayStart = dayjs().startOf("day");
  return {
    todayStart,
    tomorrowStart: todayStart.add(1, "day"),
    yesterdayStart: todayStart.subtract(1, "day"),
  };
}

function resolveSubjectName(subject) {
  if (typeof subject === "string") {
    return subject;
  }

  return subject?.name || subject?.subject || "Untitled Subject";
}

function resolveExamDate(subject, examDates) {
  if (subject?.examDate) {
    return subject.examDate;
  }

  const subjectName = resolveSubjectName(subject);

  if (Array.isArray(examDates)) {
    const match = examDates.find(
      (entry) => entry?.subject === subjectName || entry?.name === subjectName,
    );
    return match?.examDate || match?.date || null;
  }

  if (examDates && typeof examDates === "object") {
    return (
      examDates[subjectName] ||
      examDates[subjectName.toLowerCase?.() || subjectName] ||
      null
    );
  }

  return null;
}

function aggregateSessionsBySubject(sessions = []) {
  const subjectMap = new Map();

  for (const session of sessions) {
    const subjectName = resolveSubjectName(session);
    const current = subjectMap.get(subjectName) || {
      plannedHours: 0,
      completedHours: 0,
      skippedSessions: 0,
      sessionCount: 0,
    };

    current.plannedHours += Number(session?.plannedHours || 0);
    current.completedHours += Number(session?.completedHours || 0);
    current.skippedSessions += session?.skipped ? 1 : 0;
    current.sessionCount += 1;

    subjectMap.set(subjectName, current);
  }

  return subjectMap;
}

export async function logStudySession(data) {
  const {
    userId,
    sessionKey,
    subject,
    date,
    plannedHours = 0,
    completedHours,
    skipped = false,
  } = data;

  if (!userId) {
    throw new Error("userId is required");
  }

  if (!subject) {
    throw new Error("subject is required");
  }

  if (!date) {
    throw new Error("date is required");
  }

  const sessionDate = startOfDay(date).toDate();
  const effectiveCompletedHours =
    skipped ? 0 : (
      Number(typeof completedHours === "number" ? completedHours : plannedHours)
    );

  const lookup = {
    userId,
    date: sessionDate,
  };

  if (sessionKey) {
    lookup.sessionKey = sessionKey;
  } else {
    lookup.subject = subject;
  }

  const existingLog = await StudyLog.findOne(lookup);

  if (existingLog) {
    existingLog.plannedHours = Number(
      plannedHours ?? existingLog.plannedHours ?? 0,
    );
    existingLog.completedHours = effectiveCompletedHours;
    existingLog.skipped = Boolean(skipped);
    if (sessionKey) {
      existingLog.sessionKey = sessionKey;
    }
    await existingLog.save();
    return existingLog;
  }

  return StudyLog.create({
    userId,
    sessionKey: sessionKey || undefined,
    subject,
    date: sessionDate,
    plannedHours: Number(plannedHours || 0),
    completedHours: effectiveCompletedHours,
    skipped: Boolean(skipped),
  });
}

export async function updateStudyStreak(userId) {
  const user = await User.findById(userId).select("streak lastStudyDate");

  if (!user) {
    throw new Error("User not found");
  }

  const { todayStart, tomorrowStart, yesterdayStart } = getTodayRange();

  const todayLogs = await StudyLog.find({
    userId,
    date: {
      $gte: todayStart.toDate(),
      $lt: tomorrowStart.toDate(),
    },
  });

  const plannedHours = todayLogs.reduce(
    (sum, log) => sum + Number(log.plannedHours || 0),
    0,
  );
  const completedHours = todayLogs.reduce(
    (sum, log) => sum + Number(log.completedHours || 0),
    0,
  );

  const completionRate = plannedHours > 0 ? completedHours / plannedHours : 0;
  const lastStudyDate =
    user.lastStudyDate ? startOfDay(user.lastStudyDate) : null;

  if (completionRate >= 0.7) {
    if (lastStudyDate && lastStudyDate.isSame(yesterdayStart, "day")) {
      user.streak = Number(user.streak || 0) + 1;
    } else {
      user.streak = 1;
    }
  } else {
    user.streak = 0;
  }

  user.lastStudyDate = todayStart.toDate();
  await user.save();

  return {
    streak: user.streak,
    lastStudyDate: user.lastStudyDate,
    completionRate,
    plannedHours,
    completedHours,
  };
}

export function generateAdaptivePlan({
  subjects = [],
  sessions = [],
  examDates = {},
  totalHours = 0,
} = {}) {
  const today = dayjs().startOf("day");

  // Helper to detect non-study labels from CSVs (breaks/meals/etc.)
  const nonStudyPattern =
    /\b(break|lunch|dinner|meal|coffee|breakfast|snack|self study|self-study|study time|free time|general revision)\b/i;
  const normalizeSubjectInput = (subject) => {
    if (typeof subject === "string") {
      return { name: subject };
    }
    return subject || {};
  };

  // Normalize and filter out obvious non-study labels
  const normalizedSubjects = subjects
    .map(normalizeSubjectInput)
    .map((s) => ({ ...s, name: resolveSubjectName(s) }))
    .filter(
      (s) => s.name && !nonStudyPattern.test(s.name) && s.name.length > 1,
    );

  // Also filter sessions so they don't contribute for non-study labels
  const filteredSessions = (sessions || []).filter((sess) => {
    const name = resolveSubjectName(sess);
    return name && !nonStudyPattern.test(name) && name.length > 1;
  });

  const scores = normalizedSubjects.map((subject) => {
    const subjectName = resolveSubjectName(subject);
    const examDate = resolveExamDate(subject, examDates);
    const daysLeft =
      examDate ?
        Math.max(1, dayjs(examDate).startOf("day").diff(today, "day"))
      : 1;

    const subjectSessions = filteredSessions.filter((session) => {
      const sessionName = resolveSubjectName(session);
      return sessionName === subjectName;
    });

    const plannedHours = subjectSessions.reduce(
      (sum, session) => sum + Number(session?.plannedHours || 0),
      0,
    );
    const completedHours = subjectSessions.reduce(
      (sum, session) => sum + Number(session?.completedHours || 0),
      0,
    );
    const skipCount = subjectSessions.filter(
      (session) => session?.skipped,
    ).length;

    const completionRate = plannedHours > 0 ? completedHours / plannedHours : 0;
    const priorityScore = 1 / daysLeft + (1 - completionRate) + skipCount * 0.2;

    return {
      subject: subjectName,
      examDate: examDate || null,
      daysLeft,
      plannedHours,
      completedHours,
      skipCount,
      completionRate,
      priorityScore,
    };
  });

  const totalScore =
    scores.reduce((sum, item) => sum + item.priorityScore, 0) || 1;

  return scores.map((item) => ({
    subject: item.subject,
    examDate: item.examDate,
    daysLeft: item.daysLeft,
    plannedHours: item.plannedHours,
    completedHours: item.completedHours,
    skipCount: item.skipCount,
    completionRate: Number(item.completionRate.toFixed(2)),
    priorityScore: Number(item.priorityScore.toFixed(2)),
    allocatedTime: Number(
      ((item.priorityScore / totalScore) * Number(totalHours || 0)).toFixed(2),
    ),
  }));
}

export async function rebalanceSchedule(userId) {
  const user = await User.findById(userId).select("streak lastStudyDate");

  if (!user) {
    throw new Error("User not found");
  }

  const subjects = await Subject.find({ userId }).lean();
  const sessions = await StudyLog.find({ userId }).lean();
  const timetable = await Timetable.findOne({ userId });
  const today = dayjs().startOf("day");

  if (timetable && dayjs(timetable.updatedAt).isSame(today, "day")) {
    return {
      updated: false,
      plan: timetable.plan,
    };
  }

  const totalHours = subjects.reduce(
    (sum, subject) => sum + Number(subject.hours || 0),
    0,
  );

  const adaptivePlan = generateAdaptivePlan({
    subjects,
    sessions,
    totalHours: totalHours || 4,
  });

  const planEntries = adaptivePlan.map((item) => ({
    date: today.toDate(),
    subject: item.subject,
    hours: item.allocatedTime,
  }));

  if (timetable) {
    timetable.plan = planEntries;
    await timetable.save();
  } else {
    await Timetable.create({
      userId,
      plan: planEntries,
    });
  }

  return {
    updated: true,
    plan: planEntries,
  };
}

export async function getDashboardData(userId) {
  const user = await User.findById(userId).select("streak lastStudyDate");

  if (!user) {
    throw new Error("User not found");
  }

  const [subjects, logs] = await Promise.all([
    Subject.find({ userId }).lean(),
    StudyLog.find({ userId }).sort({ date: -1 }).lean(),
  ]);

  const { todayStart, tomorrowStart } = getTodayRange();
  const todayLogs = logs.filter((log) => {
    const logDate = dayjs(log.date);
    return (
      logDate.isAfter(todayStart.subtract(1, "millisecond")) &&
      logDate.isBefore(tomorrowStart)
    );
  });

  const totals = logs.reduce(
    (accumulator, log) => {
      accumulator.totalPlannedHours += Number(log.plannedHours || 0);
      accumulator.totalCompletedHours += Number(log.completedHours || 0);
      return accumulator;
    },
    { totalPlannedHours: 0, totalCompletedHours: 0 },
  );

  const progress =
    totals.totalPlannedHours > 0 ?
      totals.totalCompletedHours / totals.totalPlannedHours
    : 0;

  const subjectBreakdownMap = aggregateSessionsBySubject(logs);

  const subjectBreakdown = subjects.map((subject) => {
    const subjectName = resolveSubjectName(subject);
    const subjectStats = subjectBreakdownMap.get(subjectName) || {
      plannedHours: 0,
      completedHours: 0,
      skippedSessions: 0,
      sessionCount: 0,
    };

    return {
      subject: subjectName,
      examDate: subject.examDate,
      totalStudyHours: Number(subject.hours || 0),
      plannedHours: subjectStats.plannedHours,
      completedHours: subjectStats.completedHours,
      skippedSessions: subjectStats.skippedSessions,
      sessionCount: subjectStats.sessionCount,
      progress:
        subjectStats.plannedHours > 0 ?
          Number(
            (subjectStats.completedHours / subjectStats.plannedHours).toFixed(
              2,
            ),
          )
        : 0,
    };
  });

  return {
    totalPlannedHours: Number(totals.totalPlannedHours.toFixed(2)),
    totalCompletedHours: Number(totals.totalCompletedHours.toFixed(2)),
    progress: Number(progress.toFixed(2)),
    subjectBreakdown,
    todayLogs: todayLogs.map((log) => ({
      sessionKey: log.sessionKey || null,
      subject: log.subject,
      date: log.date,
      plannedHours: Number(log.plannedHours || 0),
      completedHours: Number(log.completedHours || 0),
      skipped: Boolean(log.skipped),
    })),
    streak: user.streak || 0,
    lastStudyDate: user.lastStudyDate,
  };
}

export async function getStreak(userId) {
  const user = await User.findById(userId).select("streak lastStudyDate");

  if (!user) {
    return { streak: 0, lastStudyDate: null };
  }

  return {
    streak: user.streak || 0,
    lastStudyDate: user.lastStudyDate,
  };
}
