import { io } from 'socket.io-client';
import { API_URL } from './client.js';
import { getToken } from '../auth/token.js';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, { autoConnect: false, auth: (cb) => cb({ token: getToken() }) });
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
}
