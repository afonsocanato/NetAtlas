import { useTheme } from '../../context/ThemeContext.jsx';

export function Topbar({ search, onSearchChange, statusFilter, onStatusFilterChange, typeFilter, onTypeFilterChange }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="ns-topbar">
      <h1>NetAtlas</h1>
      <input
        className="ns-search"
        type="search"
        placeholder="Search by IP, hostname or MAC…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
        <option value="">All statuses</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
      </select>
      <select value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}>
        <option value="">All types</option>
        <option value="router">Router</option>
        <option value="computer">Computer</option>
        <option value="phone">Phone</option>
        <option value="tv">TV</option>
        <option value="iot">IoT</option>
        <option value="unknown">Unknown</option>
      </select>
      <button onClick={toggleTheme}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
    </header>
  );
}
