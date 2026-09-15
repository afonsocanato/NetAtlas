import { useEffect, useMemo, useState } from 'react';
import { Topbar } from './components/layout/Topbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { NetworkGraph } from './components/graph/NetworkGraph.jsx';
import { DeviceDetails } from './components/devices/DeviceDetails.jsx';
import { useDevices } from './hooks/useDevices.js';
import { api } from './api/client.js';

function GraphIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <path d="M12 8.5V13M12 13L6.8 16.3M12 13l5.2 3.3" />
    </svg>
  );
}

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

        <div className="ns-graph-pane">
          {loading ? (
            <div className="ns-graph-status">
              <div className="ns-spinner" />
            </div>
          ) : error ? (
            <div className="ns-graph-empty">
              <GraphIcon />
              <div className="ns-graph-empty__title">Could not reach the backend</div>
              <div className="ns-graph-empty__hint">{error}</div>
            </div>
          ) : devices.length === 0 ? (
            <div className="ns-graph-empty">
              <GraphIcon />
              <div className="ns-graph-empty__title">No devices yet</div>
              <div className="ns-graph-empty__hint">
                Run the discovery agent, or populate demo data from the backend with <code>npm run seed</code>.
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ns-graph-empty">
              <GraphIcon />
              <div className="ns-graph-empty__title">No devices match your filters</div>
              <div className="ns-graph-empty__hint">Try clearing the search or filters above.</div>
            </div>
          ) : (
            <NetworkGraph devices={filtered} onSelectDevice={setSelectedId} />
          )}
        </div>

        {selectedDevice && (
          <DeviceDetails
            key={selectedDevice.id}
            device={selectedDevice}
            onClose={() => setSelectedId(null)}
            onUpdated={() => {}}
          />
        )}
      </div>
    </div>
  );
}
