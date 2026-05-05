import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import {
  generateAdvancedStaticPlan,
  calculateFreeTimeBlocks,
} from "../src/utils/advancedScheduler.js";

dayjs.extend(customParseFormat);

const schedule = {
  "Monday-9": { day: "Monday", hour: 9, type: "class", label: "Lecture" },
  "Monday-10": { day: "Monday", hour: 10, type: "class", label: "Lecture" },
  "Monday-14": { day: "Monday", hour: 14, type: "class", label: "Lab" },
  "Wednesday-11": { day: "Wednesday", hour: 11, type: "class" },
};

const commitments = [
  {
    name: "Part-time job",
    days: ["Mon"],
    startTime: "17:30",
    endTime: "19:00",
    type: "work",
  },
  {
    name: "Gym",
    days: ["Wed"],
    startTime: "18:00",
    endTime: "19:00",
    type: "sports",
  },
];

const preferences = {
  preferredTimes: ["Morning (8-12 PM)", "Evening (5-9 PM)"],
  pomodoro: {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
  },
  subjectDifficulty: {
    Mathematics: 5,
    Physics: 4,
    English: 2,
  },
  minSessionLength: 30,
  maxSessionLength: 120,
  sleepSchedule: { start: 23, end: 7 },
};

const subjects = [
  {
    subject: "Mathematics",
    examDate: dayjs().add(4, "day").format("YYYY-MM-DD"),
  },
  { subject: "Physics", examDate: dayjs().add(10, "day").format("YYYY-MM-DD") },
  { subject: "English", examDate: dayjs().add(21, "day").format("YYYY-MM-DD") },
];

const studyHoursAvailable = 4;
const planResult = generateAdvancedStaticPlan(
  subjects,
  schedule,
  commitments,
  preferences,
  studyHoursAvailable,
);

const freeBlocks = calculateFreeTimeBlocks(schedule, commitments, preferences);
const freeBlocksByDay = freeBlocks.reduce((acc, block) => {
  acc[block.day] = acc[block.day] || [];
  acc[block.day].push(block);
  return acc;
}, {});

const parseTimeToMinutes = (time) => {
  const [h, m = "0"] = String(time || "00:00").split(":");
  return Number(h) * 60 + Number(m);
};

const isWithinFreeBlock = (day, startTime, endTime) => {
  const blocks = freeBlocksByDay[day] || [];
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  return blocks.some((block) => {
    const blockStart = Math.round(block.startHour * 60);
    const blockEnd = Math.round(block.endHour * 60);
    return startMin >= blockStart && endMin <= blockEnd;
  });
};

const violations = [];
const subjectTotals = {};

Object.entries(planResult.schedule || {}).forEach(([date, sessions]) => {
  const dayName = dayjs(date, "DD-MMMM-YYYY").format("dddd");
  sessions.forEach((session) => {
    const ok = isWithinFreeBlock(dayName, session.startTime, session.endTime);
    if (!ok) {
      violations.push({ date, dayName, session });
    }
    subjectTotals[session.subject] =
      (subjectTotals[session.subject] || 0) + (session.hours || 0);
  });
});

console.log("Generated days:", Object.keys(planResult.schedule || {}).length);
console.log("Subject totals:", subjectTotals);
if (violations.length > 0) {
  console.error("❌ Sessions outside free blocks:", violations);
  process.exit(1);
}

console.log("✅ All sessions placed within free blocks");
