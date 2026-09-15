# NetAtlas — API & WebSocket Contract

Base URL (dev): `http://localhost:4000/api`

## Auth

- **Agent → Backend**: `X-Api-Key` header, a shared secret independent of user login (see `/api/agent/report` below). Auto-generated on first boot if `AGENT_API_KEY` isn't set — view it via `GET /api/admin/agent-key` (requires login) or the server log.
- **Frontend/user → Backend**: `Authorization: Bearer <token>` header, a JWT obtained from `POST /api/auth/login`. Required by default; can be turned off for a fully trusted LAN-only setup with `NETATLAS_DISABLE_AUTH=true` (never on a publicly reachable deploy — see [DEPLOYMENT.md](DEPLOYMENT.md)). Socket.IO connections authenticate the same token via the handshake's `auth.token`.

### `POST /api/auth/login`
Body: `{ "username": string, "password": string }`. Response: `{ "token": string, "username": string }`.

### `GET /api/auth/me`
Requires a valid token. Response: `{ "username": string }`.

### `GET /api/admin/agent-key`
Requires a valid token. Response: `{ "agentApiKey": string }` — lets a logged-in user copy the current agent key into the agent's config without touching either side's `.env` by hand.

## REST Endpoints

All endpoints below except `/api/agent/*` and `/api/health` require the `Authorization: Bearer <token>` header described above.

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
      "is_router": true,
      "device_type": "router",
      "ble_name": null
    }
  ]
}
```
Response: `202 Accepted`, `{ "received": 12, "new": 1, "updated": 11 }`

### `GET /api/devices`
Query params: `status`, `vendor`, `deviceType`, `q` (search by ip/hostname/mac), `networkId` (override the auto-detected network — see [ARCHITECTURE.md#multi-network-model](ARCHITECTURE.md#multi-network-model)).
Returns array of device objects (see DATABASE.md `devices` table, camelCased).

### `GET /api/devices/:id`
Single device with full detail.

### `PATCH /api/devices/:id`
Body: `{ "customLabel"?: string, "deviceType"?: string }` — user edits only; discovery fields are read-only from this endpoint.

### `DELETE /api/devices/:id`
Removes a stale/manually-added-in-error device record.

### `GET /api/network/summary`
Query params: `networkId` (same override as above).
Returns aggregate stats for the dashboard: `{ total, online, offline, byType: {...}, byVendor: {...} }`.

### `GET /api/networks`
Returns every network that has ever reported: `[{ id, name, lastReportAt }]` — backs the dashboard's network switcher.

### `GET /api/health`
Liveness check, `{ "status": "ok" }`.

## WebSocket events (Socket.IO, namespace `/`)

Connect with `auth: { token, networkId? }` — same JWT as REST, plus an optional `networkId` to pin the room to a specific network (same override as the REST endpoints above); omit it to fall back to the IP-based auto-detect. Events are scoped per-network (a Socket.IO room per `network_id`), so a client only ever receives updates for the network it's joined.

Server → client:
- `device:new` — payload: full device object
- `device:updated` — payload: full device object (covers hostname/IP changes, manual edits, and the offline→online transition)
- `device:offline` — payload: `{ id, status, lastSeen }`
- `scan:complete` — payload: `{ scannedAt, deviceCount }`

Client → server: none required for MVP (frontend is read-mostly; edits go through REST `PATCH`, backend broadcasts the resulting `device:updated`).

## Error format

```json
{ "error": { "code": "DEVICE_NOT_FOUND", "message": "..." } }
```
