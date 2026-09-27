const fs = require('fs'); 
let c = fs.readFileSync('src/components/modals/AuthScreen.jsx', 'utf8'); 
c = c.replace('<div className="auth-footer">', '<div className="auth-footer">\\n<div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "12px" }}><a href="#privacy" style={{ color: "var(--signal)" }}>Privacy Policy</a><a href="#terms" style={{ color: "var(--signal)" }}>Terms of Service</a></div>'); 
fs.writeFileSync('src/components/modals/AuthScreen.jsx', c);
