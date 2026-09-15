import './helpers/testEnv.js';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { deviceService } from '../src/services/deviceService.js';
import { deviceModel } from '../src/models/deviceModel.js';
import { resetTestNetwork } from './helpers/cleanup.js';

const NETWORK = 'test-service';
const report = (devices) => deviceService.ingestReport({ network: { id: NETWORK }, devices });

before(() => resetTestNetwork(NETWORK));

test('ingestReport() creates new devices and marks the router', async () => {
  const result = await report([
    { ip: '192.168.1.1', mac: 'AA:BB:CC:00:00:01', hostname: 'router.local', is_router: true },
    { ip: '192.168.1.20', mac: 'AA:BB:CC:00:00:02', hostname: 'laptop.local' },
  ]);

  assert.equal(result.received, 2);
  assert.equal(result.new, 2);

  const devices = await deviceModel.findAll({ networkId: NETWORK });
  const router = devices.find((d) => d.mac === 'AA:BB:CC:00:00:01');
  assert.equal(router.isRouter, true);
  assert.equal(router.deviceType, 'router');
});

test('ingestReport() upserts an existing device by MAC instead of duplicating it', async () => {
  await report([{ ip: '192.168.1.30', mac: 'AA:BB:CC:00:00:03', hostname: 'phone-old' }]);
  const result = await report([{ ip: '192.168.1.31', mac: 'AA:BB:CC:00:00:03', hostname: 'phone-new' }]);

  assert.equal(result.new, 0);
  assert.equal(result.updated, 1);

  const matches = await deviceModel.findAll({ networkId: NETWORK, q: 'AA:BB:CC:00:00:03' });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].hostname, 'phone-new');
  assert.equal(matches[0].ip, '192.168.1.31');
});

test('a device missing from enough consecutive reports flips to offline', async () => {
  await report([{ ip: '192.168.1.40', mac: 'AA:BB:CC:00:00:04' }]);
  const device = (await deviceModel.findAll({ networkId: NETWORK, q: 'AA:BB:CC:00:00:04' }))[0];

  // OFFLINE_AFTER_MISSED_REPORTS=2 in test env — two empty reports should flip it.
  await report([]);
  assert.equal((await deviceModel.findById(device.id)).status, 'online');

  await report([]);
  assert.equal((await deviceModel.findById(device.id)).status, 'offline');
});

test('a device that reappears before the threshold stays online and resets the counter', async () => {
  await report([{ ip: '192.168.1.41', mac: 'AA:BB:CC:00:00:05' }]);
  const device = (await deviceModel.findAll({ networkId: NETWORK, q: 'AA:BB:CC:00:00:05' }))[0];

  await report([]);
  await report([{ ip: '192.168.1.41', mac: 'AA:BB:CC:00:00:05' }]);

  assert.equal((await deviceModel.findById(device.id)).status, 'online');
});
