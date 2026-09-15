// Small monochrome line icons rendered inside each graph node, so device
// types are recognizable at a glance instead of relying on color alone.
const ICON_PATHS = {
  router:
    '<path d="M4 15h16l-1.5-6a2 2 0 0 0-2-1.5H7.5a2 2 0 0 0-2 1.5L4 15z"/><circle cx="12" cy="17.5" r="1"/><path d="M8 10.5V8M12 10.5V6M16 10.5V8"/>',
  computer: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  phone: '<rect x="7.5" y="3" width="9" height="18" rx="2"/><path d="M11 18.5h2"/>',
  tv: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8.5 20l-1.5 2.5M15.5 20l1.5 2.5"/>',
  iot: '<rect x="8" y="8" width="8" height="8" rx="1.5"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2 2M17.5 6.5l-2 2M6.5 17.5l2-2M17.5 17.5l-2-2"/>',
  watch: '<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9.5 7V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M9.5 17v2.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V17"/><path d="M17 10.5h1.8v3H17"/>',
  speaker: '<rect x="7" y="3" width="10" height="18" rx="5"/><circle cx="12" cy="9" r="1.4"/><circle cx="12" cy="13.5" r="1.4"/><circle cx="12" cy="18" r="0.6"/>',
  console:
    '<rect x="3" y="9" width="18" height="8" rx="4"/><path d="M7.5 11v4M5.5 13h4"/><circle cx="15.5" cy="12" r="0.9"/><circle cx="17.8" cy="14.2" r="0.9"/>',
  camera:
    '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.3"/><path d="M8.5 7l1.2-2.5h4.6L15.5 7"/>',
  unknown:
    '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.5 2.5 0 0 1 4.8 1c0 1.6-2.3 1.8-2.3 3.4"/><circle cx="12" cy="16.7" r="0.2"/>',
};

export function deviceIconDataUri(type) {
  const path = ICON_PATHS[type] ?? ICON_PATHS.unknown;
  // width/height are required (not just viewBox) — Cytoscape's canvas
  // renderer reads them to size the image and mis-renders a tiny corner
  // crop of the icon without them, even though a plain <img> tag is fine
  // either way.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
