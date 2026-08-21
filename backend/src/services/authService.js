/**
 * authService
 * -----------
 * Trust model from planning: identity is borrowed from the campus itself.
 * Registration is restricted to the campus email domain (set via CAMPUS_EMAIL_DOMAIN),
 * which is the cheapest reliable proxy for "this is a real student" without
 * needing a full ID-verification pipeline in v1.
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { db } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const CAMPUS_EMAIL_DOMAIN = process.env.CAMPUS_EMAIL_DOMAIN || "college.edu"; // set in .env per deployment

async function register({ name, email, phone, department, year, password }) {
  if (!email.toLowerCase().endsWith(`@${CAMPUS_EMAIL_DOMAIN}`)) {
    const err = new Error(`Registration requires a @${CAMPUS_EMAIL_DOMAIN} email address.`);
    err.status = 400;
    throw err;
  }
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (existing) {
    const err = new Error("An account with this email already exists.");
    err.status = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const id = uuid();
  db.prepare(
    `INSERT INTO users (id, name, email, phone, department, year, password_hash, verified)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)` // verified=1 because domain check already gates entry; swap for email-link verification if needed
  ).run(id, name, email.toLowerCase(), phone, department, year, password_hash);

  return issueToken(id);
}

async function login(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) throw httpError(401, "Invalid email or password.");
  if (user.suspended) throw httpError(403, "This account has been suspended by a moderator.");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw httpError(401, "Invalid email or password.");

  return issueToken(user.id);
}

function issueToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { register, login, verifyToken, JWT_SECRET };
