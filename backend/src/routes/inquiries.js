/**
 * inquiries.js (v2.0)
 * -------------------
 * Endpoints for broadcast availability inquiries.
 */
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const matchingService = require("../services/matchingService");
const { db } = require("../db");

const router = express.Router();

// POST /api/inquiries — Buyer broadcasts an availability inquiry
router.post("/", requireAuth, async (req, res) => {
  try {
    const result = matchingService.createInquiry(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// GET /api/inquiries/mine — Buyer views their posted inquiries
router.get("/mine", requireAuth, async (req, res) => {
  const inquiries = await db.prepare(
    `SELECT i.*, 
            (SELECT COUNT(*) FROM inquiry_responses WHERE inquiry_id = i.id) as response_count
     FROM inquiries i 
     WHERE i.buyer_id = ? 
     ORDER BY i.created_at DESC`
  ).all(req.user.id);

  // Attach responses if open or matched
  const result = await Promise.all(inquiries.map(async (inq) => {
    const responses = await db.prepare(
      `SELECT ir.*, u.name as seller_name, u.department as seller_department, u.rating_avg as seller_rating,
              l.item_name as listing_name
       FROM inquiry_responses ir
       JOIN users u ON u.id = ir.seller_id
       LEFT JOIN listings l ON l.id = ir.listing_id
       WHERE ir.inquiry_id = ?
       ORDER BY ir.created_at DESC`
    ).all(inq.id);
    return { ...inq, responses };
  }));

  res.json(result);
});

// GET /api/inquiries/incoming — Seller views broadcast inquiries relevant to them
router.get("/incoming", requireAuth, async (req, res) => {
  // Find open inquiries matching categories seller has available listings in
  const sellerCategories = await db.prepare(
    `SELECT DISTINCT category FROM listings WHERE seller_id = ? AND status = 'available'`
  ).all(req.user.id).map(c => c.category);

  if (sellerCategories.length === 0) {
    // If seller has no active listings, return empty or open inquiries
    return res.json([]);
  }

  const placeholders = sellerCategories.map(() => "?").join(",");
  const query = `
    SELECT i.*, u.name as buyer_name, u.department as buyer_department,
           (SELECT id FROM inquiry_responses WHERE inquiry_id = i.id AND seller_id = ?) as my_response_id
    FROM inquiries i
    JOIN users u ON u.id = i.buyer_id
    WHERE i.status = 'open' 
      AND i.buyer_id != ?
      AND (i.category IN (${placeholders}) OR i.category = 'Any')
    ORDER BY i.created_at DESC
  `;

  const inquiries = await db.prepare(query).all(req.user.id, req.user.id, ...sellerCategories);
  res.json(inquiries);
});

// POST /api/inquiries/:id/respond — Seller responds to an inquiry
router.post("/:id/respond", requireAuth, async (req, res) => {
  try {
    const result = matchingService.respondToInquiry(req.params.id, req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// POST /api/inquiries/:id/accept-response — Buyer accepts a seller's response
router.post("/:id/accept-response", requireAuth, async (req, res) => {
  try {
    const { response_id } = req.body;
    const result = matchingService.acceptInquiryResponse(req.params.id, response_id, req.user.id);
    res.json(result);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// DELETE /api/inquiries/:id — Buyer or admin can delete inquiry and cascade responses
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const inq = await db.prepare("SELECT * FROM inquiries WHERE id = ?").get(req.params.id);
    if (!inq) return res.status(404).json({ error: "Inquiry not found." });
    if (inq.buyer_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not your inquiry." });
    }

    // Cascade delete responses
    await db.prepare("DELETE FROM inquiry_responses WHERE inquiry_id = ?").run(req.params.id);
    await db.prepare("DELETE FROM inquiries WHERE id = ?").run(req.params.id);
    res.json({ ok: true, deletedId: req.params.id, message: "Inquiry and responses deleted." });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Helper for CSV parsing
function parseInquiriesCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"' || char === "'") inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else current += char;
    }
    values.push(current.trim().replace(/^["']|["']$/g, ""));
    const rowObj = {};
    headers.forEach((h, idx) => { rowObj[h] = values[idx] !== undefined ? values[idx] : ""; });
    rows.push(rowObj);
  }
  return rows;
}

// POST /api/inquiries/upload — batch ingest broadcast inquiries
router.post("/upload", requireAuth, async (req, res) => {
  try {
    let items = [];
    if (Array.isArray(req.body)) items = req.body;
    else if (typeof req.body === "string") items = parseInquiriesCsv(req.body);
    else if (req.body && req.body.csv) items = parseInquiriesCsv(req.body.csv);
    else if (req.body && Array.isArray(req.body.data)) items = req.body.data;
    else if (req.body && typeof req.body.data === "string") items = parseInquiriesCsv(req.body.data);

    if (!items || items.length === 0) return res.status(400).json({ error: "No records found in payload." });

    const { v4: uuid } = require("uuid");
    const inserted = [];
    for (const item of items) {
      const id = item.id || uuid();
      const query = item.item_query || item.item_name || item.query;
      if (!query) continue;

      const category = item.category || "Any";
      const needed_by = item.needed_by_date || item.needed_by || "Flexible";
      const budget = parseInt(item.max_budget || item.budget || "0", 10) || 0;
      const notes = item.notes || "";

      await db.prepare(
        `INSERT INTO inquiries (id, buyer_id, item_query, category, needed_by_date, max_budget, notes, status, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP + INTERVAL '2 days')
         ON CONFLICT (id) DO UPDATE SET
           item_query = EXCLUDED.item_query,
           category = EXCLUDED.category,
           needed_by_date = EXCLUDED.needed_by_date,
           max_budget = EXCLUDED.max_budget,
           notes = EXCLUDED.notes`
      ).run(id, req.user.id, query, category, needed_by, budget, notes);

      inserted.push({ id, item_query: query, category, budget });
    }

    res.status(201).json({
      ok: true,
      count: inserted.length,
      message: `Successfully ingested ${inserted.length} broadcast inquiries.`,
      records: inserted
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
