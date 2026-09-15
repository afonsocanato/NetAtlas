import { TYPE_COLOR_VAR, TYPE_ORDER } from '../../constants/deviceTypes.js';

export function Sidebar({ summary }) {
  if (!summary) return null;

  const byType = TYPE_ORDER.filter((type) => summary.byType[type]).map((type) => ({ type, count: summary.byType[type] }));

  return (
    <aside className="ns-sidebar">
      <h2>Overview</h2>
      <div className="ns-stat-grid">
        <div className="ns-stat-card ns-stat-card--wide">
          <div>
            <div className="ns-stat-card__value">{summary.total}</div>
            <div className="ns-stat-card__label">Total devices</div>
          </div>
        </div>
        <div className="ns-stat-card ns-stat-card--online">
          <div className="ns-stat-card__value">{summary.online}</div>
          <div className="ns-stat-card__label">Online</div>
        </div>
        <div className="ns-stat-card ns-stat-card--offline">
          <div className="ns-stat-card__value">{summary.offline}</div>
          <div className="ns-stat-card__label">Offline</div>
        </div>
      </div>

      <h2>By type</h2>
      <ul className="ns-legend">
        {byType.map(({ type, count }) => (
          <li key={type}>
            <span className="ns-legend__dot" style={{ background: TYPE_COLOR_VAR[type] }} />
            {type}
            <span className="ns-legend__count">{count}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
