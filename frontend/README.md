# NetAtlas Frontend

React + Vite dashboard, graph rendered with Cytoscape.js, real-time updates via Socket.IO.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Opens on `http://localhost:5173`, expects the backend at `VITE_API_URL` (default `http://localhost:4000`).

Browsers have no access to raw sockets/ARP — this app only ever talks to the NetAtlas backend over HTTP/WebSocket; all network discovery happens in the separate [agent](../agent).
