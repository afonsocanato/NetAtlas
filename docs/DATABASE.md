# NetAtlas — Database Model (SQLite, MVP)

SQLite is used for the MVP because the whole system is meant to run on a single home machine with a handful to a few hundred devices — no need for a client/server DB yet. The schema is written so a future migration to Postgres (multi-network, multi-user) only needs new tables, not a redesign.

## `networks`

Represents a scanned LAN. MVP ships with a single implicit `default` network; the column exists from day one so multi-network support (future) is additive.

| Column       | Type     | Notes                              |
|--------------|----------|-------------------------------------|
| id           | TEXT PK  | e.g. `"default"`, or a UUID          |
| name         | TEXT     | user-friendly label, e.g. "Home"    |
| cidr         | TEXT     | e.g. `192.168.1.0/24`               |
| created_at   | DATETIME |                                      |

## `devices`

| Column        | Type      | Notes                                                         |
|---------------|-----------|-----------------------------------------------------------------|
| id            | INTEGER PK AUTOINCREMENT |                                                |
| network_id    | TEXT      | FK → networks.id                                                |
| mac           | TEXT      | normalized uppercase, unique per network when known             |
| ip            | TEXT      | last known IP (can change on DHCP renewal)                      |
| hostname      | TEXT NULL | best-effort, from reverse DNS / mDNS / NetBIOS                  |
| vendor        | TEXT NULL | resolved from MAC OUI prefix                                    |
| device_type   | TEXT      | `router` \| `computer` \| `phone` \| `tv` \| `iot` \| `unknown` — heuristic, user-editable |
| custom_label  | TEXT NULL | user-defined display name, overrides hostname in UI             |
| status        | TEXT      | `online` \| `offline`                                            |
| first_seen    | DATETIME  | set once, on first insert                                        |
| last_seen     | DATETIME  | updated every time the agent reports this device as reachable   |
| is_router     | BOOLEAN   | true for the default gateway, used to center the graph           |
| created_at    | DATETIME  |                                                                   |
| updated_at    | DATETIME  |                                                                   |

Unique constraint: `(network_id, mac)` when `mac IS NOT NULL`. When no MAC is available (some devices don't expose it over ARP), fall back to `(network_id, ip)` uniqueness — documented as a known limitation, since IPs can be reassigned by DHCP.

## `presence_events` (future — history/alerts)

Append-only log so "history of presence" and "new device" alerts don't require mutating `devices` destructively.

| Column      | Type     | Notes                                  |
|-------------|----------|------------------------------------------|
| id          | INTEGER PK AUTOINCREMENT |                            |
| device_id   | INTEGER  | FK → devices.id                          |
| event_type  | TEXT     | `first_seen` \| `online` \| `offline`    |
| occurred_at | DATETIME |                                           |

## `agents` (future — multiple agents/networks, auth)

| Column       | Type     | Notes                                   |
|--------------|----------|-------------------------------------------|
| id           | TEXT PK  | UUID                                       |
| network_id   | TEXT     | FK → networks.id                           |
| api_key_hash | TEXT     | hashed shared secret                       |
| last_report_at | DATETIME |                                          |

## Indexes

- `devices(network_id, status)` — fast "who's online" queries.
- `devices(network_id, mac)` and `devices(network_id, ip)` — upsert lookups.
- `presence_events(device_id, occurred_at)`.

## Online/offline transition logic (backend)

A device is marked `offline` not the instant it stops responding to one scan, but after it's been missing from N consecutive agent reports (default 2), to absorb transient Wi-Fi drops or ARP-cache staleness. This threshold lives in backend config, not in the schema.
