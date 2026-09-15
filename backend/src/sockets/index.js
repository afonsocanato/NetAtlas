import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { verifySocketToken } from '../middleware/userAuth.js';

let io;

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!verifySocketToken(token)) return next(new Error('UNAUTHORIZED'));
    next();
  });

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });

  return io;
}

export function emitDeviceNew(device) {
  io?.emit('device:new', device);
}

export function emitDeviceUpdated(device) {
  io?.emit('device:updated', device);
}

export function emitDeviceOffline(device) {
  io?.emit('device:offline', { id: device.id, status: device.status, lastSeen: device.lastSeen });
}

export function emitScanComplete({ scannedAt, deviceCount }) {
  io?.emit('scan:complete', { scannedAt, deviceCount });
}
