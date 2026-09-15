-- NetAtlas — Supabase (Postgres) schema.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (everything is IF NOT EXISTS / ON CONFLICT DO NOTHING).

create table if not exists networks (
  id text primary key,
  name text not null,
  cidr text,
  -- Public IP last seen reporting into this network (from the agent's own
  -- request), so the dashboard can auto-detect "which network is this
  -- visitor's browser on" by matching their public IP against these —
  -- see src/utils/clientIp.js and src/models/networksModel.js.
  public_ip text,
  last_report_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_networks_public_ip on networks (public_ip);

insert into networks (id, name, cidr)
values ('default', 'Home', null)
on conflict (id) do nothing;

create table if not exists devices (
  id bigint generated always as identity primary key,
  network_id text not null default 'default' references networks(id),
  mac text,
  ip text,
  hostname text,
  vendor text,
  -- Best-effort name from a nearby BLE advertisement, heuristically matched
  -- to this device by the agent (see agent/netatlas_agent/discovery/
  -- ble_match.py) — often absent. Displayed ahead of `hostname` when
  -- present; never a certain identification.
  ble_name text,
  device_type text not null default 'unknown',
  custom_label text,
  status text not null default 'online',
  is_router boolean not null default false,
  missed_reports integer not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Added after initial release — safe to re-run on an existing table.
alter table devices add column if not exists ble_name text;

create unique index if not exists idx_devices_network_mac
  on devices (network_id, mac) where mac is not null;

create unique index if not exists idx_devices_network_ip_no_mac
  on devices (network_id, ip) where mac is null;

create index if not exists idx_devices_network_status
  on devices (network_id, status);

create table if not exists presence_events (
  id bigint generated always as identity primary key,
  device_id bigint not null references devices(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_presence_events_device
  on presence_events (device_id, occurred_at);

-- Auto-generated secrets (agent API key, JWT signing secret, admin password
-- hash) live here — see backend/src/security/secrets.js.
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- RLS is enabled with NO policies on purpose: only the backend, using the
-- service_role key (which bypasses RLS entirely), ever touches these
-- tables. Never expose the anon/public key to these tables without adding
-- policies first — the frontend and agent only ever talk to NetAtlas's own
-- backend, never to Supabase directly.
alter table networks enable row level security;
alter table devices enable row level security;
alter table presence_events enable row level security;
alter table settings enable row level security;
