import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? './data/netatlas.sqlite',
  agentApiKey: process.env.AGENT_API_KEY ?? 'change-me-to-a-random-secret',
  offlineAfterMissedReports: Number(process.env.OFFLINE_AFTER_MISSED_REPORTS ?? 2),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
