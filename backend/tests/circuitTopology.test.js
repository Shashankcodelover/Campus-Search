const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { startApp } = require('../src/app');
const circuitEngine = require('../src/services/circuitTopologyEngine');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    let body = options.body;
    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      reqOptions.headers['Content-Type'] = 'application/json';
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

describe('CampusSearch V3.2 Circuit Topology & Pinout Interconnect Engine', () => {
  before(async () => {
    const app = await startApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after((done) => {
    if (server) server.close(done);
    else done();
  });

  test('1. Component Electrical Resolver — resolves taxonomy attributes', () => {
    const esp = circuitEngine.resolveComponent('ESP32 WiFi Bluetooth');
    assert.ok(esp, 'ESP32 should resolve');
    assert.strictEqual(esp.systemVoltage, '3.3V');
    assert.strictEqual(esp.category, 'Microcontroller');

    const mpu = circuitEngine.resolveComponent('MPU6050 Accelerometer');
    assert.ok(mpu, 'MPU6050 should resolve');
    assert.strictEqual(mpu.busType, 'I2C');
    assert.strictEqual(mpu.i2cDefaultAddress, '0x68');
  });

  test('2. Multi-Domain Voltage Compatibility Audit', () => {
    const validation = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MPU6050 6-DoF Gyro/Accelerometer',
      '0.96 inch I2C OLED Display (SSD1306)'
    ]);
    assert.strictEqual(validation.success, true);
    assert.ok(validation.voltageAudits.length >= 2);
    assert.strictEqual(validation.voltageAudits[0].issue, 'VOLTAGE_SAFE');
    assert.strictEqual(validation.labPassport.startsWith('0xLAB-VERIFIED-'), true);
  });

  test('3. Dynamic Power & Stall Current Budget Forecaster', () => {
    const validation = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MG996R Metal Gear High-Torque Servo',
      'SG90 9g Micro Servo Motor'
    ]);
    assert.strictEqual(validation.success, true);
    assert.strictEqual(validation.powerAudit.powerStatus, 'CRITICAL_BROWNOUT_RISK');
    assert.ok(validation.powerAudit.totalPeakCurrentMa > 1000);
    assert.ok(validation.powerAudit.recommendation.includes('LM2596'));
  });

  test('4. Pinout Netlist Synthesis — assigns MCU GPIOs and bus nets', () => {
    const validation = circuitEngine.validateTopology([
      'ESP32 DevKit V1',
      'MPU6050 6-DoF Gyro/Accelerometer',
      'SG90 9g Micro Servo Motor'
    ]);
    assert.ok(validation.netlist.length >= 4);
    const i2cDataNet = validation.netlist.find(n => n.net === 'I2C_DATA');
    assert.ok(i2cDataNet);
    assert.ok(i2cDataNet.from.includes('GPIO 21'));

    const pwmNet = validation.netlist.find(n => n.net === 'PWM_CONTROL');
    assert.ok(pwmNet);
  });

  test('5. REST API: GET /api/v3/circuit/status returns 200 and compliance standards', async () => {
    const res = await request('/api/v3/circuit/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ACTIVE');
    assert.ok(res.data.standardsCompliance.includes('IEEE 1149.1'));
  });

  test('6. REST API: GET /api/v3/circuit/presets returns verified capstones', async () => {
    const res = await request('/api/v3/circuit/presets');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.presets.length >= 3);
  });

  test('7. REST API: POST /api/v3/circuit/validate validates payload', async () => {
    const res = await request('/api/v3/circuit/validate', {
      method: 'POST',
      body: {
        components: ['ESP32 DevKit V1', 'MPU6050 6-DoF Gyro/Accelerometer', 'LM2596 Step-Down Buck Converter Module']
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.safetyScore > 70);
    assert.ok(res.data.labPassport);
  });
});
