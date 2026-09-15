import { supabase } from '../db/index.js';

export const settingsModel = {
  async get(key) {
    const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
    if (error) throw error;
    return data?.value ?? null;
  },

  async set(key, value) {
    const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};
