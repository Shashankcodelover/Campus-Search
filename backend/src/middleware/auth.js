const { verifyToken } = require("../services/authService");
const { db } = require("../db");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token." });

  try {
    const payload = verifyToken(token);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.sub);
    if (!user) return res.status(401).json({ error: "User no longer exists." });
    if (user.suspended) return res.status(403).json({ error: "Account suspended." });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do this." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
