// Must run before any module that reads config/db/secrets is imported.
// Tests hit the SAME Supabase project as your real app (SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY must already be set in the environment or a
// .env the test runner picks up) — SETTINGS_KEY_PREFIX keeps the auth
// bootstrap from ever overwriting your real admin login/agent key/JWT
// secret in the shared `settings` table.
process.env.AGENT_API_KEY = 'test-api-key';
process.env.OFFLINE_AFTER_MISSED_REPORTS = '2';
process.env.PORT = '0';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.__TEST_ADMIN_PASSWORD = 'test-admin-password';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SETTINGS_KEY_PREFIX = 'test_';
