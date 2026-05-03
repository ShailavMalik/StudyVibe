const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const filePath = join("app", "services", "scheduleParser.js");
let content = readFileSync(filePath, "utf8");

const badBlock =
  '.replace(/[•·]/g, " ")\r\n    .replace(/[!\t\n\r -~]/g, " ")\r\n    .replace(/\\r\\n|\\r/g, "\\n")';
const goodBlock =
  '.replace(/[•·]/g, " ")\r\n    .replace(/[^\t\n\r -~]/g, " ")\r\n    .replace(/\\r\\n|\\r/g, "\\n")';

if (!content.includes(badBlock)) {
  console.error("Bad block not found.");
  process.exit(1);
}
content = content.replace(badBlock, goodBlock);
writeFileSync(filePath, content, "utf8");
console.log("Fixed malformed regex in scheduleParser.js");
