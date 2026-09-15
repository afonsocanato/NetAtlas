import http from 'node:http';
import { app } from './app.js';
import { initSockets } from './sockets/index.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

const server = http.createServer(app);
initSockets(server);

server.listen(config.port, () => {
  logger.info(`NetAtlas backend listening on http://localhost:${config.port}`);
});
