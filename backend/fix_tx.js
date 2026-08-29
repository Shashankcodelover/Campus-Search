const fs = require('fs');
const filePath = 'src/services/matchingService.js';
let c = fs.readFileSync(filePath, 'utf8');

c = c.replace(/const tx = db\.transaction\(\(\) => \{\n/g, '');
c = c.replace(/\}\);\n\n  return tx\(\);\n\}/g, '}\n');
c = c.replace(/\}\);\n\n  const response = tx\(\);\n/g, '');

fs.writeFileSync(filePath, c);
console.log('Fixed matchingService.js tx wrapper');
