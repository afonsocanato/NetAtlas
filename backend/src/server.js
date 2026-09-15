import http from 'node:http';
import { app } from './app.js';
import { initSockets } from './sockets/index.js';
import { initSecrets } from './security/secrets.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

// initSecrets() makes several Supabase calls at boot; transient network/API
// hiccups there shouldn't take the whole process down on a long-running
// deploy, so retry a few times with backoff before giving up for real.
async function initSecretsWithRetry(attempts = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await initSecrets();
    } catch (err) {
      if (attempt === attempts) throw err;
      logger.error(`initSecrets() failed (attempt ${attempt}/${attempts}), retrying in ${delayMs}ms: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

await initSecretsWithRetry();

const server = http.createServer(app);
initSockets(server);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(
      `Port ${config.port} is already in use — another NetAtlas backend instance is probably still running. ` +
        `Stop it (e.g. "lsof -i:${config.port}" then kill the PID) or set a different PORT in .env.`,
    );
    process.exit(1);
  }
  throw err;
});

server.listen(config.port, () => {
  logger.info(`NetAtlas backend listening on http://localhost:${config.port}`);
});
