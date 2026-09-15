// Must run before any module that reads config/db is imported, so each test
// file gets an isolated in-memory SQLite database instead of touching the
// real data/ directory.
process.env.DB_PATH = ':memory:';
process.env.AGENT_API_KEY = 'test-api-key';
process.env.OFFLINE_AFTER_MISSED_REPORTS = '2';
process.env.PORT = '0';
