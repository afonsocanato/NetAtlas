import { io } from 'socket.io-client';
import { API_URL } from './client.js';

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL, { autoConnect: true });
  }
  return socket;
}
