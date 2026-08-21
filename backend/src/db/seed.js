/**
 * Populates the DB with realistic demo data — same shape as the frontend
 * prototype used for the LinkedIn/showcase demo, but now backed by real rows.
 * Run with: npm run seed
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const { db, initSchema } = require("./index");

initSchema();

const PASSWORD = "demo1234";

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const users = [
    { name: "Aravind K", email: "aravind.k@college.edu", phone: "9876543210", department: "ECE", year: "2nd yr" },
    { name: "Divya S", email: "divya.s@college.edu", phone: "9876500011", department: "Mechatronics", year: "1st yr" },
    { name: "Rohit M", email: "rohit.m@college.edu", phone: "9876500022", department: "Robotics Club", year: "3rd yr" },
    { name: "Sneha R", email: "sneha.r@college.edu", phone: "9876500033", department: "EEE", year: "2nd yr" },
    { name: "Admin User", email: "admin@college.edu", phone: "9000000000", department: "—", year: "—", role: "admin" },
  ];

  const userIds = {};
  for (const u of users) {
    const id = uuid();
    userIds[u.name] = id;
    db.prepare(
      `INSERT OR IGNORE INTO users (id, name, email, phone, department, year, role, password_hash, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(id, u.name, u.email, u.phone, u.department, u.year, u.role || "student", hash);
  }

  const listings = [
    { seller: "Aravind K", item_name: "Arduino Uno R3 (original)", category: "Microcontrollers", condition_notes: "Working, minor scratches", price: 350 },
    { seller: "Divya S", item_name: "HC-SR04 Ultrasonic Sensor x3", category: "Sensors", condition_notes: "New, unused", price: 150 },
    { seller: "Rohit M", item_name: "12V DC Geared Motor (pair)", category: "Motors & Actuators", condition_notes: "Used, works fine", price: 220 },
    { seller: "Sneha R", item_name: "Full Robotics Elective Kit (line follower)", category: "Full Kits", condition_notes: "Complete, tested", price: 900 },
  ];

  for (const l of listings) {
    db.prepare(
      `INSERT INTO listings (id, seller_id, item_name, category, condition_notes, price, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+60 days'))`
    ).run(uuid(), userIds[l.seller], l.item_name, l.category, l.condition_notes, l.price);
  }

  console.log("Seed complete.");
  console.log(`Demo login for any user above: <email> / ${PASSWORD}`);
}

seed();
