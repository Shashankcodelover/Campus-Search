const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'services');
const files = ['notificationService.js', 'matchingService.js', 'moderationService.js', 'notionService.js', 'sseService.js'];

for (let file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace function XXX with async function XXX if it contains await
  content = content.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g, (match, name, args, body) => {
    if (body.includes('await') && !match.startsWith('async')) {
      return sync function () {};
    }
    return match;
  });
  
  fs.writeFileSync(filePath, content);
  console.log('Processed ' + file);
}
