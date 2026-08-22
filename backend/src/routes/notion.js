/**
 * Notion API routes
 * ------------------
 * Server-side proxy so the Notion API key never reaches the client.
 * All endpoints require authentication (logged-in campus users only).
 */
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const notionService = require("../services/notionService");

const router = express.Router();
router.use(requireAuth);

// GET /api/notion/hub — all pages for the knowledge-base listing
router.get("/hub", async (req, res) => {
  try {
    const pages = await notionService.getAllPages();
    res.json(pages);
  } catch (e) {
    console.error("[notion] hub error:", e.message);
    res.status(502).json({ error: "Could not load Notion pages. Check the API key configuration." });
  }
});

// GET /api/notion/search?q=<query>
router.get("/search", async (req, res) => {
  try {
    const pages = await notionService.searchPages(req.query.q || "");
    res.json(pages);
  } catch (e) {
    console.error("[notion] search error:", e.message);
    res.status(502).json({ error: "Notion search failed." });
  }
});

// GET /api/notion/pages/:id — rendered page content
router.get("/pages/:id", async (req, res) => {
  try {
    const page = await notionService.getPageContent(req.params.id);
    res.json(page);
  } catch (e) {
    console.error("[notion] page error:", e.message);
    res.status(502).json({ error: "Could not load this page from Notion." });
  }
});

module.exports = router;
