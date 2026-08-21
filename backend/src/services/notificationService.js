/**
 * notificationService
 * --------------------
 * Deliberately abstracted behind one function so the *business logic*
 * (matchingService) never talks to a specific SMS/push provider directly.
 *
 * Dev/demo mode: logs to console.
 * Production: swap sendViaConsole for sendViaTwilio / sendViaFCM below,
 * without changing any code that calls notify().
 *
 * This matters because in planning we deferred building the "automated
 * SMS to seller" feature until real usage numbers justify the per-message
 * cost (Twilio/MSG91 etc.) — this interface means that swap is a
 * one-function change, not a rewrite.
 */

function sendViaConsole(user, payload) {
  console.log(`[notify] -> ${user.name} (${user.phone}) :: ${payload.type} :: ${payload.message}`);
  return Promise.resolve({ ok: true, channel: "console-dev" });
}

// Example of what a real provider swap looks like — inactive until
// TWILIO_SID / TWILIO_TOKEN are set in .env, see README.
async function sendViaTwilio(user, payload) {
  // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // return client.messages.create({
  //   body: payload.message,
  //   from: process.env.TWILIO_FROM,
  //   to: `+91${user.phone}`,
  // });
  throw new Error("Twilio not configured — set TWILIO_SID/TWILIO_TOKEN or keep using console mode for demo.");
}

async function notify(user, payload) {
  const provider = process.env.NOTIFY_PROVIDER || "console";
  if (provider === "twilio") return sendViaTwilio(user, payload);
  return sendViaConsole(user, payload);
}

module.exports = { notify };
