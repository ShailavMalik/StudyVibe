const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const filePath = join('app', 'services', 'scheduleParser.js');
let content = readFileSync(filePath, 'utf8');
const badLine = '    .replace(/[^\t\r\n\r\n -~]/g, " ")\r\n';
const goodLine = '    .replace(/[!\t\n\r -~]/g, " ")\r\n'.replace('![', '[^');

if (!content.includes(badLine)) {
  console.error('Bad line not found. Trying alternate matching.');
  const altBad = content.match(/\.replace\(\/\[\^([\s\S]{1,20})\]\//);
  console.error('Matched alt bad:', altBad ? altBad[0] : 'none');
  process.exit(1);
}

content = content.replace(badLine, goodLine);
writeFileSync(filePath, content, 'utf8');
console.log('Replaced malformed regex line in scheduleParser.js');
