require("dotenv").config();
const { startApp } = require("./app");
const matchingService = require("./services/matchingService");
const { sweepExpiredListings } = require("./routes/listings");

const PORT = process.env.PORT || 4000;

(async () => {
  await startApp();

  const app = require("./app");
  app.listen(PORT, () => {
    console.log(`CampusSearch API v1.1 running on http://localhost:${PORT}`);
  });

  // Scheduled sweeps — handle the "no response" and "no-show" timeout edge cases
  const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
  setInterval(() => {
    try {
      matchingService.sweepExpiredRequests();
      sweepExpiredListings();
    } catch (e) {
      console.error("Sweep job failed:", e);
    }
  }, SWEEP_INTERVAL_MS);
})();
