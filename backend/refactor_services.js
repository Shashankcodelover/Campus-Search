const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'services');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

for (let file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace db.prepare with await db.prepare
  // BUT we must make sure the function enclosing it is async!
  // It's safer to just replace db.prepare with await db.prepare if it's not already awaited.
  content = content.replace(/(?<!await\s)db\.prepare/g, 'await db.prepare');
  
  fs.writeFileSync(filePath, content);
  console.log('Processed ' + file);
}
