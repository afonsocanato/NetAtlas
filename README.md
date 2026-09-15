# NetAtlas

NetAtlas maps the devices on your own local network in real time and shows them as an interactive graph — router at the center, every computer, phone, TV and IoT device around it, with IP, hostname, MAC address, vendor and online/offline status at a glance.

It's split into three independent pieces that only ever talk over HTTP/WebSocket: a **Python discovery agent** that runs on your machine and reads what your OS already knows about the network (ARP tables, optionally a light ping sweep), a **Node.js/Express backend** that stores and reconciles that data in SQLite and pushes live updates, and a **React + Cytoscape.js dashboard** that renders it.

NetAtlas only discovers hosts, never scans for open ports or exploits anything, and is meant to be pointed only at networks you own or administer. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for the full scope/ethics boundaries and technical caveats.

## Why

Most home network tools either live inside a router's clunky admin UI or require a full network-monitoring suite. NetAtlas is meant to be the lightweight, self-hosted, hackable middle ground: run one small agent, get a live picture of what's on your network, and own all the data yourself — nothing leaves your machine except traffic between your own agent, backend and browser.

## Features

**Discovery (agent)**
- Automatic local subnet and default-gateway detection — no manual config needed
- Passive ARP table reading, cross-platform (Windows `arp -a`, macOS `arp -a`, Linux `ip neigh`/`arp -a`)
- Optional, rate-limited active ping sweep to warm the ARP cache for idle hosts (opt-in, off by default)
- Best-effort hostname resolution (reverse DNS / mDNS)
- Vendor identification from MAC OUI prefix, fully offline (local lookup table, no external API calls)
- Periodic reporting loop, configurable interval

**Backend**
- REST API for devices, filters (status/vendor/type/search) and network summary stats
- SQLite storage with automatic migrations on boot
- Upsert-by-MAC (falls back to IP when no MAC is available) so device history survives across scans
- Online → offline transition only after N consecutive missed reports, to absorb transient Wi-Fi drops
- Real-time push over Socket.IO (`device:new`, `device:updated`, `device:offline`, `scan:complete`)
- Simple shared-secret auth between agent and backend

**Dashboard (frontend)**
- Force/concentric graph of the network via Cytoscape.js, router at the center
- Click any device for full details (IP, hostname, MAC, vendor, status, first/last seen)
- Editable custom label and device type per device, persisted to the backend
- Live search by IP/hostname/MAC, plus status/type filters
- Dark mode (persisted per-browser)
- Live updates over WebSocket — no manual refresh needed

## Architecture

```
Python discovery agent  --REST-->  Node.js/Express backend  --WebSocket-->  React + Cytoscape dashboard
   (runs on your LAN)              (SQLite storage, Socket.IO)                (graph visualization)
```

Each component can be redeployed or rewritten independently as long as the REST/WebSocket contract holds — the agent never touches the database, and the frontend never touches the network directly (browsers can't do raw sockets/ARP anyway).

Full write-ups: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (data flow, component boundaries, deployment model), [docs/DATABASE.md](docs/DATABASE.md) (schema), [docs/API.md](docs/API.md) (REST + WebSocket contract), [docs/LIMITATIONS.md](docs/LIMITATIONS.md) (what discovery can and can't see, and why), [docs/ROADMAP.md](docs/ROADMAP.md) (phased plan).

## Quickstart

Requires Node.js ≥ 18 and Python ≥ 3.10.

```bash
# 1. Backend
cd backend && cp .env.example .env && npm install && npm run dev

# 2. Frontend (new terminal)
cd frontend && cp .env.example .env && npm install && npm run dev

# 3. Discovery agent (new terminal) — NETATLAS_API_KEY must match backend's AGENT_API_KEY
cd agent && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
NETATLAS_API_KEY=change-me-to-a-random-secret python -m netatlas_agent.main
```

Open `http://localhost:5173` — devices discovered by the agent appear on the graph as they're reported, live.

## Project structure

```
NetAtlas/
├── agent/      # Python discovery agent — subnet detection, ARP reading, hostname/vendor resolution
│   └── netatlas_agent/
│       ├── discovery/   # network.py, arp_scan.py, icmp_scan.py, hostname.py, oui.py
│       ├── client.py    # reports batches to the backend
│       └── main.py      # discovery loop entrypoint
├── backend/    # Node.js/Express API, SQLite storage, Socket.IO real-time layer
│   └── src/
│       ├── db/          # connection + migrations
│       ├── models/       # device queries
│       ├── services/     # ingestion + online/offline reconciliation
│       ├── controllers/, routes/, middleware/, sockets/
├── frontend/   # React + Vite dashboard, Cytoscape.js graph
│   └── src/
│       ├── components/graph/    # NetworkGraph.jsx
│       ├── components/devices/  # DeviceDetails.jsx
│       ├── components/layout/   # Topbar.jsx, Sidebar.jsx
│       ├── hooks/, api/, context/
└── docs/       # architecture, API contract, DB schema, limitations, roadmap
```

## Configuration

Each component reads its own `.env` (copy the committed `.env.example`):

| Component | Key vars |
|-----------|----------|
| `backend` | `PORT`, `DB_PATH`, `AGENT_API_KEY`, `OFFLINE_AFTER_MISSED_REPORTS`, `CORS_ORIGIN` |
| `frontend` | `VITE_API_URL` |
| `agent` | `NETATLAS_BACKEND_URL`, `NETATLAS_API_KEY`, `NETATLAS_SCAN_INTERVAL`, `NETATLAS_ACTIVE_PROBE`, `NETATLAS_RESOLVE_HOSTNAMES` |

Full list with defaults in each component's own README ([backend](backend/README.md), [frontend](frontend/README.md), [agent](agent/README.md)).

## Status & roadmap

Early-stage MVP — discovery, storage, real-time sync and the graph dashboard are working end-to-end. Not yet built: automated tests, Docker Compose, a demo/mock-data mode, presence history, new-device alerts, multi-network support, export, PWA, and authentication. See [docs/ROADMAP.md](docs/ROADMAP.md) for the phased plan.

## License

MIT — see [LICENSE](LICENSE).
