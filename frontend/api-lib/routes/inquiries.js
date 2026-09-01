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

module.exports = router;
