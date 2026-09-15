import { useTheme } from '../../context/ThemeContext.jsx';

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function Topbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  refreshing,
  networks = [],
  networkId,
  onNetworkChange,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="ns-topbar">
      <div className="ns-brand">
        <img className="ns-brand__logo" src="/logo-netatlas.png" alt="NetAtlas" />
      </div>

      <div className="ns-search-wrap">
        <SearchIcon />
        <input
          className="ns-search"
          type="search"
          placeholder="Search by IP, hostname or MAC…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {networks.length > 1 && (
        <div className="ns-filters">
          <select
            value={networkId ?? ''}
            onChange={(e) => onNetworkChange(e.target.value || null)}
            aria-label="Switch network"
            title="Which network's devices to show"
          >
            <option value="">Auto (this network)</option>
            {networks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name || n.id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ns-filters">
        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>
        <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)} aria-label="Filter by type">
          <option value="">All types</option>
          <option value="router">Router</option>
          <option value="computer">Computer</option>
          <option value="phone">Phone</option>
          <option value="tv">TV</option>
          <option value="iot">IoT</option>
          <option value="watch">Watch</option>
          <option value="speaker">Speaker</option>
          <option value="console">Console</option>
          <option value="camera">Camera</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>

      <button
        className="ns-icon-btn"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh devices"
        title="Refresh now"
      >
        <span className={refreshing ? 'ns-icon-spin' : undefined}>
          <RefreshIcon />
        </span>
      </button>

      <button
        className="ns-icon-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  );
}
