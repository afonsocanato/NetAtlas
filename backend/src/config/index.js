import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  supabaseUrl: process.env.SUPABASE_URL || undefined,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  // Left undefined (rather than a fixed fallback) on purpose: secrets.js
  // auto-generates and persists a random value the first time the backend
  // boots without one, instead of shipping an insecure shared default.
  agentApiKey: process.env.AGENT_API_KEY || undefined,
  jwtSecret: process.env.JWT_SECRET || undefined,
  adminUsername: process.env.ADMIN_USERNAME || undefined,
  adminPassword: process.env.ADMIN_PASSWORD || undefined,
  authDisabled: process.env.NETATLAS_DISABLE_AUTH === 'true',
  // Prefixes every key this process writes to the shared Supabase `settings`
  // table. Only the test suite sets this (to "test_"), so a test run can
  // never overwrite the real admin login / agent key / JWT secret even if
  // it's pointed at the same Supabase project as production.
  settingsKeyPrefix: process.env.SETTINGS_KEY_PREFIX ?? '',
  offlineAfterMissedReports: Number(process.env.OFFLINE_AFTER_MISSED_REPORTS ?? 2),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
