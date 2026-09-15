// Populates the database with a plausible fake home network, so the
// dashboard can be explored/demoed without running the real agent.
// Run with: npm run seed
import { db } from './index.js';
import { deviceModel } from '../models/deviceModel.js';

const MOCK_DEVICES = [
  { mac: 'AC:DE:48:00:11:01', ip: '192.168.1.1', hostname: 'router.local', vendor: 'TP-Link Technologies', deviceType: 'router', isRouter: true },
  { mac: '3C:22:FB:00:11:02', ip: '192.168.1.10', hostname: 'afonsos-macbook.local', vendor: 'Apple, Inc.', deviceType: 'computer' },
  { mac: 'F0:18:98:00:11:03', ip: '192.168.1.11', hostname: 'afonsos-iphone.local', vendor: 'Apple, Inc.', deviceType: 'phone' },
  { mac: '5C:E0:C5:00:11:04', ip: '192.168.1.12', hostname: null, vendor: 'Samsung Electronics', deviceType: 'phone' },
  { mac: 'DC:A6:32:00:11:05', ip: '192.168.1.13', hostname: 'raspberrypi.local', vendor: 'Raspberry Pi Foundation', deviceType: 'iot' },
  { mac: 'EC:08:6B:00:11:06', ip: '192.168.1.14', hostname: null, vendor: 'Espressif Inc. (generic IoT/ESP chip)', deviceType: 'iot' },
  { mac: 'A4:56:02:00:11:07', ip: '192.168.1.15', hostname: 'echo-dot.local', vendor: 'Amazon Technologies Inc.', deviceType: 'iot' },
  { mac: '00:1B:63:00:11:08', ip: '192.168.1.16', hostname: 'living-room-tv.local', vendor: 'Samsung Electronics', deviceType: 'tv' },
  { mac: '18:74:2E:00:11:09', ip: '192.168.1.17', hostname: null, vendor: 'TP-Link Technologies', deviceType: 'unknown', offline: true },
  { mac: '08:00:27:00:11:10', ip: '192.168.1.18', hostname: 'test-vm.local', vendor: 'Oracle VirtualBox', deviceType: 'computer', offline: true },
];

function reset() {
  db.exec('DELETE FROM presence_events; DELETE FROM devices;');
}

function seed() {
  reset();
  for (const { offline, ...data } of MOCK_DEVICES) {
    const device = deviceModel.create(data);
    if (offline) deviceModel.markOffline(device.id);
  }
  console.log(`Seeded ${MOCK_DEVICES.length} mock devices into ${db.name}`);
}

seed();
