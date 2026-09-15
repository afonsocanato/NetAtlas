# NetAtlas Backend

Node.js/Express API + SQLite storage + Socket.IO real-time layer. See [../docs/API.md](../docs/API.md) for the full contract and [../docs/DATABASE.md](../docs/DATABASE.md) for the schema.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Server starts on `http://localhost:4000` (configurable via `.env`). SQLite file and migrations run automatically on boot.
