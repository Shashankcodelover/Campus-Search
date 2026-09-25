
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'frontend/src/styles.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Prism Glass
css = css.replace(/--glass-bg: .*?;/g, '--glass-bg: rgba(255, 255, 255, 0.03);');
css = css.replace(/--glass-border: .*?;/g, '--glass-border: rgba(255, 255, 255, 0.08);');
css = css.replace(/--glass-blur: .*?;/g, '--glass-blur: 24px;');

// 2. Remove wasted space
css = css.replace(/padding: 64px 20px 80px;/g, 'padding: 24px 16px 40px;');
css = css.replace(/margin-bottom: 24px;/g, 'margin-bottom: 16px;');
css = css.replace(/margin-bottom: 20px;/g, 'margin-bottom: 12px;');

// 3. Fix contrast
css = css.replace(/--text-secondary: .*?;/g, '--text-secondary: #e2e8f0;');
css = css.replace(/--muted: .*?;/g, '--muted: #94a3b8;');
css = css.replace(/--muted-dim: .*?;/g, '--muted-dim: #64748b;');

// 4. Fix z-indexes
css = css.replace(/z-index: 50;/g, 'z-index: 999;');
css = css.replace(/z-index: 100;/g, 'z-index: 9999;');

fs.writeFileSync(cssPath, css);
console.log('CSS updated');

