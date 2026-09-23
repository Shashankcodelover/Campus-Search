const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

let isFallback = false;
let sqliteDb = null;

function initSqlite() {
  if (sqliteDb) return;
  const Database = require('better-sqlite3');
  // Use /tmp for Vercel Serverless
  sqliteDb = new Database('/tmp/fallback.sqlite');
  console.warn("Neon DB quota exceeded! Falling back to /tmp/fallback.sqlite");
  
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  sqliteDb.exec(schema);
  isFallback = true;
}

class DatabaseWrapper {
  async query(sql, params = []) {
    let i = 1;
    const pgSql = sql.replace(/\?/g, () => `$${i++}`);
    
    if (isFallback) {
      // Better-sqlite3 is synchronous
      const stmt = sqliteDb.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
        const rows = stmt.all(...params);
        return { rows, rowCount: rows.length };
      } else {
        const info = stmt.run(...params);
        // Map to pg-like response
        return { rowCount: info.changes, rows: [{ id: info.lastInsertRowid }] };
      }
    }

    try {
      return await pool.query(pgSql, params);
    } catch (err) {
      if (err.message && (err.message.includes('quota') || err.message.includes('password authentication failed') || err.message.includes('Endpoint is disabled'))) {
        initSqlite();
        return await this.query(sql, params);
      }
      throw err;
    }
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
    if (isFallback) {
      sqliteDb.exec(sql);
      return;
    }
    try {
      await pool.query(sql);
    } catch (err) {
      if (err.message && (err.message.includes('quota') || err.message.includes('password authentication failed') || err.message.includes('Endpoint is disabled'))) {
        initSqlite();
        sqliteDb.exec(sql);
      } else {
        throw err;
      }
    }
  }
}

const database = new DatabaseWrapper();

async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  let pgSchema = schema
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
    .replace(/datetime\('now',\s*'\+2 hours'\)/g, "CURRENT_TIMESTAMP + INTERVAL '2 hours'")
    .replace(/REAL/g, 'FLOAT');
  
  if (!isFallback) {
    try {
      await pool.query(pgSchema);
    } catch (err) {
      if (err.message && (err.message.includes('quota') || err.message.includes('password authentication failed') || err.message.includes('Endpoint is disabled'))) {
        initSqlite();
      } else {
        console.error("Schema init error:", err);
      }
    }
  }
  return database;
}

module.exports = { db: database, initSchema, pool };
