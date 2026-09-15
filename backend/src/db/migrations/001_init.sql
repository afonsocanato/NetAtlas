CREATE TABLE IF NOT EXISTS networks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cidr TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO networks (id, name, cidr) VALUES ('default', 'Home', NULL);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id TEXT NOT NULL DEFAULT 'default' REFERENCES networks(id),
  mac TEXT,
  ip TEXT,
  hostname TEXT,
  vendor TEXT,
  device_type TEXT NOT NULL DEFAULT 'unknown',
  custom_label TEXT,
  status TEXT NOT NULL DEFAULT 'online',
  is_router INTEGER NOT NULL DEFAULT 0,
  missed_reports INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_network_mac
  ON devices(network_id, mac) WHERE mac IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_network_ip_no_mac
  ON devices(network_id, ip) WHERE mac IS NULL;

CREATE INDEX IF NOT EXISTS idx_devices_network_status
  ON devices(network_id, status);

CREATE TABLE IF NOT EXISTS presence_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_presence_events_device
  ON presence_events(device_id, occurred_at);
