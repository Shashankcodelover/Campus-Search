const express = require("express");
const { v4: uuid } = require("uuid");
const { db, pool } = require("../db");

const router = express.Router();

/**
 * Helper to parse CSV into rows of objects
 */
function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Regex matches quoted strings or unquoted tokens
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ""));

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx] : "";
    });
    rows.push(rowObj);
  }
  return rows;
}

// GET /api/component-relations — list all active hardware topology corridors
router.get("/", async (req, res) => {
  try {
    const { status, interface_bus, lab_station, search } = req.query;
    let query = `SELECT * FROM component_relations WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (interface_bus) {
      query += ` AND interface_bus = ?`;
      params.push(interface_bus);
    }
    if (lab_station) {
      query += ` AND lab_station = ?`;
      params.push(lab_station);
    }
    if (search) {
      query += ` AND (source_component ILIKE ? OR target_device ILIKE ? OR lab_station ILIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;
    const relations = await db.prepare(query).all(...params);
    res.json(relations || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/component-relations/metrics — live metrics for the topology mesh
router.get("/metrics", async (req, res) => {
  try {
    const total = await db.prepare("SELECT COUNT(*) as count FROM component_relations").get();
    const active = await db.prepare("SELECT COUNT(*) as count FROM component_relations WHERE status = 'active'").get();
    const verified = await db.prepare("SELECT COUNT(*) as count FROM component_relations WHERE status = 'verified'").get();
    const stations = await db.prepare("SELECT COUNT(DISTINCT lab_station) as count FROM component_relations").get();
    const sumDraw = await db.prepare("SELECT COALESCE(SUM(current_draw_ma), 0) as sum_draw FROM component_relations WHERE status = 'active'").get();

    res.json({
      total: parseInt(total?.count || "0", 10),
      active: parseInt(active?.count || "0", 10),
      verified: parseInt(verified?.count || "0", 10),
      uniqueStations: parseInt(stations?.count || "0", 10),
      totalCurrentDrawMa: parseInt(sumDraw?.sum_draw || "0", 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/component-relations — provision new hardware topology corridor
router.post("/", async (req, res) => {
  try {
    const {
      source_component,
      target_device,
      interface_bus = "I2C (0x68)",
      voltage_domain = "3.3V Logic",
      lab_station = "IoT & Embedded Bench B3",
      current_draw_ma = 120,
      status = "active",
      notes = ""
    } = req.body;

    if (!source_component || !target_device) {
      return res.status(400).json({ error: "source_component and target_device are required." });
    }

    const id = "cr_" + uuid().substring(0, 8);
    await db.prepare(
      `INSERT INTO component_relations (id, source_component, target_device, interface_bus, voltage_domain, lab_station, current_draw_ma, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, source_component, target_device, interface_bus, voltage_domain, lab_station, parseInt(current_draw_ma, 10) || 100, status, notes);

    const created = await db.prepare("SELECT * FROM component_relations WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/component-relations/:id — sever / dissolve corridor
router.delete("/:id", async (req, res) => {
  try {
    const existing = await db.prepare("SELECT * FROM component_relations WHERE id = ?").get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Hardware topology corridor not found." });
    }

    await db.prepare("DELETE FROM component_relations WHERE id = ?").run(req.params.id);
    res.json({ ok: true, severedId: req.params.id, message: "Corridor severed and removed from topology mesh." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/component-relations/upload — batch ingest hardware topology mesh corridors (CSV or JSON)
router.post("/upload", async (req, res) => {
  try {
    let items = [];
    if (Array.isArray(req.body)) {
      items = req.body;
    } else if (typeof req.body === "string") {
      items = parseCsv(req.body);
    } else if (req.body && req.body.csv) {
      items = parseCsv(req.body.csv);
    } else if (req.body && Array.isArray(req.body.data)) {
      items = req.body.data;
    } else if (req.body && typeof req.body.data === "string") {
      items = parseCsv(req.body.data);
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No records found in upload payload. Provide CSV string or JSON array." });
    }

    const inserted = [];
    for (const item of items) {
      const id = item.id || ("cr_" + uuid().substring(0, 8));
      const source = item.source_component || item.source || item.sourceComponent;
      const target = item.target_device || item.target || item.targetDevice;
      if (!source || !target) continue;

      const bus = item.interface_bus || item.interface || item.bus || "I2C (0x3C)";
      const domain = item.voltage_domain || item.voltage || "3.3V Logic";
      const station = item.lab_station || item.station || "General Lab Station";
      const draw = parseInt(item.current_draw_ma || item.draw || "120", 10) || 120;
      const status = item.status || "active";
      const notes = item.notes || item.description || "";

      await db.prepare(
        `INSERT INTO component_relations (id, source_component, target_device, interface_bus, voltage_domain, lab_station, current_draw_ma, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           source_component = EXCLUDED.source_component,
           target_device = EXCLUDED.target_device,
           interface_bus = EXCLUDED.interface_bus,
           voltage_domain = EXCLUDED.voltage_domain,
           lab_station = EXCLUDED.lab_station,
           current_draw_ma = EXCLUDED.current_draw_ma,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes`
      ).run(id, source, target, bus, domain, station, draw, status, notes);

      inserted.push({ id, source, target, bus, station });
    }

    res.status(201).json({
      ok: true,
      count: inserted.length,
      message: `Successfully ingested ${inserted.length} hardware topology corridors.`,
      records: inserted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
