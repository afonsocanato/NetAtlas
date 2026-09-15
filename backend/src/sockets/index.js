import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { verifySocketToken } from '../middleware/userAuth.js';
import { networksModel } from '../models/networksModel.js';

let io;

function socketClientIp(socket) {
  const cf = socket.handshake.headers['cf-connecting-ip'];
  if (cf) return cf;
  const xff = socket.handshake.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return socket.handshake.address;
}

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!verifySocketToken(token)) return next(new Error('UNAUTHORIZED'));
    next();
  });

  io.on('connection', async (socket) => {
    // An explicit networkId (from the dashboard's manual network switcher —
    // see middleware/networkContext.js for the matching REST-side override)
    // wins; otherwise fall back to the same IP-matching used there, so live
    // pushes never leak a device update from one visitor's network into
    // another's dashboard by default.
    const requested = socket.handshake.auth?.networkId;
    const networkId = requested || (await networksModel.findByPublicIp(socketClientIp(socket)).catch(() => null)) || 'default';
    socket.join(networkId);
    socket.on('disconnect', () => {});
  });

  return io;
}

export function emitDeviceNew(device) {
  io?.to(device.networkId).emit('device:new', device);
}

export function emitDeviceUpdated(device) {
  io?.to(device.networkId).emit('device:updated', device);
}

export function emitDeviceOffline(device) {
  io?.to(device.networkId).emit('device:offline', { id: device.id, status: device.status, lastSeen: device.lastSeen });
}

export function emitScanComplete(networkId, { scannedAt, deviceCount }) {
  io?.to(networkId).emit('scan:complete', { scannedAt, deviceCount });
}
