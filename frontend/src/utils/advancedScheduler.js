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

const MINUTES_IN_DAY = 24 * 60;

const toMinutes = (hourValue) => Math.round(Number(hourValue || 0) * 60);

const minutesToTime = (minutes) => {
  const safeMinutes = Math.max(0, Math.min(MINUTES_IN_DAY - 1, minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const groupFreeBlocksByDay = (freeBlocks) => {
  return (freeBlocks || []).reduce((accumulator, block) => {
    if (!block?.day) return accumulator;
    if (!accumulator[block.day]) accumulator[block.day] = [];
    accumulator[block.day].push(block);
    return accumulator;
  }, {});
};

const reserveSlot = (blocks, durationMin, preferredStartMin) => {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const preferred =
    typeof preferredStartMin === "number" ? preferredStartMin : (
      blocks[0].startMin
    );

  let bestIndex = -1;
  let bestStart = null;
  let bestScore = Number.POSITIVE_INFINITY;

  blocks.forEach((block, idx) => {
    const latestStart = block.endMin - durationMin;
    if (latestStart < block.startMin) return;

    const candidateStart = Math.min(
      Math.max(preferred, block.startMin),
      latestStart,
    );
    const score = Math.abs(candidateStart - preferred);

    if (score < bestScore) {
      bestScore = score;
      bestIndex = idx;
      bestStart = candidateStart;
    }
  });

  if (bestIndex < 0 || bestStart === null) return null;

  const block = blocks[bestIndex];
  const endMin = bestStart + durationMin;
  const updated = [];

  if (block.startMin < bestStart) {
    updated.push({ startMin: block.startMin, endMin: bestStart });
  }
  if (endMin < block.endMin) {
    updated.push({ startMin: endMin, endMin: block.endMin });
  }

  blocks.splice(bestIndex, 1, ...updated);
  blocks.sort((a, b) => a.startMin - b.startMin);

  return { startMin: bestStart, endMin };
};

function normalizeSubjects(subjects, preferences) {
  const fallbackExamDate = dayjs().add(30, "day").startOf("day");

  return (subjects || []).map((sub) => {
    const name = sub.subject || sub.name || "";
    const difficulty = preferences?.subjectDifficulty?.[name] || 3;
    const rawExamDate = sub.examDate || sub.date;
    const parsedExamDate = dayjs(rawExamDate);
    const examDate =
      parsedExamDate.isValid() ?
        parsedExamDate.startOf("day")
      : fallbackExamDate;

    return {
      ...sub,
      name,
      difficulty,
      examDate,
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
  const minSessionLength = Math.max(
    15,
    Number(preferences?.minSessionLength || 30),
  );
  const maxSessionLength = Math.max(
    minSessionLength,
    Number(preferences?.maxSessionLength || 120),
  );

  const freeBlocksByDay = groupFreeBlocksByDay(
    calculateFreeTimeBlocks(schedule, commitments, preferences),
  );

  for (let dayOffset = 0; dayOffset < planningDays; dayOffset += 1) {
    const currentDate = today.add(dayOffset, "day");
    const dateStr = currentDate.format("DD-MMMM-YYYY");
    const dayOfWeek = DAY_NAMES[currentDate.day()];

    const dayBlocks = (freeBlocksByDay[dayOfWeek] || [])
      .map((block) => ({
        startMin: Math.max(0, Math.round(block.startHour * 60)),
        endMin: Math.min(MINUTES_IN_DAY, Math.round(block.endHour * 60)),
      }))
      .filter((block) => block.endMin > block.startMin)
      .sort((a, b) => a.startMin - b.startMin);

    if (dayBlocks.length === 0) continue;

    const dailyFreeMinutes = dayBlocks.reduce(
      (sum, block) => sum + (block.endMin - block.startMin),
      0,
    );

    const dailyCapacityMinutes = Math.min(
      dailyFreeMinutes,
      Math.max(0, Math.round(Number(studyHoursAvailable || 0) * 60)),
    );

    if (dailyCapacityMinutes < minSessionLength) continue;

    let effectiveMinutes = dailyCapacityMinutes;
    if (preferences?.pomodoro && effectiveMinutes > 0) {
      const focusMin = preferences.pomodoro.focusDuration || 25;
      const breakMin = preferences.pomodoro.breakDuration || 5;
      const overhead = breakMin / Math.max(1, focusMin);
      effectiveMinutes = Math.max(
        minSessionLength,
        Math.floor(effectiveMinutes * (1 - overhead)),
      );
    }

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

    const orderedWeights = Object.entries(weights).sort((a, b) => b[1] - a[1]);

    orderedWeights.forEach(([subName, normalizedWeight]) => {
      const subject = subjectList.find((s) => s.name === subName);
      if (!subject) return;

      const hoursRemaining = Math.max(
        0,
        subject.totalHoursNeeded - allocatedHours[subName],
      );
      if (hoursRemaining < minSessionLength / 60) return;

      const targetMinutes = Math.floor(effectiveMinutes * normalizedWeight);
      let minutesRemaining = Math.min(
        targetMinutes,
        Math.floor(hoursRemaining * 60),
      );

      while (minutesRemaining >= minSessionLength) {
        const maxBlockMinutes = dayBlocks.reduce(
          (max, block) => Math.max(max, block.endMin - block.startMin),
          0,
        );

        if (maxBlockMinutes < minSessionLength) return;

        const sessionDuration = Math.min(
          maxSessionLength,
          minutesRemaining,
          maxBlockMinutes,
        );

        const preferredStartMin =
          getPreferredStartHour(preferences, sessionIndex) * 60;
        const slot = reserveSlot(dayBlocks, sessionDuration, preferredStartMin);

        if (!slot) break;

        const durationHours = Math.floor(sessionDuration / 60);
        const durationMinutes = sessionDuration % 60;
        const timeFormatted =
          durationHours > 0 ?
            `${durationHours} hr ${durationMinutes} min`
          : `${durationMinutes} min`;

        sessions.push({
          subject: subName,
          startTime: minutesToTime(slot.startMin),
          endTime: minutesToTime(slot.endMin),
          duration: sessionDuration,
          hours: Number((sessionDuration / 60).toFixed(2)),
          timeFormatted,
          pomodoroSessions: Math.ceil(
            sessionDuration / (pomodoro.focusDuration || 25),
          ),
          sessionType: sessionIndex % 3 === 0 ? "review" : "learning",
          difficulty: subject.difficulty,
          examDate: subject.examDate.format("YYYY-MM-DD"),
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
          const [sh, sm = "0"] = String(commitment.startTime || "00:00").split(
            ":",
          );
          const [eh, em = "0"] = String(commitment.endTime || "00:00").split(
            ":",
          );
          const start = Number(sh) + Number(sm) / 60;
          const end = Number(eh) + Number(em) / 60;
          busy.push({ start, end });
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
