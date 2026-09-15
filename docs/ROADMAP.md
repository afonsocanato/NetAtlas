# NetAtlas — Development Plan

## Phase 0 — Scaffolding ✅
- Repo structure, docs, minimal running skeletons for agent/backend/frontend.

## Phase 1 — MVP backend + storage ✅
- Postgres schema (Supabase), `devices` CRUD, `/api/agent/report` ingestion with upsert-by-MAC, online/offline transition logic, Socket.IO wiring.

## Phase 2 — MVP agent ✅
- Subnet detection, ARP table parsing per-OS, optional active ARP probe, hostname resolution, bundled OUI database lookup, periodic reporting loop, config file.

## Phase 3 — MVP frontend ✅
- Cytoscape graph (router-centered star/force layout), device list, detail panel, search, status/vendor/type filters, dark mode, live updates via socket.

## Phase 4 — Polish for portfolio (in progress)
- ✅ Backend unit tests (`backend/test/`, `node --test`) covering device upserts and online/offline reconciliation.
- ✅ Docker Compose (backend + frontend) for a one-command setup. Agent stays host-run by design — see [ARCHITECTURE.md](ARCHITECTURE.md).
- ⬜ Screenshots/GIF in README.
- ⬜ Agent unit tests (ARP/hostname/OUI parsing).
- ⬜ Frontend component tests.

## Phase 4.5 — Auth & public deployment ✅
- ✅ Single-admin login (JWT sessions), on by default, zero required config — random admin login + agent API key auto-generated and persisted on first boot if left unset, printed once to the server log.
- ✅ Settings panel (dashboard) surfaces the current agent API key + backend URL so pairing an agent never means hand-syncing two `.env` files.
- ✅ `NETATLAS_DISABLE_AUTH` escape hatch documented for trusted LAN-only setups.
- ✅ [docs/DEPLOYMENT.md](DEPLOYMENT.md) — reverse proxy + HTTPS on a custom domain, single-origin routing to sidestep CORS, agent pointed at the public URL.

## Phase 4.6 — Storage on Supabase ✅
- ✅ Swapped `better-sqlite3` for `@supabase/supabase-js` (Postgres) — [backend/supabase/schema.sql](../backend/supabase/schema.sql) is now the schema source of truth, RLS enabled with no policies (only the backend's service role key touches these tables).
- ✅ Model layer (`deviceModel`, `settingsModel`) and everything downstream converted to async; `secrets.js` bootstrap now runs once at server startup via `initSecrets()`.
- ✅ Tests point at the real configured Supabase project, isolated by a per-file fixture `network_id` and a `test_`-prefixed settings key namespace so a test run can never touch real data or credentials.

## Phase 4.7 — Multi-network + BLE-assisted naming ✅
- ✅ Multi-network support: one agent per physical network (`NETATLAS_NETWORK_ID`), backend auto-detects which network a dashboard visitor should see by matching their public IP against a recently-reporting network, with a manual override (`?networkId=`, surfaced as a topbar switcher once more than one network exists) — see [ARCHITECTURE.md#multi-network-model](ARCHITECTURE.md#multi-network-model).
- ✅ Expanded device-type heuristics: `watch`, `speaker`, `console`, `camera` alongside the original set, guessed from hostname/vendor keywords.
- ✅ Full IEEE OUI table bundled (`agent/netatlas_agent/oui_data/full_oui.json`, regenerated via `agent/scripts/update_oui.py`) instead of a tiny sample, for real vendor coverage.
- ✅ Optional BLE scan (`agent/netatlas_agent/discovery/ble_scan.py`, subprocess-isolated) with conservative, vendor/RSSI-gated name matching (`ble_match.py`) — see [LIMITATIONS.md](LIMITATIONS.md) for why this is heuristic, never certain identification.

## Phase 5 — Extras (pick based on interest/time)
- Presence history charts, new-device alerts (toast/webhook), JSON/CSV export, PWA install, optional safe service detection (allowlisted ports only), multi-user accounts, dashboard stats page.

Each phase should ship as its own set of commits/PRs so the git history itself demonstrates incremental, well-scoped work — good for portfolio review.
