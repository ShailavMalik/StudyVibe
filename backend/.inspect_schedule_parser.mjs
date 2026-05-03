import fs from "fs";
const content = fs.readFileSync("app/services/scheduleParser.js", "utf8");
const start = content.indexOf('.replace(/[•·]/g, " ")');
const end = content.indexOf('.replace(/\\r\\n|\\r/g, "\\n")', start);
if (start === -1 || end === -1) {
  console.error("not found");
  process.exit(1);
}
const snippet = content.slice(start, end + 30);
console.log(JSON.stringify(snippet));
console.log([...snippet].map((c) => c.charCodeAt(0)).join(","));
