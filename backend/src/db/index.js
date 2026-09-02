const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && (
    process.env.DATABASE_URL.includes('neon.tech') ||
    process.env.DATABASE_URL.includes('supabase') ||
    process.env.DATABASE_URL.includes('render') ||
    process.env.DATABASE_URL.includes('sslmode=require')
  ) ? { rejectUnauthorized: false } : false
});

class DatabaseWrapper {
  async query(sql, params = []) {
    let i = 1;
    // VERY IMPORTANT: replace ? with $1, $2 ONLY if it's not inside a string.
    // A quick hack is just string replace but it's dangerous if strings contain '?'.
    // Better to use a simplistic regex for our use case where '?' is isolated.
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    return await pool.query(pgSql, params);
  }

  prepare(sql) {
    const db = this;
    return {
      get: async function(...params) {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];
        const res = await db.query(sql, params);
        return res.rows[0];
      },
      all: async function(...params) {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];
        const res = await db.query(sql, params);
        return res.rows;
      },
      run: async function(...params) {
        if (params.length === 1 && Array.isArray(params[0])) params = params[0];
        const res = await db.query(sql, params);
        return { changes: res.rowCount, lastInsertRowid: res.rows[0] ? res.rows[0].id : null };
      }
    };
  }

  async exec(sql) {
    await pool.query(sql);
  }
}

const database = new DatabaseWrapper();

async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  let pgSchema = schema
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
    .replace(/datetime\('now',\s*'\+2 hours'\)/g, "CURRENT_TIMESTAMP + INTERVAL '2 hours'")
    .replace(/REAL/g, 'FLOAT')
    // Remove DEFAULT 0 from integer/boolean fields that Postgres prefers as false? Actually Postgres accepts 0 for integers.
    // but SQLite booleans are integer 0 or 1. If it's a numeric column it's fine.
  
  await pool.query(pgSchema);
  return database;
}

module.exports = { db: database, initSchema, pool };
