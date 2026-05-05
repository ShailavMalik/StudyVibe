import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parser = await import("../app/services/scheduleParser.js");
const service = await import("../app/services/studyProgress.service.js");

const demo = path.join(__dirname, "..", "..", "demo_schedule.csv");

(async () => {
  const schedule = await parser.parseScheduleFile(demo, "text/csv");
  const subjectsSet = new Set(schedule.map((s) => s.subject).filter(Boolean));
  const subjects = Array.from(subjectsSet)
    .slice(0, 10)
    .map((s) => ({ name: s, hours: 10 }));

  // Create examDates: make some subjects near, some far
  const now = new Date();
  const makeDate = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const examDates = {};
  // assign first two subjects exams in 3 and 5 days, others in 30 days
  if (subjects.length >= 1) examDates[subjects[0].name] = makeDate(3);
  if (subjects.length >= 2) examDates[subjects[1].name] = makeDate(5);
  for (let i = 2; i < subjects.length; i++)
    examDates[subjects[i].name] = makeDate(30 + i);

  const totalHours = 40;

  const plan = service.generateAdaptivePlan({
    subjects,
    sessions: [],
    examDates,
    totalHours,
  });

  console.log(
    "Subjects:",
    subjects.map((s) => s.name),
  );
  console.log(
    "\nExam Dates sample:",
    Object.fromEntries(Object.entries(examDates).slice(0, 5)),
  );
  console.log("\nAdaptive Plan Allocations:");
  plan.forEach((p) => {
    console.log(
      p.subject,
      "daysLeft=",
      p.daysLeft,
      "priority=",
      p.priorityScore,
      "alloc=",
      p.allocatedTime,
    );
  });
})();
