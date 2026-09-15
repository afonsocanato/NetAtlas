import './helpers/testEnv.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deviceService } from '../src/services/deviceService.js';
import { deviceModel } from '../src/models/deviceModel.js';

test('ingestReport() creates new devices and marks the router', () => {
  const result = deviceService.ingestReport({
    network: { id: 'default', cidr: '192.168.1.0/24' },
    devices: [
      { ip: '192.168.1.1', mac: 'AA:BB:CC:00:00:01', hostname: 'router.local', is_router: true },
      { ip: '192.168.1.20', mac: 'AA:BB:CC:00:00:02', hostname: 'laptop.local' },
    ],
  });

  assert.equal(result.received, 2);
  assert.equal(result.new, 2);

  const devices = deviceModel.findAll();
  const router = devices.find((d) => d.mac === 'AA:BB:CC:00:00:01');
  assert.equal(router.isRouter, true);
  assert.equal(router.deviceType, 'router');
});

test('ingestReport() upserts an existing device by MAC instead of duplicating it', () => {
  deviceService.ingestReport({
    devices: [{ ip: '192.168.1.30', mac: 'AA:BB:CC:00:00:03', hostname: 'phone-old' }],
  });
  const result = deviceService.ingestReport({
    devices: [{ ip: '192.168.1.31', mac: 'AA:BB:CC:00:00:03', hostname: 'phone-new' }],
  });

  assert.equal(result.new, 0);
  assert.equal(result.updated, 1);

  const matches = deviceModel.findAll({ q: 'AA:BB:CC:00:00:03' });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].hostname, 'phone-new');
  assert.equal(matches[0].ip, '192.168.1.31');
});

test('a device missing from enough consecutive reports flips to offline', () => {
  deviceService.ingestReport({ devices: [{ ip: '192.168.1.40', mac: 'AA:BB:CC:00:00:04' }] });
  const device = deviceModel.findAll({ q: 'AA:BB:CC:00:00:04' })[0];

  // OFFLINE_AFTER_MISSED_REPORTS=2 in test env — two empty reports should flip it.
  deviceService.ingestReport({ devices: [] });
  assert.equal(deviceModel.findById(device.id).status, 'online');

  deviceService.ingestReport({ devices: [] });
  assert.equal(deviceModel.findById(device.id).status, 'offline');
});

test('a device that reappears before the threshold stays online and resets the counter', () => {
  deviceService.ingestReport({ devices: [{ ip: '192.168.1.41', mac: 'AA:BB:CC:00:00:05' }] });
  const device = deviceModel.findAll({ q: 'AA:BB:CC:00:00:05' })[0];

  deviceService.ingestReport({ devices: [] });
  deviceService.ingestReport({ devices: [{ ip: '192.168.1.41', mac: 'AA:BB:CC:00:00:05' }] });

  assert.equal(deviceModel.findById(device.id).status, 'online');
});
