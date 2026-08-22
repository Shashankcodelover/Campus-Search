const express = require("express");
const cors = require("cors");
const { initSchema } = require("./db");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // increased for base64 image uploads

// DB init is async with sql.js (WASM), so we defer route registration
let dbReady = false;

// Middleware to block requests until DB is ready
app.use((req, res, next) => {
  if (dbReady || req.path === "/api/health") return next();
  res.status(503).json({ error: "Server is starting up, please retry in a moment." });
});

// Core routes (v1.0)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/admin", require("./routes/admin"));

// New routes (v1.1)
app.use("/api/notion", require("./routes/notion"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/wishlists", require("./routes/wishlists"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/messages", require("./routes/messages"));

app.get("/api/health", (req, res) => res.json({ ok: true, version: "1.1.0", dbReady }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

// Export app + async init function
async function startApp() {
  await initSchema();
  dbReady = true;
  console.log("Database initialized.");
  return app;
}

module.exports = app;
module.exports.startApp = startApp;
