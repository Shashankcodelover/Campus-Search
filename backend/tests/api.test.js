const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { startApp } = require('../src/app');
const matchingService = require('../src/services/matchingService');
const { sweepExpiredListings } = require('../src/routes/listings');

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

describe('CampusSearch API Automated Test Suite', () => {
  let sampleListingId;

  before(async () => {
    const app = await startApp();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Test server running at ${baseUrl}`);
        resolve();
      });
    });
  });

  after((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test('1. Health Check Endpoint — returns 200 and dbReady: true', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.ok, true);
    assert.strictEqual(res.data.dbReady, true);
    assert.strictEqual(res.data.version, '2.0.0');
  });

  test('2. Root API Endpoint — returns API metadata', async () => {
    const res = await request('/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.name, 'CampusSearch API');
    assert.strictEqual(res.data.ok, true);
  });

  test('3. Listings Catalog — retrieves available campus components', async () => {
    const res = await request('/api/listings');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data), 'Expected response data to be an array of listings');
    assert.ok(res.data.length > 0, 'Catalog should contain components');
    const first = res.data[0];
    sampleListingId = first.id;
    assert.ok(first.id, 'Listing must have an id');
    assert.ok(first.item_name, 'Listing must have an item_name');
    assert.ok(first.category, 'Listing must have a category');
    assert.ok(typeof first.price === 'number', 'Listing price must be a number');
  });

  test('4. Listings Filtering by Category — filters components correctly', async () => {
    const res = await request('/api/listings?category=Passive%20Components');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    for (const item of res.data) {
      assert.strictEqual(item.category, 'Passive Components');
    }
  });

  test('5. Listings Search Query — searches component titles & descriptions using ?search=', async () => {
    const res = await request('/api/listings?search=Breadboard');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
    assert.ok(res.data.length > 0);
    for (const item of res.data) {
      const match = (item.item_name && item.item_name.toLowerCase().includes('breadboard')) ||
                    (item.description && item.description.toLowerCase().includes('breadboard'));
      assert.ok(match, `Item ${item.item_name} should contain search term "breadboard"`);
    }
  });

  test('6. Single Listing Details — retrieves detailed item record by ID', async () => {
    assert.ok(sampleListingId, 'Sample listing ID must exist');
    const res = await request(`/api/listings/${sampleListingId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.id, sampleListingId);
    assert.ok(res.data.item_name);
    assert.ok(res.data.seller_name);
  });

  test('7. Auth Validation — rejects registration with missing USN or short password', async () => {
    const badPass = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Student',
        email: 'test.student@college.edu',
        usn: '4JC21CS001',
        password: '123' // Too short (<8 chars)
      }
    });
    assert.strictEqual(badPass.status, 400);
    assert.ok(badPass.data.error.includes('8 characters'));

    const badUsn = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Student',
        email: 'test.student@college.edu',
        usn: '', // Empty USN
        password: 'validPassword123'
      }
    });
    assert.strictEqual(badUsn.status, 400);
    assert.ok(badUsn.data.error.includes('USN'));
  });

  test('8. Auth Security — rejects login with non-existent or incorrect credentials', async () => {
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'nonexistent.user@college.edu',
        password: 'incorrectPassword123'
      }
    });
    assert.ok(badLogin.status === 401 || badLogin.status === 400 || badLogin.status === 404);
    assert.ok(badLogin.data.error);
  });

  test('9. Wishlists Feed — retrieves wanted wishlist board', async () => {
    const res = await request('/api/wishlists');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data));
  });

  test('10. Lifecycle Sweeps — sweeps expired requests and listings without error', async () => {
    await matchingService.sweepExpiredRequests();
    await sweepExpiredListings();
    assert.ok(true, 'Lifecycle sweeps executed smoothly');
  });
});
