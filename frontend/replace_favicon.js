const fs = require('fs'); 
let c = fs.readFileSync('index.html', 'utf8'); 
c = c.replace(/<link rel="icon".*?>/, '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\\\'http://www.w3.org/2000/svg\\\' viewBox=\\\'0 0 100 100\\\'%3E%3Crect x=\\\'10\\\' y=\\\'10\\\' width=\\\'80\\\' height=\\\'80\\\' rx=\\\'15\\\' fill=\\\'%230d1310\\\' stroke=\\\'%2310b981\\\' stroke-width=\\\'8\\\'/%3E%3Cpath d=\\\'M30 50h40M50 30v40\\\' stroke=\\\'%2310b981\\\' stroke-width=\\\'8\\\' stroke-linecap=\\\'round\\\'/%3E%3C/svg%3E" />'); 
fs.writeFileSync('index.html', c);
