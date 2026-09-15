import { io } from 'socket.io-client';
import { API_URL } from './client.js';
import { getToken } from '../auth/token.js';

let socket;
let currentNetworkId;

// networkId lets the caller pin which network's room to join (the
// dashboard's manual network switcher) instead of the server's own
// IP-based guess (see backend/src/middleware/networkContext.js) — pass
// undefined/null to go back to that default. Changing it forces a
// reconnect so the server re-resolves the room with the new value.
export function getSocket(networkId) {
  if (!socket) {
    socket = io(API_URL, { autoConnect: false, auth: (cb) => cb({ token: getToken(), networkId: currentNetworkId }) });
  }
  if (networkId !== undefined && networkId !== currentNetworkId) {
    currentNetworkId = networkId;
    if (socket.connected) socket.disconnect();
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
}
