/**
 * CampusSearch v2.0 seed script
 * Populates the DB with realistic demo data, USNs, and ID verification states.
 * Run with: npm run seed
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const { initSchema } = require("./index");

const PASSWORD = "demo1234";

async function seed() {
  await initSchema();
  const { db } = require("./index");

  const tables = [
    "inquiry_responses", "inquiries", "payment_intents",
    "messages", "notifications", "wishlists", "fee_ledger",
    "ratings", "flags", "requests", "listings", "users"
  ];
  for (const t of tables) {
    try { db.exec(`DELETE FROM ${t}`); } catch (e) {}
  }

  const hash = await bcrypt.hash(PASSWORD, 10);

  const users = [
    { name: "Aravind K", email: "aravind.k@college.edu", phone: "9876543210", department: "ECE", year: "2nd yr", usn: "1SK22EC014", bio: "ECE student, robotics enthusiast. Built 3 projects with Arduino." },
    { name: "Divya S", email: "divya.s@college.edu", phone: "9876500011", department: "Mechatronics", year: "1st yr", usn: "1SK23MT008", bio: "First-year mechatronics. Looking for affordable sensors for my first project!" },
    { name: "Rohit M", email: "rohit.m@college.edu", phone: "9876500022", department: "Robotics Club", year: "3rd yr", usn: "1SK21EC045", bio: "Robotics Club president. Happy to donate old parts to new members." },
    { name: "Sneha R", email: "sneha.r@college.edu", phone: "9876500033", department: "EEE", year: "2nd yr", usn: "1SK22EE029", bio: "Power electronics nerd. Always has spare capacitors." },
    { name: "Karthik V", email: "karthik.v@college.edu", phone: "9876500044", department: "CSE", year: "3rd yr", usn: "1SK21CS088", bio: "CS + IoT projects. Built smart irrigation and attendance systems." },
    { name: "Priya M", email: "priya.m@college.edu", phone: "9876500055", department: "IT", year: "1st yr", usn: "1SK23IT041", bio: "New to hardware, eager to learn!" },
    { name: "Sanjay D", email: "sanjay.d@college.edu", phone: "9876500066", department: "Mechanical", year: "4th yr", usn: "1SK20ME012", bio: "Final year, clearing out all my project components before graduation." },
    { name: "Pending Student", email: "newstudent@gmail.com", phone: "9998887770", department: "AIML", year: "1st yr", usn: "1SK23AI099", admin_verified: 0, bio: "Pending ID card review demo." },
    { name: "Admin User", email: "admin@college.edu", phone: "9000000000", department: "Admin", year: "—", usn: "1SK00AD001", role: "admin", bio: "Platform administrator." },
  ];

  const userIds = {};
  for (const u of users) {
    const id = uuid();
    userIds[u.name] = id;
    const isVerified = u.admin_verified !== undefined ? u.admin_verified : 1;
    db.prepare(
      `INSERT INTO users (id, name, email, phone, department, year, usn, role, password_hash, verified, admin_verified, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, u.name, u.email, u.phone, u.department, u.year, u.usn, u.role || "student", hash, isVerified, isVerified, u.bio || "");
  }

  const listings = [
    { seller: "Aravind K", item_name: "Arduino Uno R3 (original)", category: "Microcontrollers", condition_notes: "Working, minor scratches", description: "Genuine Arduino Uno R3. All pins working, USB cable included.", price: 350 },
    { seller: "Aravind K", item_name: "ESP32 DevKit V1 (WROOM-32)", category: "Microcontrollers", condition_notes: "Like new", description: "ESP32 with WiFi+BT, used for IoT workshop.", price: 280 },
    { seller: "Divya S", item_name: "HC-SR04 Ultrasonic Sensor ×3", category: "Sensors", condition_notes: "New, unused", description: "Pack of 3 ultrasonic distance sensors.", price: 150 },
    { seller: "Divya S", item_name: "DHT11 Temperature & Humidity Sensor", category: "Sensors", condition_notes: "Working", description: "Digital temp/humidity sensor with breakout board.", price: 45 },
    { seller: "Rohit M", item_name: "12V DC Geared Motor (pair)", category: "Motors & Actuators", condition_notes: "Used, works fine", description: "Pair of 12V 100RPM geared motors.", price: 220 },
    { seller: "Rohit M", item_name: "SG90 Micro Servo Motor ×4", category: "Motors & Actuators", condition_notes: "Working, slight cable wear", description: "4 micro servos used in robotic arm project.", price: 180 },
    { seller: "Sneha R", item_name: "Full Robotics Elective Kit (line follower)", category: "Full Kits", condition_notes: "Complete, tested", description: "Complete line-follower kit: Arduino, motor driver, IR sensors, chassis, wheels, batteries.", price: 900 },
    { seller: "Sneha R", item_name: "L298N Motor Driver Module", category: "Power & Wiring", condition_notes: "Working", description: "Dual H-bridge motor driver.", price: 120 },
    { seller: "Karthik V", item_name: "Raspberry Pi 3 Model B+", category: "Microcontrollers", condition_notes: "Working, no case", description: "RPi 3B+ with 32GB SD card, power adapter.", price: 1200 },
    { seller: "Karthik V", item_name: "NodeMCU ESP8266 ×2", category: "Microcontrollers", condition_notes: "Working", description: "Pair of NodeMCU boards for WiFi IoT.", price: 200 },
    { seller: "Sanjay D", item_name: "Complete IoT Starter Kit", category: "Full Kits", condition_notes: "Complete with box", description: "Arduino Mega + breadboard + 200 jumpers + resistor kit + LED kit + 10 sensors.", price: 1500 },
    { seller: "Sanjay D", item_name: "Digital Multimeter (DT-830B)", category: "Tools", condition_notes: "Working, battery included", description: "Basic multimeter, perfect for lab.", price: 0 },
    { seller: "Sanjay D", item_name: "Soldering Station (adjustable temp)", category: "Tools", condition_notes: "Good condition", description: "Adjustable temp soldering station with extra tips.", price: 450 },
    { seller: "Rohit M", item_name: "Breadboard 830-point ×3", category: "Passive Components", condition_notes: "New", description: "Three full-size breadboards, unused.", price: 0 },
  ];

  for (const l of listings) {
    db.prepare(
      `INSERT INTO listings (id, seller_id, item_name, category, condition_notes, description, price, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+60 days'))`
    ).run(uuid(), userIds[l.seller], l.item_name, l.category, l.condition_notes, l.description || "", l.price);
  }

  const wishlists = [
    { user: "Priya M", item_name: "Arduino Uno or Mega", category: "Microcontrollers", max_budget: 500, notes: "Need for embedded systems lab next week!" },
    { user: "Divya S", item_name: "Motor Driver L298N", category: "Power & Wiring", max_budget: 200, notes: "For robot project, urgent" },
    { user: "Karthik V", item_name: "Oscilloscope (any)", category: "Tools", max_budget: 3000, notes: "Would rent too" },
  ];

  for (const w of wishlists) {
    db.prepare(
      `INSERT INTO wishlists (id, user_id, item_name, category, max_budget, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuid(), userIds[w.user], w.item_name, w.category, w.max_budget, w.notes);
  }

  // Sample broadcast inquiry
  const sampleInquiryId = uuid();
  db.prepare(
    `INSERT INTO inquiries (id, buyer_id, item_query, category, needed_by_date, max_budget, notes, status, expires_at)
     VALUES (?, ?, 'STM32 Nucleo Board', 'Microcontrollers', 'Tomorrow 2 PM', 600, 'Urgent for Lab Exam', 'open', datetime('now', '+2 hours'))`
  ).run(sampleInquiryId, userIds["Priya M"]);

  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, data_json)
     VALUES (?, ?, 'system', 'Welcome to CampusSearch v2.0!', 'Browse listings, broadcast availability inquiries, and pay via UPI QR.', '{}')`
  ).run(uuid(), userIds["Aravind K"]);

  db._save();

  console.log("\n✅ Seed complete (v2.0).\n");
  console.log("Demo accounts:");
  for (const u of users) {
    console.log(`  ${u.email} / ${PASSWORD} (USN: ${u.usn})${u.role === "admin" ? " [ADMIN]" : ""}${u.admin_verified === 0 ? " [PENDING VERIFICATION]" : ""}`);
  }
  console.log(`\n${listings.length} listings, ${wishlists.length} wishlists, 1 broadcast inquiry created.\n`);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
