import { supabase } from '../db/index.js';

export const networksModel = {
  // Records which public IP last reported into this network, so the
  // dashboard can later match a visiting browser's IP back to it. Update-
  // then-insert (rather than upsert) so an existing network's friendly
  // `name` is never clobbered back to the raw id on every agent report.
  async recordReport(networkId, publicIp) {
    const patch = { public_ip: publicIp ?? null, last_report_at: new Date().toISOString() };

    const { data: updated, error: updateError } = await supabase
      .from('networks')
      .update(patch)
      .eq('id', networkId)
      .select('id');
    if (updateError) throw updateError;
    if (updated.length > 0) return;

    const { error: insertError } = await supabase.from('networks').insert({ id: networkId, name: networkId, ...patch });
    if (insertError) throw insertError;
  },

  // More than one network can share a public IP (e.g. two agent network
  // ids pointed at the same LAN, or — in dev/tests — everything running
  // from one machine's loopback address), so this picks whichever reported
  // most recently rather than erroring on an ambiguous match.
  async findByPublicIp(publicIp) {
    if (!publicIp) return null;
    const { data, error } = await supabase
      .from('networks')
      .select('id')
      .eq('public_ip', publicIp)
      .order('last_report_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data?.[0]?.id ?? null;
  },

  // Every network that has ever reported — backs the dashboard's manual
  // network switcher (for viewing a network whose agent isn't on the same
  // public IP as you right now, e.g. checking home from mobile data).
  async list() {
    const { data, error } = await supabase
      .from('networks')
      .select('id, name, last_report_at')
      .order('last_report_at', { ascending: false });
    if (error) throw error;
    return data.map((row) => ({ id: row.id, name: row.name, lastReportAt: row.last_report_at }));
  },
};
