import { supabase } from '../db/index.js';

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

function must(result) {
  if (result.error) throw result.error;
  return result.data;
}

export const deviceModel = {
  async findAll({ status, vendor, deviceType, q, networkId = 'default' } = {}) {
    let query = supabase.from('devices').select('*').eq('network_id', networkId);

    if (status) query = query.eq('status', status);
    if (vendor) query = query.eq('vendor', vendor);
    if (deviceType) query = query.eq('device_type', deviceType);
    if (q) {
      const like = `%${q}%`;
      query = query.or(`ip.ilike.${like},hostname.ilike.${like},mac.ilike.${like},custom_label.ilike.${like}`);
    }

    query = query.order('is_router', { ascending: false }).order('last_seen', { ascending: false });

    const data = must(await query);
    return data.map(toCamel);
  },

  async findById(id) {
    const { data, error } = await supabase.from('devices').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return toCamel(data);
  },

  async findByMacOrIp({ networkId, mac, ip }) {
    let query = supabase.from('devices').select('*').eq('network_id', networkId);
    query = mac ? query.eq('mac', mac) : query.eq('ip', ip).is('mac', null);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(device) {
    const now = new Date().toISOString();
    const row = must(
      await supabase
        .from('devices')
        .insert({
          network_id: device.networkId ?? 'default',
          mac: device.mac ?? null,
          ip: device.ip ?? null,
          hostname: device.hostname ?? null,
          vendor: device.vendor ?? null,
          device_type: device.deviceType ?? 'unknown',
          status: 'online',
          is_router: Boolean(device.isRouter),
          first_seen: now,
          last_seen: now,
        })
        .select()
        .single(),
    );
    return toCamel(row);
  },

  // deviceTypeIfUnknown lets a later, better guess (e.g. a hostname that
  // resolved this time when it didn't before) fill in a still-"unknown"
  // device's type — but never overwrites a type the agent already guessed
  // differently, or one the user set by hand via update().
  async markSeen(id, { ip, hostname, vendor, deviceTypeIfUnknown }) {
    const patch = { status: 'online', missed_reports: 0, last_seen: new Date().toISOString() };
    if (ip != null) patch.ip = ip;
    if (hostname != null) patch.hostname = hostname;
    if (vendor != null) patch.vendor = vendor;

    if (deviceTypeIfUnknown) {
      const { data } = await supabase
        .from('devices')
        .update({ ...patch, device_type: deviceTypeIfUnknown })
        .eq('id', id)
        .eq('device_type', 'unknown')
        .select()
        .maybeSingle();
      if (data) return toCamel(data);
      // Row exists but device_type wasn't "unknown" — fall through and
      // apply the rest of the patch without touching its type.
    }

    const row = must(await supabase.from('devices').update(patch).eq('id', id).select().single());
    return toCamel(row);
  },

  async markMissing(id) {
    const current = must(await supabase.from('devices').select('missed_reports').eq('id', id).single());
    const missedReports = (current?.missed_reports ?? 0) + 1;
    must(await supabase.from('devices').update({ missed_reports: missedReports }).eq('id', id));
    return missedReports;
  },

  async markOffline(id) {
    const row = must(await supabase.from('devices').update({ status: 'offline' }).eq('id', id).select().single());
    return toCamel(row);
  },

  async update(id, { customLabel, deviceType }) {
    const patch = {};
    if (customLabel != null) patch.custom_label = customLabel;
    if (deviceType != null) patch.device_type = deviceType;

    const row = must(await supabase.from('devices').update(patch).eq('id', id).select().single());
    return toCamel(row);
  },

  async remove(id) {
    must(await supabase.from('devices').delete().eq('id', id));
  },

  async idsNotIn(networkId, seenIds) {
    let query = supabase.from('devices').select('id').eq('network_id', networkId).eq('status', 'online');
    if (seenIds.length > 0) query = query.not('id', 'in', `(${seenIds.join(',')})`);
    const data = must(await query);
    return data.map((r) => r.id);
  },

  async summary(networkId = 'default') {
    const data = must(await supabase.from('devices').select('status, device_type, vendor').eq('network_id', networkId));

    const total = data.length;
    const online = data.filter((d) => d.status === 'online').length;
    const byType = {};
    const byVendor = {};
    for (const d of data) {
      byType[d.device_type] = (byType[d.device_type] ?? 0) + 1;
      if (d.vendor) byVendor[d.vendor] = (byVendor[d.vendor] ?? 0) + 1;
    }

    return { total, online, offline: total - online, byType, byVendor };
  },
};
