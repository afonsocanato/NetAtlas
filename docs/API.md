# NetAtlas — API & WebSocket Contract

Base URL (dev): `http://localhost:4000/api`

## Auth

- **Agent → Backend**: `X-Api-Key` header, shared secret configured via env var on both sides. MVP only — no user accounts yet.
- **Frontend → Backend**: open on the local network for MVP. Auth (item 4 in roadmap) will add session-based auth before this is exposed beyond localhost/LAN.

## REST Endpoints

### `POST /api/agent/report`
Agent pushes a discovery batch.

Request body:
```json
{
  "network": { "id": "default", "cidr": "192.168.1.0/24" },
  "scanned_at": "2026-09-15T10:00:00Z",
  "devices": [
    {
      "ip": "192.168.1.1",
      "mac": "AA:BB:CC:DD:EE:FF",
      "hostname": "router.local",
      "vendor": "TP-Link",
      "is_router": true
    }
  ]
}
```
Response: `202 Accepted`, `{ "received": 12, "new": 1, "updated": 11 }`

### `GET /api/devices`
Query params: `status`, `vendor`, `device_type`, `q` (search by ip/hostname/mac).
Returns array of device objects (see DATABASE.md `devices` table, camelCased).

### `GET /api/devices/:id`
Single device with full detail.

### `PATCH /api/devices/:id`
Body: `{ "customLabel"?: string, "deviceType"?: string }` — user edits only; discovery fields are read-only from this endpoint.

### `DELETE /api/devices/:id`
Removes a stale/manually-added-in-error device record.

### `GET /api/network/summary`
Returns aggregate stats for the dashboard: `{ total, online, offline, byType: {...}, byVendor: {...} }`.

### `GET /api/health`
Liveness check, `{ "status": "ok" }`.

## WebSocket events (Socket.IO, namespace `/`)

Server → client:
- `device:new` — payload: full device object
- `device:updated` — payload: full device object (covers hostname/IP changes, manual edits)
- `device:online` / `device:offline` — payload: `{ id, status, lastSeen }`
- `scan:complete` — payload: `{ scannedAt, deviceCount }`

Client → server: none required for MVP (frontend is read-mostly; edits go through REST `PATCH`, backend broadcasts the resulting `device:updated`).

## Error format

```json
{ "error": { "code": "DEVICE_NOT_FOUND", "message": "..." } }
```
