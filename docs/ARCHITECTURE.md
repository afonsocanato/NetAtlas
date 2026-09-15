# NetAtlas — Architecture

## Overview

NetAtlas has three independently deployable components that communicate over HTTP/WebSocket, never sharing code or process space:

```
┌─────────────────┐        HTTPS/REST         ┌──────────────────┐        WebSocket        ┌──────────────────┐
│  Discovery Agent │ ───────────────────────▶ │      Backend       │ ───────────────────────▶ │     Frontend       │
│    (Python)       │   POST /api/agent/report │  (Node.js/Express)  │   device:* events        │  (React + Vite)     │
│  runs on user's    │                          │  + Supabase storage   │                          │  Cytoscape.js graph │
│  machine, LAN-only │ ◀─────────────────────── │  + Socket.IO server  │ ◀─────────────────────── │  REST + WS client   │
└─────────────────┘        API key auth        └──────────────────┘        REST (GET/PATCH)     └──────────────────┘
```

### Why this split

- **Agent (Python)** — network discovery needs raw sockets, ARP tables, and OS-level tools (`arp`, `ping`, `nmap` optional). Python's stdlib + small deps (`scapy` optional, `getmac`, `psutil`) make this portable across Windows/Linux/macOS without compiling native Node addons.
- **Backend (Node/Express)** — single source of truth. Owns the Supabase (Postgres) database via the service-role key, exposes REST for the frontend and for the agent to push data, and fans out real-time updates via Socket.IO. Stateless discovery logic never lives here — it only ingests and reconciles.
- **Frontend (React/Vite)** — pure visualization/interaction layer. Never talks to the LAN directly (browsers can't do raw sockets/ARP anyway — see Limitations). Talks only to the backend.

This separation means each piece can be rewritten independently (e.g. swap the agent for a Go binary later) as long as the REST/WebSocket contract holds.

## Data flow

1. Agent starts, detects the local subnet (from the machine's own network interface, e.g. `192.168.1.0/24`).
2. Agent runs a discovery cycle every N seconds (configurable):
   - ARP table read (`arp -a` / `/proc/net/arp` / `ip neigh`) — fast, non-intrusive, only sees hosts the OS already knows about.
   - Optional active probe: lightweight ICMP ping sweep or ARP request broadcast to populate the ARP table for hosts not yet seen (opt-in, since it's a mild active technique — still LAN-only, non-intrusive).
   - For each responsive IP: resolve hostname (reverse DNS / mDNS best-effort), look up MAC from ARP, resolve vendor from the MAC's OUI prefix using a local (bundled) OUI database — no external API calls.
3. Agent posts a batch report to `POST /api/agent/report` with an API key header.
4. Backend upserts each device by MAC (fallback: IP if MAC unavailable), updates `last_seen`, flips `status`, and detects new devices.
5. Backend emits WebSocket events (`device:new`, `device:updated`, `device:offline`, `scan:complete`) to all connected dashboards.
6. Frontend keeps an in-memory device store synced by WebSocket, renders it as a Cytoscape graph, and falls back to REST polling/refetch if the socket drops.

## Component boundaries

| Concern                          | Owner    |
|-----------------------------------|----------|
| Subnet/interface detection        | Agent    |
| Active/passive host discovery     | Agent    |
| MAC/vendor/hostname resolution    | Agent    |
| Persistence & online/offline logic| Backend  |
| Device type classification (manual/heuristic) | Backend |
| User login (JWT) & agent pairing key | Backend |
| Multi-network scoping (future)    | Backend |
| Graph layout & rendering          | Frontend |
| Search/filter UI state            | Frontend |

## Deployment model

- Agent: runs as a local process/service on the user's machine (same machine as the network being scanned, or any machine inside that LAN). Only ever makes outbound requests to the backend's URL — local or public.
- Backend: can run on the same machine as the agent, or on a small always-on device (Raspberry Pi, home server) — the agent just needs network access to it (LAN address or a public domain, see below).
- Frontend: static build served by the backend (or any static host) pointing at the backend's API/WS URL.
- Optionally, both backend and frontend can sit behind a reverse proxy on a real domain with HTTPS, so the dashboard is reachable from anywhere — the agent still runs on the LAN and just points at that domain instead of `localhost`. Login (on by default) is what makes this safe to expose. See [DEPLOYMENT.md](DEPLOYMENT.md).

See [DATABASE.md](DATABASE.md), [API.md](API.md), and [LIMITATIONS.md](LIMITATIONS.md) for details.
