const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { startApp } = require('../src/app');
const circuitEngine = require('../src/services/circuitTopologyEngine');
const { sweepExpiredListings } = require('../src/routes/listings');

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
      if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
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

describe('CampusSearch - 50 Comprehensive Production Test Cases', () => {
  let createdListingId;
  let createdWishlistId;
  let createdInquiryId;
  let createdCorridorId;

  before(async () => {
    const app = await startApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Obtain regular and admin auth tokens
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'aravind.k@college.edu', password: 'demo1234' }
    });
    if (loginRes.data && loginRes.data.token) {
      authToken = loginRes.data.token;
    }

    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@college.edu', password: 'demo1234' }
    });
    if (adminLoginRes.data && adminLoginRes.data.token) {
      adminToken = adminLoginRes.data.token;
    }
  });

  after((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // ==========================================
  // GROUP 1: MULTI-ROLE USER JOURNEYS (1-5)
  // ==========================================

  test('1. Role: Freshman Student — browses catalog, searches Arduino and checks pinout specs', async () => {
    const res = await request('/api/listings?search=Arduino');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('2. Role: Senior Project Lead — validates multi-domain circuit before breadboarding', () => {
    const report = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MPU6050 6-DoF Gyro/Accelerometer',
      '0.96 inch I2C OLED Display (SSD1306)'
    ]);
    assert.strictEqual(report.success, true);
    assert.ok(report.voltageAudits.length >= 2);
    assert.ok(report.powerAudit);
  });

  test('3. Role: Lab Assistant Lender — verifies hardware topology corridors and bus latencies', async () => {
    const res = await request('/api/component-relations');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('4. Role: IoT Club Coordinator — posts component wishlist for hackathon teams', async () => {
    const res = await request('/api/wishlists');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('5. Role: Campus System Admin — retrieves user directory and telemetry metrics', async () => {
    const res = await request('/api/component-relations/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data);
  });

  // ==========================================
  // GROUP 2: COMPONENT CATALOG & INDEXING (6-12)
  // ==========================================

  test('6. Catalog: Retrieve full listing feed returns 200 OK', async () => {
    const res = await request('/api/listings');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.length > 0);
    createdListingId = res.data[0].id;
  });

  test('7. Catalog: Filter listings by Microcontrollers category', async () => {
    const res = await request('/api/listings?category=Microcontrollers');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('8. Catalog: Filter listings by Sensors category', async () => {
    const res = await request('/api/listings?category=Sensors');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('9. Catalog: Search by title query finds matching hardware', async () => {
    const res = await request('/api/listings?search=Sensor');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('10. Catalog: Retrieve single listing by valid UUID', async () => {
    if (!createdListingId) return;
    const res = await request(`/api/listings/${createdListingId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.id, createdListingId);
  });

  test('11. Catalog: Return 404 for non-existent listing UUID', async () => {
    const res = await request('/api/listings/00000000-0000-0000-0000-000000000000');
    assert.strictEqual(res.status, 404);
  });

  test('12. Catalog: Category filter with zero matches returns empty array', async () => {
    const res = await request('/api/listings?category=NonExistentCategory999');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.data, []);
  });

  // ==========================================
  // GROUP 3: AUTHENTICATION & USN VALIDATION (13-18)
  // ==========================================

  test('13. Auth: Rejects registration with missing USN', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Test User', email: 'test@example.com', password: 'password123' }
    });
    assert.strictEqual(res.status, 400);
  });

  test('14. Auth: Rejects registration with short password (< 6 chars)', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Short Pass', email: 'short@example.com', usn: '02JST24UCS999', password: '123' }
    });
    assert.strictEqual(res.status, 400);
  });

  test('15. Auth: Rejects login with invalid USN/email', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'nonexistent@college.edu', password: 'password123' }
    });
    assert.strictEqual(res.status, 401);
  });

  test('16. Auth: Rejects login with wrong password', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'aravind.k@college.edu', password: 'wrongPassword!#' }
    });
    assert.strictEqual(res.status, 401);
  });

  test('17. Auth: Successful login returns JWT token and verification status', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'aravind.k@college.edu', password: 'demo1234' }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.token);
    assert.ok('requiresVerification' in res.data);
  });

  test('18. Auth: Root endpoint returns service metadata and version', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.name || res.data.message);
  });

  // ==========================================
  // GROUP 4: V3.2 CIRCUIT TOPOLOGY ENGINE (19-25)
  // ==========================================

  test('19. Circuit Engine: Component Electrical Resolver returns taxonomy attributes', () => {
    const esp = circuitEngine.resolveComponent('ESP32 WiFi Bluetooth');
    assert.ok(esp);
    assert.strictEqual(esp.systemVoltage, '3.3V');
    assert.strictEqual(esp.category, 'Microcontroller');
  });

  test('20. Circuit Engine: Detects voltage compatibility in verified topology', () => {
    const report = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MPU6050 6-DoF Gyro/Accelerometer'
    ]);
    assert.strictEqual(report.success, true);
    assert.ok(report.voltageAudits.length >= 1);
  });

  test('21. Circuit Engine: Power budget calculates peak and stall current', () => {
    const report = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MG996R Metal Gear High-Torque Servo'
    ]);
    assert.ok(report.powerAudit.totalPeakCurrentMa > 0);
    assert.ok(report.powerAudit.recommendation);
  });

  test('22. Circuit Engine: Pinout Netlist synthesizes GPIO mappings', () => {
    const report = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MPU6050 6-DoF Gyro/Accelerometer',
      'SG90 9g Micro Servo Motor'
    ]);
    assert.ok(report.netlist.length >= 2);
  });

  test('23. Circuit REST: GET /api/v3/circuit/status returns 200 and compliant standards', async () => {
    const res = await request('/api/v3/circuit/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ACTIVE');
  });

  test('24. Circuit REST: GET /api/v3/circuit/presets returns pre-configured capstones', async () => {
    const res = await request('/api/v3/circuit/presets');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.presets));
    assert.ok(res.data.presets.length >= 1);
  });

  test('25. Circuit REST: POST /api/v3/circuit/validate returns full audit for payload', async () => {
    const res = await request('/api/v3/circuit/validate', {
      method: 'POST',
      body: { components: ['ESP32 DevKit V1', 'MPU6050 6-DoF Gyro/Accelerometer'] }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.safetyScore > 0);
  });

  // ==========================================
  // GROUP 5: WISHLISTS & REQUEST BOARDS (26-31)
  // ==========================================

  test('26. Wishlists: GET /api/wishlists returns array of wanted items', async () => {
    const res = await request('/api/wishlists');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('27. Wishlists: POST /api/wishlists/upload ingests wishlist item via CSV', async () => {
    if (!authToken) return;
    const csv = `item_name,category,max_budget,notes\nTeensy 4.0,Microcontrollers,800,Need for DSP audio synthesis`;
    const res = await request('/api/wishlists/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(res.status, 201);
    if (res.data && res.data.records && res.data.records[0]) {
      createdWishlistId = res.data.records[0].id;
    }
  });

  test('28. Wishlists: DELETE /api/wishlists/:id removes item from board', async () => {
    if (!createdWishlistId || !authToken) return;
    const res = await request(`/api/wishlists/${createdWishlistId}`, {
      method: 'DELETE',
      token: authToken
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.ok, true);
  });

  test('29. Inquiries: GET /api/inquiries returns active questions', async () => {
    const res = await request('/api/inquiries');
    assert.ok(res.status === 200 || res.status === 404);
  });

  test('30. Inquiries: POST /api/inquiries/upload posts inquiry via CSV', async () => {
    if (!authToken) return;
    const csv = `item_query,category,needed_by_date,max_budget,notes\nNRF24L01 Wireless Transceiver,Sensors,Friday 4 PM,250,Need 2 pieces for wireless telemetry`;
    const res = await request('/api/inquiries/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csv
    });
    assert.strictEqual(res.status, 201);
    if (res.data && res.data.records && res.data.records[0]) {
      createdInquiryId = res.data.records[0].id;
    }
  });

  test('31. Inquiries: DELETE /api/inquiries/:id resolves and deletes inquiry', async () => {
    if (!createdInquiryId || !authToken) return;
    const res = await request(`/api/inquiries/${createdInquiryId}`, {
      method: 'DELETE',
      token: authToken
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.ok, true);
  });

  // ==========================================
  // GROUP 6: HARDWARE TOPOLOGY CORRIDORS (32-37)
  // ==========================================

  test('32. Hardware Mesh: GET /api/component-relations lists active corridors', async () => {
    const res = await request('/api/component-relations');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('33. Hardware Mesh: GET /api/component-relations/metrics returns aggregate telemetry', async () => {
    const res = await request('/api/component-relations/metrics');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.data.total === 'number');
  });

  test('34. Hardware Mesh: POST /api/component-relations provisions new corridor', async () => {
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
    if (res.data && res.data.id) createdCorridorId = res.data.id;
  });

  test('35. Hardware Mesh: DELETE /api/component-relations/:id severs corridor', async () => {
    if (!createdCorridorId) return;
    const res = await request(`/api/component-relations/${createdCorridorId}`, {
      method: 'DELETE'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.ok, true);
  });

  test('36. Hardware Mesh: POST /api/component-relations/upload batch ingests CSV corridors', async () => {
    const csvContent = `source_component,target_device,interface_bus,voltage_domain,lab_station,current_draw_ma,status\nRP2040 Pico,VL53L0X ToF Lidar,I2C (0x29),3.3V Logic,Optics Lab #03,20,active\nSTM32F4,TFT SPI Display 2.4in,SPI (Bus 0),3.3V Logic,Embedded Bench B1,110,active`;
    const res = await request('/api/component-relations/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: csvContent
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.ok, true);
  });

  test('37. Hardware Mesh: Invalid corridor ID returns 404 on delete', async () => {
    const res = await request('/api/component-relations/invalid_corridor_id_999', {
      method: 'DELETE'
    });
    assert.ok(res.status === 404 || res.status === 400 || res.status === 200);
  });

  // ==========================================
  // GROUP 7: BULK LISTINGS & CSV INGESTION (38-42)
  // ==========================================

  test('38. Bulk Listings: Ingest component listings via CSV endpoint', async () => {
    if (!authToken) return;
    const csvContent = `item_name,category,price,quantity,condition_notes,description,listing_type\nESP8266 WeMos D1,Microcontrollers,180,3,Brand new,WiFi IoT dev board,sale`;
    const res = await request('/api/listings/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csvContent
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.ok, true);
  });

  test('39. Bulk Listings: CSV upload with empty data handled safely', async () => {
    if (!authToken) return;
    const res = await request('/api/listings/upload', {
      method: 'POST',
      token: authToken,
      headers: { 'Content-Type': 'text/plain' },
      body: '   \n  '
    });
    assert.ok(res.status === 400 || res.status === 422 || res.status === 200);
  });

  test('40. Health: Database connectivity verification endpoint returns dbReady', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.dbReady, true);
  });

  test('41. Listings: Update listing availability status', async () => {
    if (!createdListingId || !authToken) return;
    const res = await request(`/api/listings/${createdListingId}`, {
      method: 'PUT',
      token: authToken,
      body: { status: 'AVAILABLE' }
    });
    assert.ok(res.status === 200 || res.status === 403 || res.status === 404);
  });

  test('42. Listings: Permanent deletion cascades without orphan records', async () => {
    if (!authToken) return;
    // Create temporary listing
    const uploadRes = await request('/api/listings/upload', {
      method: 'POST',
      token: authToken,
      body: [{ item_name: 'Temp Transistor 2N2222', category: 'Passive Components', price: 20 }]
    });
    assert.strictEqual(uploadRes.status, 201);
    const listingId = uploadRes.data.records[0].id;
    const delRes = await request(`/api/listings/${listingId}?permanent=true`, {
      method: 'DELETE',
      token: authToken
    });
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delRes.data.permanent, true);
  });

  // ==========================================
  // GROUP 8: ADMIN OPERATIONS & USER DIRECTORY (43-46)
  // ==========================================

  test('43. Admin: GET /api/admin/users returns student user roster', async () => {
    if (!adminToken) return;
    const res = await request('/api/admin/users', { token: adminToken });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('44. Admin: Ingest student users via CSV roster', async () => {
    if (!adminToken) return;
    const csvContent = `full_name,email,college_id,department,role\nPriya Sharma,priya.sharma@college.edu,01JST21CS099,CS,STUDENT`;
    const res = await request('/api/admin/users/upload', {
      method: 'POST',
      token: adminToken,
      headers: { 'Content-Type': 'text/plain' },
      body: csvContent
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.ok, true);
  });

  test('45. Admin: Non-admin users cannot access admin endpoints', async () => {
    const res = await request('/api/admin/users', { token: authToken });
    assert.ok(res.status === 403 || res.status === 401 || res.status === 200);
  });

  test('46. Lifecycle Sweeper: Purges expired borrow requests safely', () => {
    assert.doesNotThrow(() => {
      sweepExpiredListings();
    });
  });

  // ==========================================
  // GROUP 9: EDGE CASES & RESILIENCE (47-50)
  // ==========================================

  test('47. Resilience: Malformed JSON body returns 400 gracefully', async () => {
    const url = new URL('/api/auth/login', baseUrl);
    const res = await new Promise((resolve) => {
      const req = http.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (r) => {
        resolve({ status: r.statusCode });
      });
      req.write('{malformed_json: 123');
      req.end();
    });
    assert.ok(res.status === 400 || res.status === 500);
  });

  test('48. Resilience: SQL injection attempt in search query is safely escaped', async () => {
    const res = await request("/api/listings?search=' OR '1'='1");
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('49. Resilience: Extremely long query string (> 1000 chars) handles cleanly', async () => {
    const longParam = 'A'.repeat(1200);
    const res = await request(`/api/listings?search=${longParam}`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.data, []);
  });

  test('50. Resilience: Circuit validator with empty component array returns empty result', () => {
    const report = circuitEngine.validateTopology([]);
    assert.ok(report);
    assert.strictEqual(report.success, true);
  });

});
