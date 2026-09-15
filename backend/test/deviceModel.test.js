import './helpers/testEnv.js';
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { deviceModel } from '../src/models/deviceModel.js';
import { resetTestNetwork } from './helpers/cleanup.js';

const NETWORK = 'test-model';
const dev = (overrides) => ({ networkId: NETWORK, ...overrides });

before(() => resetTestNetwork(NETWORK));

test('create() inserts a device and findById() returns it', async () => {
  const device = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:01', ip: '192.168.1.10', hostname: 'host-a' }));
  assert.equal(device.mac, 'AA:BB:CC:DD:EE:01');
  assert.equal(device.status, 'online');
  assert.equal((await deviceModel.findById(device.id)).ip, '192.168.1.10');
});

test('findByMacOrIp() matches by MAC first, falls back to IP when MAC is null', async () => {
  const withMac = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:02', ip: '192.168.1.11' }));
  const withoutMac = await deviceModel.create(dev({ mac: null, ip: '192.168.1.12' }));

  assert.equal((await deviceModel.findByMacOrIp({ networkId: NETWORK, mac: 'AA:BB:CC:DD:EE:02' })).id, withMac.id);
  assert.equal((await deviceModel.findByMacOrIp({ networkId: NETWORK, mac: null, ip: '192.168.1.12' })).id, withoutMac.id);
});

test('markSeen() refreshes ip/hostname/vendor and resets status to online', async () => {
  const device = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:03', ip: '192.168.1.13' }));
  await deviceModel.markOffline(device.id);

  const updated = await deviceModel.markSeen(device.id, { ip: '192.168.1.99', hostname: 'renamed', vendor: 'Acme' });

  assert.equal(updated.status, 'online');
  assert.equal(updated.ip, '192.168.1.99');
  assert.equal(updated.hostname, 'renamed');
  assert.equal(updated.vendor, 'Acme');
});

test('markMissing() increments the counter and returns the new value', async () => {
  const device = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:04', ip: '192.168.1.14' }));
  assert.equal(await deviceModel.markMissing(device.id), 1);
  assert.equal(await deviceModel.markMissing(device.id), 2);
});

test('update() only changes customLabel/deviceType, never discovery fields', async () => {
  const device = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:05', ip: '192.168.1.15', hostname: 'orig' }));
  const updated = await deviceModel.update(device.id, { customLabel: 'My Laptop', deviceType: 'computer' });

  assert.equal(updated.customLabel, 'My Laptop');
  assert.equal(updated.deviceType, 'computer');
  assert.equal(updated.hostname, 'orig');
});

test('idsNotIn() excludes the given ids from online devices in the network', async () => {
  const a = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:06', ip: '192.168.1.16' }));
  const b = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:07', ip: '192.168.1.17' }));

  const missing = await deviceModel.idsNotIn(NETWORK, [a.id]);
  assert.ok(missing.includes(b.id));
  assert.ok(!missing.includes(a.id));
});

test('summary() aggregates totals, online/offline and by-type counts', async () => {
  const router = await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:08', ip: '192.168.1.1', isRouter: true, deviceType: 'router' }));
  await deviceModel.create(dev({ mac: 'AA:BB:CC:DD:EE:09', ip: '192.168.1.18', deviceType: 'computer' }));
  await deviceModel.markOffline(router.id);

  const summary = await deviceModel.summary(NETWORK);
  assert.ok(summary.total >= 2);
  assert.ok(summary.offline >= 1);
  assert.ok(summary.byType.router >= 1);
});
