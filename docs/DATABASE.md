# NetAtlas — Database Model (Supabase / Postgres)

Storage is a Supabase (Postgres) project — the backend talks to it via `@supabase/supabase-js` using the **service role key**, which bypasses Row Level Security, so all query logic lives in the backend's models, not in RLS policies. The frontend and agent never talk to Supabase directly; they only ever go through NetAtlas's own REST API.

The schema's source of truth is [backend/supabase/schema.sql](../backend/supabase/schema.sql) — run it once in the Supabase SQL Editor when setting up a project. What follows here documents that schema; keep them in sync if you change one.

## `networks`

Represents a scanned LAN — one row per distinct `NETATLAS_NETWORK_ID` an agent has ever reported with. Ships with a single implicit `default` network for the common single-agent case; run a second agent instance (its own `NETATLAS_NETWORK_ID`) inside another physical network to get a second row here. See [ARCHITECTURE.md#multi-network-model](ARCHITECTURE.md#multi-network-model) for how the dashboard picks which one a visitor sees.

| Column         | Type        | Notes                                                              |
|----------------|-------------|---------------------------------------------------------------------|
| id             | text PK     | e.g. `"default"`, or whatever `NETATLAS_NETWORK_ID` an agent used    |
| name           | text        | user-friendly label, e.g. "Home" — defaults to `id` until renamed    |
| cidr           | text        | e.g. `192.168.1.0/24`                                                |
| public_ip      | text null   | public IP the agent last reported from — backs the dashboard's auto-detect (see [networkContext.js](../backend/src/middleware/networkContext.js)) |
| last_report_at | timestamptz null | updated on every agent report from this network                |
| created_at     | timestamptz |                                                                       |

## `devices`

| Column        | Type        | Notes                                                         |
|---------------|-------------|------------------------------------------------------------------|
| id            | bigint identity PK |                                                         |
| network_id    | text        | FK → networks.id                                                 |
| mac           | text        | normalized uppercase, unique per network when known              |
| ip            | text        | last known IP (can change on DHCP renewal)                       |
| hostname      | text null   | best-effort, from reverse DNS / mDNS / NetBIOS                   |
| vendor        | text null   | resolved from MAC OUI prefix                                     |
| ble_name      | text null   | name from a nearby BLE advertisement, heuristically matched by the agent — see [agent/netatlas_agent/discovery/ble_match.py](../agent/netatlas_agent/discovery/ble_match.py); often absent |
| device_type   | text        | `router` \| `computer` \| `phone` \| `tv` \| `iot` \| `watch` \| `speaker` \| `console` \| `camera` \| `unknown` — heuristic, user-editable |
| custom_label  | text null   | user-defined display name — display priority in the UI is `custom_label` > `ble_name` > `hostname` > `vendor` |
| status        | text        | `online` \| `offline`                                             |
| missed_reports| integer     | consecutive agent reports this device was absent from             |
| first_seen    | timestamptz | set once, on first insert                                         |
| last_seen     | timestamptz | updated every time the agent reports this device as reachable    |
| is_router     | boolean     | true for the default gateway, used to center the graph            |
| created_at    | timestamptz |                                                                    |
| updated_at    | timestamptz |                                                                    |

Unique index: `(network_id, mac)` when `mac IS NOT NULL`. When no MAC is available (some devices don't expose it over ARP), fall back to `(network_id, ip)` uniqueness — documented as a known limitation, since IPs can be reassigned by DHCP.

## `presence_events` (future — history/alerts)

Append-only log so "history of presence" and "new device" alerts don't require mutating `devices` destructively. Table exists in the schema already; nothing writes to it yet (Phase 5 in [ROADMAP.md](ROADMAP.md)).

| Column      | Type        | Notes                                  |
|-------------|-------------|-------------------------------------------|
| id          | bigint identity PK |                                     |
| device_id   | bigint      | FK → devices.id, `on delete cascade`      |
| event_type  | text        | `first_seen` \| `online` \| `offline`     |
| occurred_at | timestamptz |                                            |

## `settings`

Backs [backend/src/security/secrets.js](../backend/src/security/secrets.js) — the agent API key, JWT signing secret, and admin password hash, auto-generated on first boot when not pinned via env vars, so no manual secret provisioning is required.

| Column     | Type        | Notes                                                  |
|------------|-------------|-----------------------------------------------------------|
| key        | text PK     | e.g. `agent_api_key`, `jwt_secret`, `admin_password_hash` |
| value      | text        |                                                             |
| updated_at | timestamptz |                                                             |

The test suite writes here too, under a `test_`-prefixed key namespace (`SETTINGS_KEY_PREFIX`) so it can never clobber the real values — see [backend/README.md#tests](../backend/README.md#tests).

## Row Level Security

RLS is enabled on every table with **no policies** — by design, since only the backend's service role key (which bypasses RLS entirely) ever queries them. If you later let the frontend or agent talk to Supabase directly, add explicit policies before doing so; don't just disable RLS.

## Online/offline transition logic (backend)

A device is marked `offline` not the instant it stops responding to one scan, but after it's been missing from N consecutive agent reports (default 2), to absorb transient Wi-Fi drops or ARP-cache staleness. This threshold lives in backend config, not in the schema.
