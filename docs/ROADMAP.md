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
- ✅ Seed/mock data mode (`npm run seed`) so the dashboard is explorable without running the agent.
- ✅ Docker Compose (backend + frontend, backend auto-seeded) for a one-command demo. Agent stays host-run by design — see [ARCHITECTURE.md](ARCHITECTURE.md).
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

## Phase 5 — Extras (pick based on interest/time)
- Presence history charts, new-device alerts (toast/webhook), multi-network support, JSON/CSV export, PWA install, optional safe service detection (allowlisted ports only), multi-user accounts, dashboard stats page.

Each phase should ship as its own set of commits/PRs so the git history itself demonstrates incremental, well-scoped work — good for portfolio review.
