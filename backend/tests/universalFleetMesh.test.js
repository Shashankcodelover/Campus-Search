const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { startApp } = require('../src/app');

let server;
let baseUrl;
let authToken;
let adminToken;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.token) {
      reqOptions.headers['Authorization'] = `Bearer ${options.token}`;
    }

    let body = options.body;
    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
    } else if (body && typeof body === 'string' && !reqOptions.headers['Content-Type']) {
      reqOptions.headers['Content-Type'] = 'text/plain';
    }

    const req = http.request(url, reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch {
          json = rawData;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('CampusSearch Enterprise Universal Deletion, Uploadation & Topology Mesh Tests', () => {
  before(async () => {
    const app = await startApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Authenticate demo user and admin
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'aravind.k@college.edu', password: 'password123' }
    });
    if (loginRes.data && loginRes.data.token) {
      authToken = loginRes.data.token;
    } else {
      // Try demo1234
      const retry = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'aravind.k@college.edu', password: 'demo1234' }
      });
      authToken = retry.data?.token;
    }

    const adminRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'demo1234' }
    });
    adminToken = adminRes.data?.token;
  });

  after((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('1. GET /api/component-relations — returns active hardware topology corridors', async () => {
    const res = await request('/api/component-relations');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data), 'Expected array of component relations');
    assert.ok(res.data.length >= 1, 'Expected at least 1 seeded corridor');
    assert.ok(res.data[0].source_component, 'Expected source_component field');
    assert.ok(res.data[0].interface_bus, 'Expected interface_bus field');
  });

  test('2. GET /api/component-relations/metrics — returns live mesh telemetry', async () => {
    const res = await request('/api/component-relations/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.data.total === 'number');
    assert.ok(typeof res.data.active === 'number');
    assert.ok(typeof res.data.totalCurrentDrawMa === 'number');
  });

  test('3. POST /api/component-relations — provisions new hardware topology corridor', async () => {
    const payload = {
      source_component: 'ESP32-S3 WROOM-1',
      target_device: 'BME280 Environmental Sensor',
      interface_bus: 'I2C (0x76)',
      voltage_domain: '3.3V Logic',
      lab_station: 'Climate Telemetry Station #09',
      current_draw_ma: 65,
      status: 'active',
      notes: 'Atmospheric pressure and humidity bus'
    };
    const res = await request('/api/component-relations', {
      method: 'POST',
      body: payload
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.source_component, payload.source_component);
    assert.strictEqual(res.data.target_device, payload.target_device);
    assert.strictEqual(res.data.interface_bus, payload.interface_bus);
  });

  test('4. DELETE /api/component-relations/:id — severs corridor from mesh', async () => {
    // Create temporary corridor
    const createRes = await request('/api/component-relations', {
      method: 'POST',
      body: {
        source_component: 'Teensy 4.1',
        target_device: 'CAN Transceiver MCP2551',
        interface_bus: 'CAN Bus 2.0B',
        voltage_domain: '5.0V Logic',
        lab_station: 'Automotive Bench A1'
      }
    });
    assert.strictEqual(createRes.status, 201);
    const id = createRes.data.id;

    // Sever it
    const delRes = await request(`/api/component-relations/${id}`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.ok, true);
    assert.strictEqual(delRes.data.severedId, id);
  });

  test('5. POST /api/component-relations/upload — batch ingests corridors via CSV', async () => {
    const csv = `source_component,target_device,interface_bus,voltage_domain,lab_station,current_draw_ma,status
RP2040 Pico,VL53L0X ToF Lidar,I2C (0x29),3.3V Logic,Optics Lab #03,20,active
STM32F4,TFT SPI Display 2.4in,SPI (Bus 0),3.3V Logic,Embedded Bench B1,110,active`;

    const res = await request('/api/component-relations/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.ok, true);
    assert.strictEqual(res.data.count, 2);
  });

  test('6. POST /api/listings/upload — batch ingests component listings (CSV)', async () => {
    if (!authToken) return;
    const csv = `item_name,category,price,quantity,condition_notes,description,listing_type
ESP8266 WeMos D1,Microcontrollers,180,3,Brand new in antistatic pack,WiFi IoT development board,sale
MPU9250 9-Axis IMU,Sensors,220,2,Tested working,Gyro + accel + magnetometer breakout,sale`;

    const res = await request('/api/listings/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.ok, true);
    assert.strictEqual(res.data.count, 2);
  });

  test('7. DELETE /api/listings/:id?permanent=true — cascades listing and requests', async () => {
    if (!authToken) return;
    // Create a listing to delete
    const uploadRes = await request('/api/listings/upload', {
      method: 'POST',
      token: authToken,
      body: [{ item_name: 'Test Transistor Pack 2N2222', category: 'Passive Components', price: 20 }]
    });
    assert.strictEqual(uploadRes.status, 201);
    const listingId = uploadRes.data.records[0].id;

    // Delete permanently
    const delRes = await request(`/api/listings/${listingId}?permanent=true`, {
      method: 'DELETE',
      token: authToken
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.ok, true);
    assert.strictEqual(delRes.data.permanent, true);

    // Verify it is gone
    const checkRes = await request(`/api/listings/${listingId}`);
    assert.strictEqual(checkRes.status, 404);
  });

  test('8. POST /api/wishlists/upload & DELETE /api/wishlists/:id', async () => {
    if (!authToken) return;
    const csv = `item_name,category,max_budget,notes
Teensy 4.0,Microcontrollers,800,Need for DSP audio synthesis
Logic Analyzer 8-Ch,Tools,600,USB 24MHz 8-channel wanted`;

    const uploadRes = await request('/api/wishlists/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(uploadRes.status, 201);
    assert.strictEqual(uploadRes.data.count, 2);
    const itemToDelete = uploadRes.data.records[0].id;

    const delRes = await request(`/api/wishlists/${itemToDelete}`, {
      method: 'DELETE',
      token: authToken
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.ok, true);
  });

  test('9. POST /api/inquiries/upload & DELETE /api/inquiries/:id', async () => {
    if (!authToken) return;
    const csv = `item_query,category,needed_by_date,max_budget,notes
NRF24L01 Wireless Transceiver,Sensors,Friday 4 PM,250,Need 2 pieces for wireless telemetry`;

    const uploadRes = await request('/api/inquiries/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(uploadRes.status, 201);
    assert.strictEqual(uploadRes.data.count, 1);
    const inqId = uploadRes.data.records[0].id;

    const delRes = await request(`/api/inquiries/${inqId}`, {
      method: 'DELETE',
      token: authToken
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.ok, true);
  });

  test('10. GET & POST /api/admin/users/upload & DELETE /api/admin/users/:id', async () => {
    if (!adminToken) return;
    // List users
    const usersRes = await request('/api/admin/users', { token: adminToken });
    assert.strictEqual(usersRes.status, 200);
    assert.ok(Array.isArray(usersRes.data));

    // Upload new user
    const csv = `name,email,usn,department,year,role
Vikram Singhania,vikram.singh@college.edu,1SK24EC099,ECE,1st yr,student`;

    const upRes = await request('/api/admin/users/upload', {
      method: 'POST',
      token: adminToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(upRes.status, 201);
    assert.strictEqual(upRes.data.count, 1);
    const newUserId = upRes.data.records[0].id;

    // Delete user
    const delRes = await request(`/api/admin/users/${newUserId}`, {
      method: 'DELETE',
      token: adminToken
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.ok, true);
  });
});
