# NetAtlas Backend

Node.js/Express API + SQLite storage + Socket.IO real-time layer. See [../docs/API.md](../docs/API.md) for the full contract and [../docs/DATABASE.md](../docs/DATABASE.md) for the schema.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Server starts on `http://localhost:4000` (configurable via `.env`). SQLite file and migrations run automatically on boot.

## Tests

```bash
npm test
```

Runs on Node's built-in test runner (`node --test`), against an isolated in-memory SQLite database — no setup needed. Covers device upserts, custom-field updates, and the online/offline reconciliation logic in [src/services/deviceService.js](src/services/deviceService.js).

## Demo data

No agent running yet? Populate the database with a plausible fake home network:

```bash
npm run seed
```

Wipes and reseeds `devices`/`presence_events` with ~10 mock devices (router, laptop, phones, TV, IoT, one offline) so the frontend graph has something to show immediately.
