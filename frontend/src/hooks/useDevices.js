import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { getSocket } from '../api/socket.js';

export function useDevices(networkId) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(
    async (params) => {
      try {
        const data = await api.getDevices({ ...params, networkId });
        setDevices(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [networkId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const socket = getSocket(networkId);

    const upsert = (device) => {
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.id === device.id);
        if (idx === -1) return [...prev, device];
        const next = [...prev];
        next[idx] = { ...next[idx], ...device };
        return next;
      });
    };

    const onOffline = ({ id, status, lastSeen }) => {
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, status, lastSeen } : d)));
    };

    socket.on('device:new', upsert);
    socket.on('device:updated', upsert);
    socket.on('device:offline', onOffline);

    return () => {
      socket.off('device:new', upsert);
      socket.off('device:updated', upsert);
      socket.off('device:offline', onOffline);
    };
  }, [networkId]);

  return { devices, loading, error, refresh };
}
