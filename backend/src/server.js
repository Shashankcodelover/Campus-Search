require("dotenv").config();
const app = require("./app");
const matchingService = require("./services/matchingService");
const { sweepExpiredListings } = require("./routes/listings");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`CampusSearch API running on http://localhost:${PORT}`);
});

// Scheduled sweeps — handle the "no response" and "no-show" timeout edge cases
// without needing a separate worker process for a prototype of this size.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
setInterval(() => {
  try {
    matchingService.sweepExpiredRequests();
    sweepExpiredListings();
  } catch (e) {
    console.error("Sweep job failed:", e);
  }
}, SWEEP_INTERVAL_MS);
