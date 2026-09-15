import { useEffect, useMemo, useState } from 'react';
import { Topbar } from './components/layout/Topbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { NetworkGraph } from './components/graph/NetworkGraph.jsx';
import { DeviceDetails } from './components/devices/DeviceDetails.jsx';
import { useDevices } from './hooks/useDevices.js';
import { api } from './api/client.js';

export function App() {
  const { devices, loading, error } = useDevices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.getSummary().then(setSummary).catch(() => {});
  }, [devices]);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (typeFilter && d.deviceType !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${d.ip ?? ''} ${d.hostname ?? ''} ${d.mac ?? ''} ${d.customLabel ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [devices, search, statusFilter, typeFilter]);

  const selectedDevice = devices.find((d) => d.id === selectedId) ?? null;

  return (
    <div className="ns-app">
      <Topbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />
      <div className="ns-main">
        <Sidebar summary={summary} />
        {loading ? (
          <p style={{ padding: 16 }}>Loading devices…</p>
        ) : error ? (
          <p style={{ padding: 16 }}>Could not reach backend: {error}</p>
        ) : (
          <NetworkGraph devices={filtered} onSelectDevice={setSelectedId} />
        )}
        <DeviceDetails device={selectedDevice} onClose={() => setSelectedId(null)} onUpdated={() => {}} />
      </div>
    </div>
  );
}
