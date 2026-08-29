const { pool } = require('./src/db/index');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function wipeAndSeed() {
  console.log('Starting DB wipe and seed...');
  try {
    const tables = ['flags', 'ratings', 'fee_ledger', 'notifications', 'messages', 'payment_intents', 'inquiry_responses', 'inquiries', 'wishlists', 'requests', 'listings', 'users'];
    for (let table of tables) {
      await pool.query('TRUNCATE TABLE ' + table + ' CASCADE');
    }

    const userId = uuidv4();
    const passHash = await bcrypt.hash('8s4h2006@sh', 10);
    
    await pool.query(
      "INSERT INTO users (id, name, email, department, year, usn, phone, password_hash, verified, admin_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1)",
      [
        userId,
        'Shashank J',
        'shashankshashi831431@gmail.com',
        'ECE',
        '2',
        '02JST24UCS100',
        '9449478126',
        passHash
      ]
    );

    const items = [
      { name: 'Arduino Uno R3 (SMD Variant)', category: 'Microcontrollers', price: 450, desc: 'The central microcontroller board that reads data from your sensors and sends control commands. Good condition.' },
      { name: 'GY-521 MPU-6050 Accelerometer & Gyroscope', category: 'Sensors', price: 150, desc: 'Measures 3D acceleration, tilt angle, and rotational orientation to help track motion or balance your robot.' },
      { name: 'IR Flame Sensor Module', category: 'Sensors', price: 100, desc: 'Uses an optical infrared receiver to look for the light wavelength of an active open flame for automated fire detection.' },
      { name: 'DC Mini Submersible Water Pump', category: 'Motors & Actuators', price: 120, desc: 'Pushes water through a flexible tube when powered by a 3V–6V source, serving as a mechanical extinguisher.' },
      { name: 'L298N Dual H-Bridge Motor Driver Module', category: 'Motors & Actuators', price: 180, desc: 'Handles the high current needed to drive your wheels and pump, acting as the bridge between your Arduino commands.' },
      { name: 'Dual-Shaft BO Gear Motors (Pair)', category: 'Motors & Actuators', price: 150, desc: 'Provides geared mechanical rotation to move your smart car vehicle structure forward, backward, or in turns.' },
      { name: '65mm Robot Smart Car Wheels (Pair)', category: 'Passive Components', price: 100, desc: 'Mounts onto the motor shafts to deliver high-traction physical mobility across ground surfaces.' }
    ];

    for (let item of items) {
      await pool.query(
        "INSERT INTO listings (id, seller_id, item_name, category, description, price, quantity, status) VALUES ($1, $2, $3, $4, $5, $6, 1, 'available')",
        [uuidv4(), userId, item.name, item.category, item.desc, item.price]
      );
    }

    console.log('Done successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
wipeAndSeed();
