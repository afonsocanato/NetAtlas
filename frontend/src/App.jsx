import { useEffect, useMemo, useRef, useState } from 'react';
import { Topbar } from './components/layout/Topbar.jsx';
import { Sidebar } from './components/layout/Sidebar.jsx';
import { NetworkGraph } from './components/graph/NetworkGraph.jsx';
import { DeviceDetails } from './components/devices/DeviceDetails.jsx';
import { LoginPage } from './components/auth/LoginPage.jsx';
import { useDevices } from './hooks/useDevices.js';
import { useAuth } from './context/AuthContext.jsx';
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

function Dashboard() {
  const { devices, loading, error, refresh } = useDevices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const detailsRef = useRef(null);

  useEffect(() => {
    api.getSummary().then(setSummary).catch(() => {});
  }, [devices]);

  // Manual refresh: re-fetches devices + summary right away, instead of
  // waiting for the next socket push from the agent's scan interval. Tracked
  // separately from the hook's own `loading` (which only covers the very
  // first fetch) so this only spins the topbar button, not the whole graph
  // pane.
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), api.getSummary().then(setSummary).catch(() => {})]);
    } finally {
      setRefreshing(false);
    }
  };

  // On the stacked mobile layout, the details panel lands below the graph —
  // and a swipe starting on the graph pans/zooms it (Cytoscape) instead of
  // scrolling the page, so picking a device could leave the panel
  // unreachable. Scroll it into view automatically whenever one is picked.
  useEffect(() => {
    if (selectedId != null && window.innerWidth <= 860) {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedId]);

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
        onRefresh={handleRefresh}
        refreshing={refreshing}
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
            ref={detailsRef}
            device={selectedDevice}
            onClose={() => setSelectedId(null)}
            onUpdated={() => {}}
          />
        )}
      </div>
    </div>
  );
}

export function App() {
  const { isAuthenticated, checking } = useAuth();

  if (checking) {
    return (
      <div className="ns-graph-status" style={{ height: '100vh' }}>
        <div className="ns-spinner" />
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginPage />;
}
