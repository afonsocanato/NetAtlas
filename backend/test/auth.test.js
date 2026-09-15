import './helpers/testEnv.js';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { secrets, initSecrets } from '../src/security/secrets.js';

before(initSecrets);

async function withServer(fn) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://localhost:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /api/devices without a token is rejected', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/devices`);
    assert.equal(res.status, 401);
  });
});

test('POST /api/auth/login with wrong credentials is rejected', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
    });
    assert.equal(res.status, 401);
  });
});

test('POST /api/auth/login with the bootstrap admin credentials returns a working token', async () => {
  await withServer(async (base) => {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: secrets.adminUsername, password: process.env.__TEST_ADMIN_PASSWORD }),
    });
    assert.equal(loginRes.status, 200);
    const { token } = await loginRes.json();
    assert.ok(token);

    const devicesRes = await fetch(`${base}/api/devices`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(devicesRes.status, 200);
  });
});

test('POST /api/agent/report still uses the separate agent API key, not user login', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/agent/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': secrets.agentApiKey },
      body: JSON.stringify({ network: { id: 'test-auth' }, devices: [] }),
    });
    assert.equal(res.status, 202);
  });
});
