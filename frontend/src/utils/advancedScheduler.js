import dayjs from "dayjs";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const PREFERRED_TIME_SLOTS = {
  "Early Morning (5-8 AM)": [5, 6, 7],
  "Morning (8-12 PM)": [8, 9, 10, 11],
  "Afternoon (12-5 PM)": [12, 13, 14, 15, 16],
  "Evening (5-9 PM)": [17, 18, 19, 20],
  "Night (9 PM+)": [21, 22, 23],
};

function normalizeSubjects(subjects, preferences) {
  return (subjects || []).map((sub) => {
    const name = sub.subject || sub.name;
    const difficulty = preferences?.subjectDifficulty?.[name] || 3;

    return {
      ...sub,
      name,
      difficulty,
      examDate: dayjs(sub.examDate || sub.date).startOf("day"),
    };
  });
}

function getPreferredStartHour(preferences, sessionIndex = 0) {
  const preferredTimes = preferences?.preferredTimes || [];
  if (preferredTimes.length === 0) return 8;

  const preferredHours = preferredTimes
    .flatMap((slot) => PREFERRED_TIME_SLOTS[slot] || [])
    .sort((a, b) => a - b);

  if (preferredHours.length === 0) return 8;
  return preferredHours[sessionIndex % preferredHours.length];
}

function calculateDailyAvailableHours(
  schedule,
  commitments,
  preferences,
  dayOfWeek,
) {
  const dayShort = dayOfWeek.slice(0, 3);
  let availableHours = 24;

  if (preferences?.sleepSchedule) {
    const { start, end } = preferences.sleepSchedule;
    if (start > end) {
      availableHours -= 24 - start + end;
    } else {
      availableHours -= end - start;
    }
  }

  if (schedule && typeof schedule === "object") {
    Object.entries(schedule).forEach(([key, block]) => {
      const [blockDay] = key.split("-");
      if (blockDay === dayOfWeek && block?.type && block.type !== "free") {
        availableHours -= 1;
      }
    });
  }

  if (Array.isArray(commitments)) {
    commitments.forEach((commitment) => {
      if (!commitment?.days?.includes(dayShort)) return;

      const [sh, sm = "0"] = String(commitment.startTime || "00:00").split(":");
      const [eh, em = "0"] = String(commitment.endTime || "00:00").split(":");
      const start = Number(sh) + Number(sm) / 60;
      const end = Number(eh) + Number(em) / 60;
      const duration = end >= start ? end - start : 24 - start + end;
      availableHours -= duration;
    });
  }

  availableHours = Math.max(0, availableHours);

  if (preferences?.pomodoro && availableHours > 0) {
    const focusMin = preferences.pomodoro.focusDuration || 25;
    const breakMin = preferences.pomodoro.breakDuration || 5;
    const overhead = breakMin / focusMin;
    availableHours *= 1 - overhead;
  }

  return Math.max(0, availableHours);
}

