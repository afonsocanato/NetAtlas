# NetAtlas

NetAtlas maps the devices on your own local network in real time and shows them as an interactive graph — router at the center, every computer, phone, TV and IoT device around it, with IP, hostname, MAC address, vendor and online/offline status at a glance.

It's split into three independent pieces that only ever talk over HTTP/WebSocket: a **Python discovery agent** that runs on your machine and reads what your OS already knows about the network (ARP tables, optionally a light ping sweep), a **Node.js/Express backend** that stores and reconciles that data in Supabase (Postgres) and pushes live updates, and a **React + Cytoscape.js dashboard** that renders it.

NetAtlas only discovers hosts, never scans for open ports or exploits anything, and is meant to be pointed only at networks you own or administer. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md) for the full scope/ethics boundaries and technical caveats.

## Why

Most home network tools either live inside a router's clunky admin UI or require a full network-monitoring suite. NetAtlas is meant to be the lightweight, self-hosted, hackable middle ground: run one small agent, get a live picture of what's on your network, and own all the data yourself — nothing leaves your machine except traffic between your own agent, backend and browser.

## Features

**Discovery (agent)**
- Automatic local subnet and default-gateway detection — no manual config needed
- Passive ARP table reading, cross-platform (Windows `arp -a`, macOS `arp -a`, Linux `ip neigh`/`arp -a`)
- Optional, rate-limited active ping sweep to warm the ARP cache for idle hosts (opt-in, off by default)
- Best-effort hostname resolution (reverse DNS / mDNS)
- Vendor identification from MAC OUI prefix, fully offline (bundled full IEEE OUI table, no external API calls)
- Device type guessed from hostname/vendor keywords — router, computer, phone, TV, IoT, watch, speaker, console, camera — always user-correctable
- Optional BLE scan per cycle; heuristically matches a nearby BLE advertisement's name to a device when it can be done with confidence (see [docs/LIMITATIONS.md](docs/LIMITATIONS.md))
- Periodic reporting loop, configurable interval
- Run one agent per physical network you want tracked — see [docs/ARCHITECTURE.md#multi-network-model](docs/ARCHITECTURE.md#multi-network-model)

**Backend**
- REST API for devices, filters (status/vendor/type/search) and network summary stats
- Supabase (Postgres) storage — schema managed via a single SQL file you run once in the Supabase SQL Editor
- Upsert-by-MAC (falls back to IP when no MAC is available) so device history survives across scans
- Online → offline transition only after N consecutive missed reports, to absorb transient Wi-Fi drops
- Real-time push over Socket.IO (`device:new`, `device:updated`, `device:offline`, `scan:complete`), scoped per network
- Multi-network aware: auto-detects which network a visitor should see by matching their public IP to a recently-reporting network, with a manual override
- Login required by default (single admin account, JWT sessions) — zero-config: a random admin login and agent API key are generated on first boot if you don't set your own, so the dashboard is safe to put behind a real domain from day one (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

**Dashboard (frontend)**
- Force/concentric graph of the network via Cytoscape.js, router at the center
- Click any device for full details (IP, hostname, MAC, vendor, status, first/last seen)
- Editable custom label and device type per device, persisted to the backend
- Live search by IP/hostname/MAC, plus status/type filters
- Dark mode (persisted per-browser)
- Live updates over WebSocket, plus a manual refresh button for an instant re-fetch
- Network switcher in the topbar (appears once more than one network has reported) to view a network you're not currently on
- Settings panel that surfaces the agent's backend URL + API key ready to copy, so pairing a new agent never means hand-editing two `.env` files to keep a secret in sync

## Architecture

```
Python discovery agent  --REST-->  Node.js/Express backend  --WebSocket-->  React + Cytoscape dashboard
   (runs on your LAN)              (Supabase storage, Socket.IO)               (graph visualization)
```

Each component can be redeployed or rewritten independently as long as the REST/WebSocket contract holds — the agent never touches the database, and the frontend never touches the network directly (browsers can't do raw sockets/ARP anyway).

Full write-ups: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (data flow, component boundaries, deployment model), [docs/DATABASE.md](docs/DATABASE.md) (schema), [docs/API.md](docs/API.md) (REST + WebSocket contract), [docs/LIMITATIONS.md](docs/LIMITATIONS.md) (what discovery can and can't see, and why), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (putting it behind your own domain with HTTPS), [docs/ROADMAP.md](docs/ROADMAP.md) (phased plan).

## Quickstart

Requires Node.js ≥ 18, Python ≥ 3.10, and a free [Supabase](https://supabase.com) project.

**Before step 1**: in your Supabase project's SQL Editor, run [backend/supabase/schema.sql](backend/supabase/schema.sql) once, then copy the **Project URL** and **`service_role` key** from Settings → API — you'll paste them into `backend/.env` below.

Run each numbered step in its own terminal tab.

### macOS / Linux

```bash
# 1. Backend
cd backend && cp .env.example .env && npm install
```
Now open `backend/.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from the Supabase step above) before continuing:
```bash
npm run dev
```

```bash
# 2. Frontend (new terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

```bash
# 3. Discovery agent (new terminal) — NETATLAS_API_KEY must match the backend's
# agent key (see "First login" below for where to find it)
cd agent
python3 -m venv .venv && source .venv/bin/activate
pip3 install -r requirements.txt
NETATLAS_API_KEY=<paste the key from step 1's log, or the Settings panel> python3 -m netatlas_agent.main
```

### Windows (PowerShell)

```powershell
# 1. Backend
cd backend; Copy-Item .env.example .env; npm install
```
Now open `backend/.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from the Supabase step above) before continuing:
```powershell
npm run dev
```

```powershell
# 2. Frontend (new terminal)
cd frontend; Copy-Item .env.example .env; npm install; npm run dev
```

```powershell
# 3. Discovery agent (new terminal, run as Administrator for full ARP access) —
# NETATLAS_API_KEY must match the backend's agent key (see "First login" below)
cd agent
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:NETATLAS_API_KEY = "<paste the key from step 1's log, or the Settings panel>"
python -m netatlas_agent.main
```

> On Windows, if `.venv\Scripts\Activate.ps1` is blocked, run PowerShell as Administrator once and execute `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then retry.

### First login

Open `http://localhost:5173` — you'll land on a login screen. Nothing to configure: step 1's terminal printed a one-time admin username/password and an agent API key when the backend first booted, e.g.:

```
No ADMIN_USERNAME/ADMIN_PASSWORD set — generated a login:
  username: admin
  password: ece0beffd1c7bfd7da
Generated agent API key (no AGENT_API_KEY set): 8f2a9c...
```

Log in with that, then either paste the printed agent key into step 3, or grab it anytime from the gear icon in the dashboard's top bar. Devices discovered by the agent appear on the graph as they're reported, live.

To pin your own credentials instead of the generated ones, set `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`AGENT_API_KEY` in `backend/.env` before first boot.

### Or run it all with Docker Compose

Create a `.env` next to `docker-compose.yml` with your Supabase project's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (compose reads it automatically), then:

```bash
docker compose up --build
```

Builds and starts the backend and the frontend, wired together — `http://localhost:5173` is ready. The discovery agent is intentionally not containerized (it needs direct access to the host's ARP table/LAN); run it on the host as in step 3 above.

## Tests

```bash
cd backend
npm test
```

Backend unit tests run on Node's built-in test runner **against your configured Supabase project** (there's no local/in-memory database) — see [backend/README.md#tests](backend/README.md#tests) for how they stay isolated from your real data.

## Project structure

```
NetAtlas/
├── agent/      # Python discovery agent — subnet detection, ARP reading, hostname/vendor resolution
│   ├── scripts/update_oui.py  # regenerates oui_data/full_oui.json from IEEE's registry
│   └── netatlas_agent/
│       ├── discovery/   # network.py, arp_scan.py, icmp_scan.py, hostname.py, oui.py, classify.py, ble_scan.py, ble_match.py
│       ├── oui_data/     # bundled MAC vendor lookup table
│       ├── client.py    # reports batches to the backend
│       └── main.py      # discovery loop entrypoint
├── backend/    # Node.js/Express API, Supabase (Postgres) storage, Socket.IO real-time layer
│   ├── supabase/schema.sql  # run once in the Supabase SQL Editor — source of truth for the schema
│   ├── src/
│   │   ├── db/          # supabase client
│   │   ├── models/       # device + network + settings queries (Supabase JS client)
│   │   ├── services/     # ingestion + online/offline reconciliation
│   │   ├── security/     # secrets.js — auto-generates agent key/JWT secret/admin login on first boot
│   │   ├── controllers/, routes/, middleware/, sockets/  # includes networkContext.js — multi-network resolution
│   ├── test/             # node:test unit tests
│   └── Dockerfile
├── frontend/   # React + Vite dashboard, Cytoscape.js graph
│   ├── src/
│   │   ├── components/graph/    # NetworkGraph.jsx, deviceIcons.js
│   │   ├── components/devices/  # DeviceDetails.jsx
│   │   ├── components/layout/   # Topbar.jsx (search/filters/refresh/network switcher), Sidebar.jsx
│   │   ├── components/auth/     # LoginPage.jsx
│   │   ├── components/settings/ # SettingsModal.jsx (agent pairing info)
│   │   ├── constants/           # deviceTypes.js (colors/icons per type)
│   │   ├── hooks/, api/, context/, auth/, utils/
│   └── Dockerfile
├── docker-compose.yml  # one-command backend + frontend demo
└── docs/       # architecture, API contract, DB schema, limitations, roadmap
```

## Configuration

Each component reads its own `.env` (copy the committed `.env.example`):

| Component | Key vars |
|-----------|----------|
| `backend` | `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`, `OFFLINE_AFTER_MISSED_REPORTS`, `AGENT_API_KEY`\*, `ADMIN_USERNAME`\*, `ADMIN_PASSWORD`\*, `JWT_SECRET`\*, `NETATLAS_DISABLE_AUTH` |
| `frontend` | `VITE_API_URL` |
| `agent` | `NETATLAS_BACKEND_URL`, `NETATLAS_API_KEY`, `NETATLAS_NETWORK_ID`, `NETATLAS_SCAN_INTERVAL`, `NETATLAS_ACTIVE_PROBE`, `NETATLAS_RESOLVE_HOSTNAMES`, `NETATLAS_BLE_SCAN`, `NETATLAS_BLE_SCAN_SECONDS` |

\* Optional — auto-generated on first boot if left unset (see [backend/README.md#login](backend/README.md#login)).

Full list with defaults in each component's own README ([backend](backend/README.md), [frontend](frontend/README.md), [agent](agent/README.md)).

## Status & roadmap

Early-stage MVP — discovery, storage, real-time sync, the graph dashboard, login, multi-network support, BLE-assisted naming, and a custom-domain deployment path are all working end-to-end, with backend tests and Docker Compose in place. Not yet built: presence history, new-device alerts, export, and PWA. See [docs/ROADMAP.md](docs/ROADMAP.md) for the phased plan.

## License

MIT — see [LICENSE](LICENSE).
