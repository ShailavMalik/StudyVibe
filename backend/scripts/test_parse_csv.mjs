import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parserModule = await import("../app/services/scheduleParser.js");
const demo = path.join(__dirname, "..", "..", "demo_schedule.csv");
try {
  const schedule = await parserModule.parseScheduleFile(demo, "text/csv");
  console.log("parsedCount", schedule.length);
  console.log(schedule.slice(0, 5));
} catch (e) {
  console.error("parse error", e);
  process.exit(1);
}
