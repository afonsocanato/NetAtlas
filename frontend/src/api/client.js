import { getToken } from '../auth/token.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    onUnauthorized();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/api/auth/me'),
  getAgentKey: () => request('/api/admin/agent-key'),
  getDevices: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    return request(`/api/devices?${query.toString()}`);
  },
  getDevice: (id) => request(`/api/devices/${id}`),
  updateDevice: (id, patch) => request(`/api/devices/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteDevice: (id) => request(`/api/devices/${id}`, { method: 'DELETE' }),
  getSummary: (networkId) => request(`/api/network/summary${networkId ? `?networkId=${encodeURIComponent(networkId)}` : ''}`),
  getNetworks: () => request('/api/networks'),
};

export { API_URL };
