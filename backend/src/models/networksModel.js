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

  async findByPublicIp(publicIp) {
    if (!publicIp) return null;
    const { data, error } = await supabase.from('networks').select('id').eq('public_ip', publicIp).maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  },
};
