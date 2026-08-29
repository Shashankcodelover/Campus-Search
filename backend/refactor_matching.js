const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'matchingService.js');
let content = fs.readFileSync(filePath, 'utf-8');

// Using regex to find all functions and prepend async if they contain await
content = content.replace(/(?<!async\s+)function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g, (match, name, args, body) => {
  if (body.includes('await')) {
    return sync function () {};
  }
  return match;
});

fs.writeFileSync(filePath, content);
console.log('Fixed matchingService.js');
