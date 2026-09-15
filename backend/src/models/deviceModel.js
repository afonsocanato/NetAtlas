import { db } from '../db/index.js';

function toCamel(row) {
  if (!row) return row;
  return {
    id: row.id,
    networkId: row.network_id,
    mac: row.mac,
    ip: row.ip,
    hostname: row.hostname,
    vendor: row.vendor,
    deviceType: row.device_type,
    customLabel: row.custom_label,
    status: row.status,
    isRouter: Boolean(row.is_router),
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const deviceModel = {
  findAll({ status, vendor, deviceType, q, networkId = 'default' } = {}) {
    let sql = 'SELECT * FROM devices WHERE network_id = ?';
    const params = [networkId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (vendor) {
      sql += ' AND vendor = ?';
      params.push(vendor);
    }
    if (deviceType) {
      sql += ' AND device_type = ?';
      params.push(deviceType);
    }
    if (q) {
      sql += ' AND (ip LIKE ? OR hostname LIKE ? OR mac LIKE ? OR custom_label LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    sql += ' ORDER BY is_router DESC, last_seen DESC';

    return db.prepare(sql).all(...params).map(toCamel);
  },

  findById(id) {
    return toCamel(db.prepare('SELECT * FROM devices WHERE id = ?').get(id));
  },

  findByMacOrIp({ networkId, mac, ip }) {
    if (mac) {
      return db.prepare('SELECT * FROM devices WHERE network_id = ? AND mac = ?').get(networkId, mac);
    }
    return db.prepare('SELECT * FROM devices WHERE network_id = ? AND ip = ? AND mac IS NULL').get(networkId, ip);
  },

  create(device) {
    const stmt = db.prepare(`
      INSERT INTO devices (network_id, mac, ip, hostname, vendor, device_type, status, is_router, first_seen, last_seen)
      VALUES (@networkId, @mac, @ip, @hostname, @vendor, @deviceType, 'online', @isRouter, datetime('now'), datetime('now'))
    `);
    const info = stmt.run({
      networkId: device.networkId ?? 'default',
      mac: device.mac ?? null,
      ip: device.ip ?? null,
      hostname: device.hostname ?? null,
      vendor: device.vendor ?? null,
      deviceType: device.deviceType ?? 'unknown',
      isRouter: device.isRouter ? 1 : 0,
    });
    return this.findById(info.lastInsertRowid);
  },

  markSeen(id, { ip, hostname, vendor }) {
    db.prepare(`
      UPDATE devices
      SET ip = COALESCE(?, ip),
          hostname = COALESCE(?, hostname),
          vendor = COALESCE(?, vendor),
          status = 'online',
          missed_reports = 0,
          last_seen = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(ip ?? null, hostname ?? null, vendor ?? null, id);
    return this.findById(id);
  },

  markMissing(id) {
    db.prepare(`
      UPDATE devices SET missed_reports = missed_reports + 1, updated_at = datetime('now') WHERE id = ?
    `).run(id);
    return db.prepare('SELECT missed_reports FROM devices WHERE id = ?').get(id)?.missed_reports ?? 0;
  },

  markOffline(id) {
    db.prepare(`
      UPDATE devices SET status = 'offline', updated_at = datetime('now') WHERE id = ?
    `).run(id);
    return this.findById(id);
  },

  update(id, { customLabel, deviceType }) {
    db.prepare(`
      UPDATE devices
      SET custom_label = COALESCE(?, custom_label),
          device_type = COALESCE(?, device_type),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(customLabel ?? null, deviceType ?? null, id);
    return this.findById(id);
  },

  remove(id) {
    db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  },

  idsNotIn(networkId, seenIds) {
    if (seenIds.length === 0) {
      return db.prepare("SELECT id FROM devices WHERE network_id = ? AND status = 'online'").all(networkId).map((r) => r.id);
    }
    const placeholders = seenIds.map(() => '?').join(',');
    return db
      .prepare(`SELECT id FROM devices WHERE network_id = ? AND status = 'online' AND id NOT IN (${placeholders})`)
      .all(networkId, ...seenIds)
      .map((r) => r.id);
  },

  summary(networkId = 'default') {
    const total = db.prepare('SELECT COUNT(*) c FROM devices WHERE network_id = ?').get(networkId).c;
    const online = db.prepare("SELECT COUNT(*) c FROM devices WHERE network_id = ? AND status = 'online'").get(networkId).c;
    const byType = db
      .prepare('SELECT device_type type, COUNT(*) count FROM devices WHERE network_id = ? GROUP BY device_type')
      .all(networkId);
    const byVendor = db
      .prepare('SELECT vendor, COUNT(*) count FROM devices WHERE network_id = ? AND vendor IS NOT NULL GROUP BY vendor')
      .all(networkId);
    return {
      total,
      online,
      offline: total - online,
      byType: Object.fromEntries(byType.map((r) => [r.type, r.count])),
      byVendor: Object.fromEntries(byVendor.map((r) => [r.vendor, r.count])),
    };
  },
};
