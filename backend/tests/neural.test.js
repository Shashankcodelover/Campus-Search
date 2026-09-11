const test = require('node:test');
const assert = require('node:assert');
const neuralEngine = require('../src/services/neuralSearchEngine');

test('CampusSearch V3.0 Neural Engine Test Suite', async (t) => {
  await t.test('1. 8D Vector Embedding — normalizes unit vectors and encodes engineering taxonomy', () => {
    const vec = neuralEngine.embedText('ESP32 WiFi IoT microcontroller');
    assert.strictEqual(vec.length, 8);
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(norm - 1.0) < 0.05, 'Vector must be unit normalized');
  });

  await t.test('2. Cosine Similarity — computes deterministic matching between related queries', () => {
    const vecA = neuralEngine.embedText('quadcopter drone motor');
    const vecB = neuralEngine.embedText('SG90 micro servo actuator');
    const score = neuralEngine.cosineSimilarity(vecA, vecB);
    assert.ok(score >= 0.70, `Motor actuation vector similarity should be high: got ${score}`);
  });

  await t.test('3. BOM Project Optimizer — parses lines and computes student savings + CO2 offset', () => {
    const mockListings = [
      { id: '1', item_name: 'ESP32 DevKit V1', category: 'Microcontrollers', price: 280, status: 'available' },
      { id: '2', item_name: 'SG90 Servo Motor x4', category: 'Actuators', price: 220, status: 'available' }
    ];
    const bom = '1x ESP32\n2x SG90 Servo';
    const result = neuralEngine.optimizeBOM(bom, mockListings);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.totalItemsParsed, 2);
    assert.ok(result.financials.totalSavingsRupees > 0, 'Must produce cost savings');
    assert.ok(result.circularImpact.carbonOffsetKg > 0, 'Must produce carbon offset');
  });

  await t.test('4. Geofenced Escrow Passport — generates cryptographic dual-key token within campus perimeter', () => {
    const passport = neuralEngine.generateHandshakePassport('REQ_TEST_1', 'SELLER_1', 'BUYER_1', 12.3168, 76.6133);
    assert.strictEqual(passport.success, true);
    assert.ok(passport.handshakeToken.startsWith('0xESCROW-'));
    assert.strictEqual(passport.geofence.isWithinCampusValid, true);
    assert.ok(passport.scanOtp.length === 6);
  });
});
