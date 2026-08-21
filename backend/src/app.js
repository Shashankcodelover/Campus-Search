const express = require("express");
const cors = require("cors");
const { initSchema } = require("./db");

initSchema();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong." });
});

module.exports = app;
