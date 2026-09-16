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

let initPromise = null;

async function initSchema() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      let pgSchema = schema
        .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
        .replace(/datetime\('now'\)/g, 'CURRENT_TIMESTAMP')
        .replace(/datetime\('now',\s*'\+2 hours'\)/g, "CURRENT_TIMESTAMP + INTERVAL '2 hours'")
        .replace(/REAL/g, 'FLOAT');
      
      try {
        await pool.query(pgSchema);
      } catch (err) {
        if (err.code !== '23505') throw err;
      }

      // Pre-seed default component relations if table is empty
      try {
        const existing = await pool.query("SELECT COUNT(*) as count FROM component_relations");
        if (parseInt(existing.rows[0]?.count || "0", 10) === 0) {
          const defaultRelations = [
            ["cr_seed_01", "ESP32 DevKit V1", "MPU-6050 6-DoF IMU", "I2C (0x68)", "3.3V Logic", "IoT & Embedded Bench B3", 80, "active", "Telemetry drone IMU bus corridor"],
            ["cr_seed_02", "Arduino Uno R3", "4-Channel Opto Relay", "GPIO / PWM", "5.0V Logic", "Robotics Lab Locker #14", 240, "active", "Automation bench load control relay corridor"],
            ["cr_seed_03", "Raspberry Pi 4", "OLED SSD1306 128x64", "I2C (0x3C)", "3.3V Logic", "VLSI Research Station #07", 45, "verified", "Station telemetry display bus"],
            ["cr_seed_04", "STM32 Nucleo-F401", "LoRa SX1278 433MHz", "SPI (Bus 1)", "3.3V Logic", "RF Telemetry Station #02", 120, "active", "Campus long-range sensor mesh corridor"],
            ["cr_seed_05", "Arduino Mega 2560", "L298N Dual H-Bridge", "PWM / Direction", "12V Power Rail", "Power Electronics Bay 2", 450, "active", "Heavy robotics rover locomotion rail"]
          ];
          for (const rel of defaultRelations) {
            await pool.query(
              `INSERT INTO component_relations (id, source_component, target_device, interface_bus, voltage_domain, lab_station, current_draw_ma, status, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO NOTHING`,
              rel
            );
          }
        }
      } catch (err) {
        // ignore
      }

      return database;
    } catch (e) {
      initPromise = null;
      throw e;
    }
  })();

  return initPromise;
}

module.exports = { db: database, initSchema, pool };
