import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy backend/.env.example to backend/.env, fill them in from ' +
      'your Supabase project (Settings -> API), and run backend/supabase/schema.sql once in the SQL Editor.',
  );
}

// Server-side client only — the service role key bypasses Row Level
// Security, which is why it must never reach the frontend or agent.
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