export function generateAdvancedStaticPlan(
  subjects,
  schedule,
  commitments,
  preferences,
  studyHoursAvailable = 6,
) {
  const today = dayjs().startOf("day");
  const plan = {};

  let subjectList = normalizeSubjects(subjects, preferences);
  if (subjectList.length === 0) {
    return {
      schedule: plan,
      summary: {
        totalDays: 0,
        subjectsCount: 0,
        averageDailyHours: studyHoursAvailable,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  subjectList.sort((a, b) => a.examDate.diff(b.examDate));

  const lastExamDate = subjectList.reduce(
    (latest, sub) => (sub.examDate.isAfter(latest) ? sub.examDate : latest),
    today,
  );

  const totalDays = Math.max(7, Math.min(30, lastExamDate.diff(today, "day")));
  const planningDays = Math.min(14, totalDays);
  const totalAvailableStudyHours = studyHoursAvailable * planningDays;

  const totalDifficultyWeight =
    subjectList.reduce((sum, sub) => sum + sub.difficulty, 0) || 1;

  subjectList = subjectList.map((sub) => ({
    ...sub,
    totalHoursNeeded:
      (sub.difficulty / totalDifficultyWeight) * totalAvailableStudyHours,
  }));

  const allocatedHours = Object.fromEntries(
    subjectList.map((sub) => [sub.name, 0]),
  );

  const pomodoro = preferences?.pomodoro || { focusDuration: 25 };
  const minSessionLength = Math.max(15, preferences?.minSessionLength || 30);
  const maxSessionLength = Math.max(
    minSessionLength,
    preferences?.maxSessionLength || 120,
  );

  for (let dayOffset = 0; dayOffset < planningDays; dayOffset += 1) {
    const currentDate = today.add(dayOffset, "day");
    const dateStr = currentDate.format("DD-MMMM-YYYY");
    const dayOfWeek = DAY_NAMES[currentDate.day()];

    const dailyFreeHours = calculateDailyAvailableHours(
      schedule,
      commitments,
      preferences,
      dayOfWeek,
    );

    if (dailyFreeHours <= 0.5) continue;

    const activeSubjects = subjectList.filter(
      (sub) => sub.examDate.diff(currentDate, "day") > 0,
    );
    if (activeSubjects.length === 0) continue;

    const weights = {};
    let totalWeight = 0;

    activeSubjects.forEach((sub) => {
      const daysLeft = Math.max(1, sub.examDate.diff(currentDate, "day"));
      const hoursRemaining = Math.max(
        0,
        sub.totalHoursNeeded - allocatedHours[sub.name],
      );

      if (hoursRemaining < 0.25) return;

      const urgencyWeight = 1 / Math.sqrt(daysLeft);
      const difficultyWeight = sub.difficulty / 5;
      const remainingWeight =
        sub.totalHoursNeeded > 0 ? hoursRemaining / sub.totalHoursNeeded : 0;
      const finalWeight =
        (urgencyWeight + difficultyWeight + remainingWeight) / 3;

      weights[sub.name] = finalWeight;
      totalWeight += finalWeight;
    });

    if (totalWeight === 0) continue;

    Object.keys(weights).forEach((name) => {
      weights[name] /= totalWeight;
    });

    const sessions = [];
    let sessionIndex = 0;

    Object.entries(weights).forEach(([subName, normalizedWeight]) => {
      const targetHours = dailyFreeHours * normalizedWeight;
      const subject = subjectList.find((s) => s.name === subName);
      if (!subject || targetHours < 0.4) return;

      let minutesRemaining = Math.round(targetHours * 60);

      while (minutesRemaining >= minSessionLength) {
        const sessionDuration = Math.min(maxSessionLength, minutesRemaining);
        const startHour = getPreferredStartHour(preferences, sessionIndex);
        const startMin = (sessionIndex * 15) % 60;
        const endTotal = startHour * 60 + startMin + sessionDuration;

        const endHour = Math.floor(endTotal / 60) % 24;
        const endMin = endTotal % 60;

        sessions.push({
          subject: subName,
          startTime: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
          endTime: `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
          duration: sessionDuration,
          pomodoroSessions: Math.ceil(
            sessionDuration / (pomodoro.focusDuration || 25),
          ),
          sessionType: sessionIndex % 3 === 0 ? "review" : "learning",
          difficulty: subject.difficulty,
        });

        allocatedHours[subName] += sessionDuration / 60;
        minutesRemaining -= sessionDuration;
        sessionIndex += 1;
      }
    });

    if (sessions.length > 0) {
      plan[dateStr] = sessions;
    }
  }

  return {
    schedule: plan,
    summary: {
      totalDays: planningDays,
      subjectsCount: subjectList.length,
      averageDailyHours: studyHoursAvailable,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function calculateFreeTimeBlocks(schedule, commitments, preferences) {
  const freeBlocks = [];

  DAY_NAMES.slice(1)
    .concat(DAY_NAMES[0])
    .forEach((day) => {
      const busy = [];

      if (schedule && typeof schedule === "object") {
        Object.entries(schedule).forEach(([key, block]) => {
          const [blockDay, blockHour] = key.split("-");
          if (blockDay === day && block?.type && block.type !== "free") {
            const hour = Number(blockHour);
            busy.push({ start: hour, end: hour + 1 });
          }
        });
      }

      if (Array.isArray(commitments)) {
        commitments.forEach((commitment) => {
          if (!commitment?.days?.includes(day.slice(0, 3))) return;
          const [sh] = String(commitment.startTime || "00:00").split(":");
          const [eh] = String(commitment.endTime || "00:00").split(":");
          busy.push({ start: Number(sh), end: Number(eh) });
        });
      }

      if (preferences?.sleepSchedule) {
        const { start, end } = preferences.sleepSchedule;
        if (start > end) {
          busy.push({ start: 0, end });
          busy.push({ start, end: 24 });
        } else {
          busy.push({ start, end });
        }
      }

      busy.sort((a, b) => a.start - b.start);

      let cursor = 0;
      busy.forEach((slot) => {
        if (cursor < slot.start) {
          freeBlocks.push({
            day,
            startHour: cursor,
            endHour: slot.start,
            duration: slot.start - cursor,
          });
        }
        cursor = Math.max(cursor, slot.end);
      });

      if (cursor < 24) {
        freeBlocks.push({
          day,
          startHour: cursor,
          endHour: 24,
          duration: 24 - cursor,
        });
      }
    });

  return freeBlocks;
}

export default {
  generateAdvancedStaticPlan,
  calculateFreeTimeBlocks,
};
