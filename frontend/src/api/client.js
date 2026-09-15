const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getDevices: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    return request(`/api/devices?${query.toString()}`);
  },
  getDevice: (id) => request(`/api/devices/${id}`),
  updateDevice: (id, patch) => request(`/api/devices/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteDevice: (id) => request(`/api/devices/${id}`, { method: 'DELETE' }),
  getSummary: () => request('/api/network/summary'),
};

export { API_URL };
