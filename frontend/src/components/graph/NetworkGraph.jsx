import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import { TYPE_COLOR_HEX } from '../../constants/deviceTypes.js';
import { deviceIconDataUri } from './deviceIcons.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { formatDeviceName } from '../../utils/formatName.js';

cytoscape.use(nodeHtmlLabel);

const LAYOUT = {
  name: 'concentric',
  concentric: (n) => (n.data('type') === 'router' ? 2 : 1),
  levelWidth: () => 1,
  minNodeSpacing: 55,
  animate: true,
  animationDuration: 300,
};

function toElements(devices) {
  const nodes = devices.map((d) => {
    const hostLabel = d.customLabel || d.hostname;
    // No hostname/custom label (common — see docs/LIMITATIONS.md on
    // reverse-DNS/mDNS failing often) but the MAC's OUI vendor lookup
    // resolved a brand (e.g. "Apple", "Xiaomi"): show that instead of just
    // the bare IP. Vendor strings come pre-formatted from the OUI table, so
    // they skip formatDeviceName (which assumes lowercase hostnames and
    // would mangle already-correct casing like "TP-LINK").
    const name = hostLabel ? formatDeviceName(hostLabel) : d.vendor || null;
    return {
      data: {
        id: String(d.id),
        // Real DOM label (see nodeHtmlLabel below) needs the raw name/ip
        // separately so it can style them differently — this plain-text
        // fallback is only what Cytoscape itself would ever show.
        name,
        ip: d.ip,
        type: d.deviceType,
        status: d.status,
      },
    };
  });

  const router = devices.find((d) => d.isRouter);
  const edges = router
    ? devices
        .filter((d) => !d.isRouter)
        .map((d) => ({
          data: { id: `e-${d.id}`, source: String(router.id), target: String(d.id), status: d.status },
        }))
    : [];

  return [...nodes, ...edges];
}

function nodeStylesheet() {
  return [
    {
      selector: 'node',
      style: {
        'background-color': (ele) => TYPE_COLOR_HEX[ele.data('type')] ?? TYPE_COLOR_HEX.unknown,
        'background-image': (ele) => deviceIconDataUri(ele.data('type')),
        'background-fit': 'contain',
        'background-width': '58%',
        'background-height': '58%',
        width: (ele) => (ele.data('type') === 'router' ? 52 : 36),
        height: (ele) => (ele.data('type') === 'router' ? 52 : 36),
        // A plain constant here (e.g. `3`) gets stuck at Cytoscape's default
        // 0px on first paint and never resolves to the real value until
        // something else forces a style recompute (e.g. selecting the node)
        // — combining transition-property with a scalar (non-mapper) value
        // on elements added via cy.json() hits that. Mapper functions (like
        // width/height above) don't have this problem, so wrap the constant
        // in one purely to dodge it.
        'border-width': () => 3,
        'border-color': (ele) => {
          const root = getComputedStyle(document.documentElement);
          const online = root.getPropertyValue('--ns-online').trim() || '#22c55e';
          const offline = root.getPropertyValue('--ns-offline').trim() || '#f87171';
          return ele.data('status') === 'online' ? online : offline;
        },
        'border-opacity': (ele) => (ele.data('status') === 'online' ? 0.9 : 0.7),
        'transition-property': 'border-width, border-color, background-color',
        'transition-duration': 150,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': () => 5,
        'border-color': (ele) => (ele.data('type') === 'router' ? TYPE_COLOR_HEX.router : '#ffffff'),
      },
    },
  ];
}

// Edges are styled with direct inline values (ele.style(...)) rather than a
// stylesheet 'edge' selector. cytoscape-node-html-label, once registered on
// an instance, corrupts the FIRST stylesheet-based style resolution for
// edges specifically — they render at a fixed ~30px width with
// curve-style: 'haystack' (Cytoscape's hard default) no matter what the
// 'edge' selector declares, and re-applying the stylesheet afterward
// doesn't fix already-added elements. Setting properties directly on each
// edge element sidesteps that resolution path entirely and is unaffected.
function applyEdgeStyle(cy) {
  const root = getComputedStyle(document.documentElement);
  const onlineColor = root.getPropertyValue('--ns-edge-online').trim() || '#0f9488';
  const offlineColor = root.getPropertyValue('--ns-edge').trim() || '#333a4d';
  cy.edges().forEach((ele, i) => {
    const online = ele.data('status') !== 'offline';
    ele.style({
      width: online ? 2 : 1.5,
      'line-color': online ? onlineColor : offlineColor,
      'line-style': online ? 'solid' : 'dashed',
      'line-opacity': online ? 0.75 : 0.5,
      // A gentle, consistent bow instead of a dead-straight line — every
      // other edge curves the opposite way so spokes radiating from the
      // router fan out instead of visually overlapping near the center.
      'curve-style': 'unbundled-bezier',
      'control-point-distances': i % 2 === 0 ? 22 : -22,
      'control-point-weights': 0.5,
    });
  });
}

function labelTemplate(data) {
  const nameLine = data.name ? `<div class="ns-node-label__name">${escapeHtml(data.name)}</div>` : '';
  // If there's no name, the IP is the only line and should read like the
  // "name" (normal size/weight) rather than a subtitle.
  const ipClass = data.name ? 'ns-node-label__ip' : 'ns-node-label__name';
  return `<div class="ns-node-label">${nameLine}<div class="${ipClass}">${escapeHtml(data.ip ?? '')}</div></div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function NetworkGraph({ devices, onSelectDevice }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: nodeStylesheet(),
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.25,
    });

    cyRef.current.nodeHtmlLabel([
      {
        query: 'node',
        halign: 'center',
        valign: 'bottom',
        halignBox: 'center',
        valignBox: 'bottom',
        cssClass: 'ns-node-label-wrap',
        tpl: labelTemplate,
      },
    ]);

    cyRef.current.json({ elements: toElements(devices) });
    applyEdgeStyle(cyRef.current);
    cyRef.current.layout(LAYOUT).run();

    cyRef.current.on('tap', 'node', (evt) => {
      onSelectDevice?.(Number(evt.target.id()));
    });

    cyRef.current.on('tap', (evt) => {
      if (evt.target === cyRef.current) onSelectDevice?.(null);
    });

    return () => cyRef.current?.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.json({ elements: toElements(devices) });
    applyEdgeStyle(cyRef.current);
    cyRef.current.layout(LAYOUT).run();
  }, [devices]);

  useEffect(() => {
    // Re-resolve CSS vars (they only get their final value after data-theme
    // is applied to <html>), so the graph repaints in the new palette. The
    // HTML labels themselves use CSS vars directly and repaint for free.
    if (!cyRef.current) return;
    cyRef.current.style(nodeStylesheet());
    applyEdgeStyle(cyRef.current);
  }, [theme]);

  return <div ref={containerRef} className="ns-graph" />;
}
