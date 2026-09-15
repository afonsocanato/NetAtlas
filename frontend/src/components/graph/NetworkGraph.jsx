import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const TYPE_COLOR = {
  router: '#f59e0b',
  computer: '#38bdf8',
  phone: '#a78bfa',
  tv: '#f472b6',
  iot: '#34d399',
  unknown: '#94a3b8',
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
    ? devices.filter((d) => !d.isRouter).map((d) => ({ data: { id: `e-${d.id}`, source: String(router.id), target: String(d.id) } }))
    : [];

  return [...nodes, ...edges];
}

export function NetworkGraph({ devices, onSelectDevice }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: toElements(devices),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => TYPE_COLOR[ele.data('type')] ?? TYPE_COLOR.unknown,
            label: 'data(label)',
            color: 'var(--ns-text)',
            'font-size': 10,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            width: (ele) => (ele.data('type') === 'router' ? 46 : 30),
            height: (ele) => (ele.data('type') === 'router' ? 46 : 30),
            'border-width': 2,
            'border-color': (ele) => (ele.data('status') === 'online' ? '#22c55e' : '#ef4444'),
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': 'var(--ns-edge)',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: { name: 'concentric', concentric: (n) => (n.data('type') === 'router' ? 2 : 1), levelWidth: () => 1 },
      minZoom: 0.3,
      maxZoom: 3,
    });

    cyRef.current.on('tap', 'node', (evt) => {
      onSelectDevice?.(Number(evt.target.id()));
    });

    return () => cyRef.current?.destroy();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.json({ elements: toElements(devices) });
    cyRef.current.layout({ name: 'concentric', concentric: (n) => (n.data('type') === 'router' ? 2 : 1), levelWidth: () => 1 }).run();
  }, [devices]);

  return <div ref={containerRef} className="ns-graph" />;
}
