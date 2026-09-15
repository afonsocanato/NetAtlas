export function Sidebar({ summary }) {
  if (!summary) return null;

  return (
    <aside className="ns-sidebar">
      <h2>Overview</h2>
      <ul className="ns-stats">
        <li>Total <strong>{summary.total}</strong></li>
        <li>Online <strong>{summary.online}</strong></li>
        <li>Offline <strong>{summary.offline}</strong></li>
      </ul>
      <h3>By type</h3>
      <ul className="ns-stats">
        {Object.entries(summary.byType).map(([type, count]) => (
          <li key={type}>{type} <strong>{count}</strong></li>
        ))}
      </ul>
    </aside>
  );
}
