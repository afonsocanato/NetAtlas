import http from 'node:http';
import { app } from './app.js';
import { initSockets } from './sockets/index.js';
import { initSecrets } from './security/secrets.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

await initSecrets();

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
