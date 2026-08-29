const { startApp } = require('./src/app');
const matchingService = require('./src/services/matchingService');
const { sweepExpiredListings } = require('./src/routes/listings');

(async () => {
  await startApp();
  console.log('Running sweepExpiredRequests()...');
  try {
    await matchingService.sweepExpiredRequests();
    console.log('sweepExpiredRequests OK');
  } catch (e) {
    console.error('sweepExpiredRequests FAILED', e);
  }

  console.log('Running sweepExpiredListings()...');
  try {
    await sweepExpiredListings();
    console.log('sweepExpiredListings OK');
  } catch (e) {
    console.error('sweepExpiredListings FAILED', e);
  }

  process.exit(0);
})();
