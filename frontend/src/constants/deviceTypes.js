// Two maps because Cytoscape renders to canvas and can't resolve CSS custom
// properties itself — DOM elements (Sidebar, badges) use the CSS var so they
// stay in sync with theme.css; the graph uses the resolved hex directly.
export const TYPE_COLOR_VAR = {
  router: 'var(--ns-router)',
  computer: 'var(--ns-computer)',
  phone: 'var(--ns-phone)',
  tv: 'var(--ns-tv)',
  iot: 'var(--ns-iot)',
  watch: 'var(--ns-watch)',
  speaker: 'var(--ns-speaker)',
  console: 'var(--ns-console)',
  camera: 'var(--ns-camera)',
  unknown: 'var(--ns-unknown)',
};

export const TYPE_COLOR_HEX = {
  router: '#f59e0b',
  computer: '#38bdf8',
  phone: '#2dd4bf',
  tv: '#f472b6',
  iot: '#34d399',
  watch: '#a78bfa',
  speaker: '#fb923c',
  console: '#818cf8',
  camera: '#ef4444',
  unknown: '#94a3b8',
};

export const TYPE_ORDER = ['router', 'computer', 'phone', 'tv', 'iot', 'watch', 'speaker', 'console', 'camera', 'unknown'];
