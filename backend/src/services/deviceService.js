import { deviceModel } from '../models/deviceModel.js';
import { networksModel } from '../models/networksModel.js';
import { config } from '../config/index.js';
import { emitDeviceNew, emitDeviceUpdated, emitDeviceOffline, emitScanComplete } from '../sockets/index.js';

export const deviceService = {
  async ingestReport({ network, devices }, reporterIp) {
    const networkId = network?.id ?? 'default';
    await networksModel.recordReport(networkId, reporterIp);
    const seenIds = [];
    let created = 0;
    let updated = 0;

    for (const d of devices) {
      const mac = d.mac ? d.mac.toUpperCase() : null;
      const existing = await deviceModel.findByMacOrIp({ networkId, mac, ip: d.ip });
      const isRouter = Boolean(d.is_router ?? d.isRouter);
      // The agent's guess (hostname/vendor keywords) — used to seed a
      // brand-new device's type, or to upgrade an existing one still stuck
      // at "unknown". Never overwrites a type the user set by hand or a
      // different guess from an earlier report (see markSeen()).
      const guessedType = isRouter ? 'router' : (d.device_type ?? d.deviceType) || null;

      if (!existing) {
        const device = await deviceModel.create({
          networkId,
          mac,
          ip: d.ip,
          hostname: d.hostname,
          vendor: d.vendor,
          bleName: d.ble_name,
          isRouter,
          deviceType: guessedType ?? 'unknown',
        });
        seenIds.push(device.id);
        created += 1;
        emitDeviceNew(device);
      } else {
        const device = await deviceModel.markSeen(existing.id, {
          ip: d.ip,
          hostname: d.hostname,
          vendor: d.vendor,
          bleName: d.ble_name,
          deviceTypeIfUnknown: guessedType,
        });
        seenIds.push(device.id);
        updated += 1;
        emitDeviceUpdated(device);
      }
    }

    await this.reconcileOffline(networkId, seenIds);
    emitScanComplete(networkId, { scannedAt: new Date().toISOString(), deviceCount: seenIds.length });

    return { received: devices.length, new: created, updated };
  },

  // Devices not present in this report get their missed-report counter bumped;
  // once it crosses the configured threshold they flip to offline.
  async reconcileOffline(networkId, seenIds) {
    const missingIds = await deviceModel.idsNotIn(networkId, seenIds);
    for (const id of missingIds) {
      const missedReports = await deviceModel.markMissing(id);
      if (missedReports >= config.offlineAfterMissedReports) {
        const device = await deviceModel.markOffline(id);
        emitDeviceOffline(device);
      }
    }
  },
};
