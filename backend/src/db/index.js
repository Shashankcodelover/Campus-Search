/**
 * Database connection layer.
 * Uses better-sqlite3 for a zero-config local dev DB.
 *
 * PRODUCTION NOTE: swap this file for a Postgres pool (pg / knex / prisma)
 * when moving beyond a single-campus prototype — SQLite is fine for
 * hundreds of users on one machine, not for a multi-server deployment.
 * The schema.sql is written in portable SQL and maps directly to Postgres
 * with minimal changes (TEXT -> UUID/TIMESTAMP types).
 */
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../campussearch.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL"); // safer under concurrent read/write from multiple requests
db.pragma("foreign_keys = ON");

function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
}

module.exports = { db, initSchema };
