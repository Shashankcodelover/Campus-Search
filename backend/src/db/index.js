/**
 * Database connection layer — sql.js (pure JavaScript SQLite, no native compilation needed).
 *
 * sql.js uses WebAssembly-compiled SQLite, so it runs on any Node.js without
 * needing Visual Studio or C++ build tools. The API is slightly different
 * from better-sqlite3, so we wrap it in a compatible interface.
 *
 * PRODUCTION NOTE: swap this for a Postgres pool when scaling beyond one campus.
 */
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "../../campussearch.db");

let SQL;
let database;

// Wraps sql.js database in a better-sqlite3-compatible interface
class DatabaseWrapper {
  constructor(sqlJsDb) {
    this._db = sqlJsDb;
  }

  prepare(sql) {
    const db = this._db;
    return {
      run(...params) {
        db.run(sql, params);
        return { changes: db.getRowsModified() };
      },
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
    };
  }

  exec(sql) {
    this._db.exec(sql);
  }

  pragma(pragma) {
    try {
      this._db.exec(`PRAGMA ${pragma}`);
    } catch (e) {
      // Some pragmas may not be supported in sql.js
    }
  }

  transaction(fn) {
    const db = this;
    return function (...args) {
      db.exec("BEGIN TRANSACTION");
      try {
        const result = fn(...args);
        db.exec("COMMIT");
        return result;
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    };
  }

  getRowsModified() {
    return this._db.getRowsModified();
  }

  _save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Initialize synchronously by blocking on the async init
let _db = null;

function getDb() {
  if (_db) return _db;
  throw new Error("Database not initialized. Call initSchema() first.");
}

// We need a synchronous init for compatibility with existing code.
// sql.js init is async, so we use a sync workaround.
let _initPromise = null;
let _initialized = false;

function initSchema() {
  if (_initialized) return;

  // Use synchronous require trick to initialize
  const initSqlJsSync = require("sql.js");

  // We'll use a hack: load sql.js synchronously via the WASM file
  // Actually, let's just defer everything to async and export a promise-based db
  // But since the existing codebase expects sync... let's use a different approach.

  // Load existing DB file if it exists
  let buffer = null;
  try {
    if (fs.existsSync(DB_PATH)) {
      buffer = fs.readFileSync(DB_PATH);
    }
  } catch (e) {}

  // Since sql.js requires async init for WASM, we'll handle this at startup
  if (!_initPromise) {
    _initPromise = initSqlJsSync().then((SQL_module) => {
      SQL = SQL_module;
      const sqlJsDb = buffer ? new SQL.Database(buffer) : new SQL.Database();
      database = new DatabaseWrapper(sqlJsDb);
      _db = database;

      // Enable foreign keys
      database.pragma("foreign_keys = ON");

      // Run schema
      const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
      database.exec(schema);

      // Auto-save every 10 seconds
      setInterval(() => {
        try { database._save(); } catch (e) {}
      }, 10000);

      _initialized = true;
      return database;
    });
  }

  return _initPromise;
}

// Proxy that defers to initialized db
const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (!_db) {
      throw new Error(`Database not ready yet. Ensure initSchema() has completed. Tried to access: ${prop}`);
    }
    const val = _db[prop];
    if (typeof val === "function") return val.bind(_db);
    return val;
  }
});

module.exports = { db: dbProxy, initSchema };
