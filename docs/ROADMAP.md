# NetAtlas — Development Plan

## Phase 0 — Scaffolding ✅
- Repo structure, docs, minimal running skeletons for agent/backend/frontend.

## Phase 1 — MVP backend + storage ✅
- SQLite schema + migrations, `devices` CRUD, `/api/agent/report` ingestion with upsert-by-MAC, online/offline transition logic, Socket.IO wiring.

## Phase 2 — MVP agent ✅
- Subnet detection, ARP table parsing per-OS, optional active ARP probe, hostname resolution, bundled OUI database lookup, periodic reporting loop, config file.

## Phase 3 — MVP frontend ✅
- Cytoscape graph (router-centered star/force layout), device list, detail panel, search, status/vendor/type filters, dark mode, live updates via socket.

## Phase 4 — Polish for portfolio (in progress)
- ✅ Backend unit tests (`backend/test/`, `node --test`) covering device upserts and online/offline reconciliation.
- ✅ Seed/mock data mode (`npm run seed`) so the dashboard is explorable without running the agent.
- ✅ Docker Compose (backend + frontend, backend auto-seeded) for a one-command demo. Agent stays host-run by design — see [ARCHITECTURE.md](ARCHITECTURE.md).
- ⬜ Screenshots/GIF in README.
- ⬜ Agent unit tests (ARP/hostname/OUI parsing).
- ⬜ Frontend component tests.

## Phase 5 — Extras (pick based on interest/time)
- Presence history charts, new-device alerts (toast/webhook), multi-network support, JSON/CSV export, PWA install, optional safe service detection (allowlisted ports only), authentication (single-user login), dashboard stats page.

Each phase should ship as its own set of commits/PRs so the git history itself demonstrates incremental, well-scoped work — good for portfolio review.
