const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walkDir(file));
    } else {
      if (file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes("datetime('now')")) {
    content = content.replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP');
    changed = true;
  }

  if (content.includes("expires_at < CURRENT_TIMESTAMP")) {
    content = content.replace(/expires_at < CURRENT_TIMESTAMP/g, 'expires_at::timestamp < CURRENT_TIMESTAMP');
    changed = true;
  }
  
  // also check if 'expires_at < datetime' was already replaced
  if (content.includes("expires_at < datetime")) {
    // it was not replaced if it didn't match exactly. But datetime('now') was replaced just above.
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
}
