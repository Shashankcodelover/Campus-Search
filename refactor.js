const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Make all router handlers async
  content = content.replace(/router\.(get|post|put|patch|delete)\(([^,]+),\s*(?:requireAuth,\s*)?\(req,\s*res\)\s*=>\s*\{/g, (match) => {
    return match.replace('(req, res) =>', 'async (req, res) =>');
  });
  content = content.replace(/router\.(get|post|put|patch|delete)\(([^,]+),\s*(?:requireAuth,\s*)?async\s*\(req,\s*res\)\s*=>\s*\{/g, (match) => match); // idempotency

  // 2. Add await to db.prepare calls
  // Need to handle multi-line and single-line chains.
  // We will replace db.prepare with await db.prepare
  // Since db.prepare() might be used directly in expressions, we must be careful.
  content = content.replace(/db\.prepare\(/g, 'await db.prepare(');

  // Some handlers might not have been matched by the regex if they use different whitespace.
  // Let's just blindly make sure all route callbacks are async if they contain await db.prepare.
  content = content.replace(/,\s*\(req,\s*res(?:,\s*next)?\)\s*=>\s*\{/g, ', async (req, res) => {');

  // Remove existing double awaits if any
  content = content.replace(/await\s+await\s+db\.prepare/g, 'await db.prepare');

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('Routes rewritten.');
