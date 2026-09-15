import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { TYPE_COLOR_HEX } from '../../constants/deviceTypes.js';
import { deviceIconDataUri } from './deviceIcons.js';
import { useTheme } from '../../context/ThemeContext.jsx';

const LAYOUT = {
  name: 'concentric',
  concentric: (n) => (n.data('type') === 'router' ? 2 : 1),
  levelWidth: () => 1,
  minNodeSpacing: 55,
  animate: true,
  animationDuration: 300,
};

function toElements(devices) {
  const nodes = devices.map((d) => ({
    data: {
      id: String(d.id),
      label: d.customLabel || d.hostname || d.ip,
      type: d.deviceType,
      status: d.status,
    },
  }));

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

function buildStyle() {
  const root = getComputedStyle(document.documentElement);
  const cssVar = (name, fallback) => root.getPropertyValue(name).trim() || fallback;

  const textColor = cssVar('--ns-text', '#e7e9ee');
  const panelColor = cssVar('--ns-panel', '#12151f');
  const edgeColor = cssVar('--ns-edge', '#333a4d');
  const onlineColor = cssVar('--ns-online', '#22c55e');
  const offlineColor = cssVar('--ns-offline', '#f87171');

  return [
    {
      selector: 'node',
      style: {
        'background-color': (ele) => TYPE_COLOR_HEX[ele.data('type')] ?? TYPE_COLOR_HEX.unknown,
        'background-image': (ele) => deviceIconDataUri(ele.data('type')),
        'background-fit': 'contain',
        'background-width': '58%',
        'background-height': '58%',
        label: 'data(label)',
        color: textColor,
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': 11,
        'font-weight': 500,
        'text-valign': 'bottom',
        'text-margin-y': 8,
        'text-background-color': panelColor,
        'text-background-opacity': 0.85,
        'text-background-shape': 'roundrectangle',
        'text-background-padding': '3px',
        width: (ele) => (ele.data('type') === 'router' ? 52 : 36),
        height: (ele) => (ele.data('type') === 'router' ? 52 : 36),
        'border-width': 3,
        'border-color': (ele) => (ele.data('status') === 'online' ? onlineColor : offlineColor),
        'border-opacity': (ele) => (ele.data('status') === 'online' ? 0.9 : 0.7),
        'transition-property': 'border-width, border-color, background-color',
        'transition-duration': 150,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 5,
        'border-color': (ele) => (ele.data('type') === 'router' ? TYPE_COLOR_HEX.router : '#ffffff'),
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': edgeColor,
        'line-style': (ele) => (ele.data('status') === 'offline' ? 'dashed' : 'solid'),
        'line-opacity': (ele) => (ele.data('status') === 'offline' ? 0.5 : 1),
        'curve-style': 'straight',
      },
    },
  ];
}

export function NetworkGraph({ devices, onSelectDevice }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: toElements(devices),
      style: buildStyle(),
      layout: LAYOUT,
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.25,
    });

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
    cyRef.current.layout(LAYOUT).run();
  }, [devices]);

  useEffect(() => {
    // Re-resolve CSS vars (they only get their final value after data-theme
    // is applied to <html>), so the graph repaints in the new palette.
    if (!cyRef.current) return;
    cyRef.current.style(buildStyle());
  }, [theme]);

  return <div ref={containerRef} className="ns-graph" />;
}
