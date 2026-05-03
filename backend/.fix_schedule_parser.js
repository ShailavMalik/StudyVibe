const fs = require("fs");
const path = require("path");
const filePath = path.join("app", "services", "scheduleParser.js");
let content = fs.readFileSync(filePath, "utf8");
const newBlock = `const normalizeExtractedText = (text) => {
  return text
    .replace(/[\\u2012\\u2013\\u2014\\u2015]/g, "-")
    .replace(/[•·]/g, " ")
    .replace(/[^\\t\\n\\r -~]/g, " ")
    .replace(/\\r\\n|\\r/g, "\\n")
    .replace(/[ \\t]+\\n/g, "\\n")
    .replace(/\\n{2,}/g, "\\n")
    .replace(/[ \\t]{2,}/g, " ")
    .trim();
};`;
const regex =
  /const normalizeExtractedText = \(text\) => \{[\s\S]*?\.trim\(\);\n\};/m;
if (!regex.test(content)) {
  throw new Error("normalizeExtractedText block not found");
}
content = content.replace(regex, newBlock);
fs.writeFileSync(filePath, content, "utf8");
console.log("Patched normalizeExtractedText block");
