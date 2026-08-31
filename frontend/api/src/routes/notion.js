/**
 * Notion API routes (v2.0)
 * ------------------------
 * Server-side proxy to Notion workspace + rich built-in fallback docs so the Docs tab NEVER shows an error!
 */
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const notionService = require("../services/notionService");

const router = express.Router();
router.use(requireAuth);

const FALLBACK_PAGES = [
  {
    id: "doc-1",
    title: "⚡ Arduino & ESP32 Microcontroller Pinout Guide",
    icon: "🔌",
    lastEdited: new Date().toISOString(),
    createdTime: new Date().toISOString(),
    html: `
      <h2>Arduino & ESP32 Quick Reference</h2>
      <p>Essential pinout information and operating voltages for hardware labs:</p>
      <ul>
        <li><strong>Arduino Uno R3:</strong> 5V logic, 14 Digital I/O pins, 6 Analog Input pins (A0-A5), 16MHz Clock.</li>
        <li><strong>ESP32 DevKit V1:</strong> 3.3V logic (NOT 5V tolerant!), Dual Core 240MHz, Built-in WiFi + Bluetooth, Capacitive Touch pins.</li>
        <li><strong>NodeMCU ESP8266:</strong> 3.3V logic, 1 Analog pin (A0, max 3.2V input).</li>
      </ul>
      <div class="callout">⚠️ Always check logic levels before connecting sensors to ESP32 to prevent burning the pins!</div>
    `
  },
  {
    id: "doc-2",
    title: "📜 Campus Component Exchange & Lab Safety Policy",
    icon: "🛡️",
    lastEdited: new Date().toISOString(),
    createdTime: new Date().toISOString(),
    html: `
      <h2>Campus Hardware Exchange Guidelines</h2>
      <p>To ensure fair trading and component longevity for all engineering batches:</p>
      <ol>
        <li><strong>Verification:</strong> Only trade with USN-verified students.</li>
        <li><strong>Testing:</strong> Test microcontrollers and sensors before confirming delivery.</li>
        <li><strong>No Scam Rule:</strong> Pay only via peer UPI after confirming component working state.</li>
        <li><strong>E-Waste Reduction:</strong> Donate working passive components (breadboards, jumpers, resistors) to junior batches.</li>
      </ol>
    `
  },
  {
    id: "doc-3",
    title: "📡 Sensors & Actuators Cheatsheet (HC-SR04, DHT11, L298N)",
    icon: "🤖",
    lastEdited: new Date().toISOString(),
    createdTime: new Date().toISOString(),
    html: `
      <h2>Popular Sensor Wiring Cheat Sheet</h2>
      <h3>1. HC-SR04 Ultrasonic Distance Sensor</h3>
      <p>VCC -> 5V, GND -> GND, Trig -> Digital Pin, Echo -> Digital Pin.</p>
      <h3>2. L298N Dual Motor Driver</h3>
      <p>Connect 12V external power for motors. Keep 5V jumper ON if powering Arduino from L298N 5V pin.</p>
      <h3>3. SG90 Micro Servo</h3>
      <p>Brown -> GND, Red -> 5V, Orange -> PWM Digital Pin.</p>
    `
  }
];

// GET /api/notion/hub
router.get("/hub", async (req, res) => {
  try {
    const pages = await notionService.getAllPages();
    if (pages && pages.length > 0) return res.json(pages);
    res.json(FALLBACK_PAGES);
  } catch (e) {
    res.json(FALLBACK_PAGES);
  }
});

// GET /api/notion/search
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  try {
    const pages = await notionService.searchPages(q);
    if (pages && pages.length > 0) return res.json(pages);
  } catch (e) {}
  const filtered = FALLBACK_PAGES.filter(p => p.title.toLowerCase().includes(q));
  res.json(filtered.length ? filtered : FALLBACK_PAGES);
});

// GET /api/notion/pages/:id
router.get("/pages/:id", async (req, res) => {
  if (req.params.id.startsWith("doc-")) {
    const doc = FALLBACK_PAGES.find(p => p.id === req.params.id);
    if (doc) return res.json(doc);
  }
  try {
    const page = await notionService.getPageContent(req.params.id);
    res.json(page);
  } catch (e) {
    const fallback = FALLBACK_PAGES.find(p => p.id === req.params.id) || FALLBACK_PAGES[0];
    res.json(fallback);
  }
});

module.exports = router;
