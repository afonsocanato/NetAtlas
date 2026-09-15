# NetAtlas Backend

Node.js/Express API + Supabase (Postgres) storage + Socket.IO real-time layer. See [../docs/API.md](../docs/API.md) for the full contract and [../docs/DATABASE.md](../docs/DATABASE.md) for the schema.

## Setup

1. Create a project at [supabase.com](https://supabase.com) (free tier is enough).
2. In that project's **SQL Editor**, paste and run [supabase/schema.sql](supabase/schema.sql) once — creates the `networks`/`devices`/`presence_events`/`settings` tables.
3. In **Settings -> API**, copy the **Project URL** and the **`service_role` key** (not `anon`/`public` — the service role key bypasses Row Level Security, which is fine since only this backend ever uses it).

```bash
cp .env.example .env
# then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
npm install
npm run dev
```

Server starts on `http://localhost:4000` (configurable via `.env`).

## Login

The dashboard requires login by default — nothing to configure: on first boot, if `ADMIN_USERNAME`/`ADMIN_PASSWORD` aren't set, the backend generates a random admin login and prints it to the server log **once**:

```
No ADMIN_USERNAME/ADMIN_PASSWORD set — generated a login:
  username: admin
  password: ece0beffd1c7bfd7da
```

Copy that password down (or set `ADMIN_USERNAME`/`ADMIN_PASSWORD` in `.env` to pin your own before first boot). The same first-boot behavior generates a random `AGENT_API_KEY` if you didn't set one — view it anytime from the dashboard's Settings panel once logged in, or via `GET /api/admin/agent-key` with a valid session token. All of these are persisted in the Supabase `settings` table, so they survive restarts.

For a fully trusted LAN-only setup where login would just be friction, set `NETATLAS_DISABLE_AUTH=true` — **never** do this if the backend is reachable from the public internet.

## Tests

```bash
npm test
```

Runs on Node's built-in test runner (`node --test`) **against your configured Supabase project** — there's no local/in-memory database anymore, so `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` must be set (in `.env` or the environment) before running tests. Tests use a dedicated `network_id` (`test`) isolated from your real `default` network and clean up their own rows, but if you'd rather keep test traffic fully separate, point `.env` at a second, throwaway Supabase project while testing. Covers device upserts, custom-field updates, the online/offline reconciliation logic in [src/services/deviceService.js](src/services/deviceService.js), and the auth flow.

## Demo data

No agent running yet? Populate the database with a plausible fake home network:

```bash
npm run seed
```

Wipes and reseeds `devices`/`presence_events` (network `default`) with ~10 mock devices (router, laptop, phones, TV, IoT, one offline) so the frontend graph has something to show immediately.
