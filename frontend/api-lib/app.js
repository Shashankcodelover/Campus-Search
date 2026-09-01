const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { initSchema } = require("./db");

const app = express();

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Allow inline SVG / images / dev resources
const allowedOrigins = [
  "http://shashankj.tech",
  "https://shashankj.tech",
  "https://campus-search-theta.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".shashankj.tech") || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "15mb" })); // Base64 ID photos & listing image uploads
app.use(morgan("dev"));

// Rate limiting — 2000 requests per 15 min window, ignore notification polling
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  skip: (req) => req.path.includes("/notifications/unread-count") || req.path.includes("/notifications/stream"),
  message: { error: "Too many requests from this IP, please try again later." },
});
app.use("/api/", limiter);


// DB init is async with sql.js (WASM), so block requests until DB is ready
let dbReady = false;

let dbInitPromise = null;

app.use(async (req, res, next) => {
  if (!dbReady && !dbInitPromise) {
    dbInitPromise = startApp().catch(e => { console.error("DB Init Failed:", e); dbInitPromise = null; });
  }
  if (!dbReady) {
    await dbInitPromise;
  }
  next();
});
});

// Core routes (v1.0)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/admin", require("./routes/admin"));

// Expanded routes (v1.1)
app.use("/api/notion", require("./routes/notion"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/wishlists", require("./routes/wishlists"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/messages", require("./routes/messages"));

// Production upgrade routes (v2.0)
app.use("/api/inquiries", require("./routes/inquiries"));
app.use("/api/payments", require("./routes/payments"));

app.get("/", (req, res) => res.json({ ok: true, name: "CampusSearch API", version: "2.0.0", dbReady }));
app.get("/health", (req, res) => res.json({ ok: true, version: "2.0.0", dbReady }));
app.get("/api/health", (req, res) => res.json({ ok: true, version: "2.0.0", dbReady }));

app.use((err, req, res, next) => {

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

async function startApp() {
  await initSchema();
  dbReady = true;
  console.log("Database initialized (v2.0).");
  return app;
}

module.exports = app;
module.exports.startApp = startApp;

