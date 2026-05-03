const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const filePath = join("app", "services", "scheduleParser.js");
let content = readFileSync(filePath, "utf8");

const badRegex = /\.replace\(\/\[\^([\s\S]*?)\]\/g, " "\)/m;
const goodLine = '    .replace(/[\t\n\r -~]/g, " ")';

if (!badRegex.test(content)) {
  console.error("Malformed regex pattern not found in scheduleParser.js");
  process.exit(1);
}

content = content.replace(badRegex, goodLine);
writeFileSync(filePath, content, "utf8");
console.log("Replaced malformed regex line in scheduleParser.js");
