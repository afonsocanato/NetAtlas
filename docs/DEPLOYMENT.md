# NetAtlas — Deploying on your own domain

By default NetAtlas runs on `localhost` for you alone. This guide covers putting it behind a real domain (e.g. `netatlas.yourdomain.com`) with HTTPS, so you can open the dashboard from your phone or a laptop away from home — while keeping the discovery agent doing what it always did, running on your LAN.

**The architecture doesn't change.** The backend and frontend still run wherever you already host them (a home server, a Raspberry Pi, a small VPS); the only new piece is a reverse proxy that terminates HTTPS on your domain and forwards to them. The agent still needs LAN access to read ARP tables, so it still runs on a machine inside your network — it just points its `NETATLAS_BACKEND_URL` at your public domain instead of `localhost`.

```
Browser (anywhere) ──HTTPS──▶  Reverse proxy (your domain)  ──▶  frontend (static build)
                                        │
                                        └────────────────────▶  backend :4000
                                                                     ▲
                                                          Agent (on your LAN) ──HTTPS──┘
```

## 1. Turn auth on (it's on by default)

Exposing the dashboard to the internet means it needs a real login — this is on by default, so there's nothing to do here as long as you have **not** set `NETATLAS_DISABLE_AUTH=true`. See [backend/README.md#login](../backend/README.md#login) for how the admin login and agent key are generated on first boot. Pin your own via `ADMIN_USERNAME`/`ADMIN_PASSWORD` in the backend's `.env` before you expose it, rather than relying on the auto-generated one.

## 2. Point DNS at your server

Create an `A`/`AAAA` record for your subdomain (e.g. `netatlas.yourdomain.com`) pointing at the public IP of whatever host runs the backend/frontend. If that host is behind your home router (not a VPS), you'll also need to forward ports 80 and 443 to it, and ideally a dynamic-DNS service if your home IP isn't static.

## 3. Reverse proxy with automatic HTTPS

[Caddy](https://caddyserver.com) is the simplest option — it gets a Let's Encrypt certificate automatically, no manual renewal. A minimal `Caddyfile`:

```
netatlas.yourdomain.com {
	handle /api/* {
		reverse_proxy localhost:4000
	}
	handle /socket.io/* {
		reverse_proxy localhost:4000
	}
	handle {
		reverse_proxy localhost:5173
	}
}
```

Routing everything under one domain (rather than separate frontend/backend subdomains) means the frontend can talk to `/api` and the socket on the **same origin**, sidestepping CORS entirely. With this setup:

- `backend/.env`: `CORS_ORIGIN=https://netatlas.yourdomain.com`
- `frontend/.env`: `VITE_API_URL=https://netatlas.yourdomain.com` (rebuild the frontend after changing this — see [frontend/README.md](../frontend/README.md))

Prefer nginx or Traefik? The same three routes (`/api/*`, `/socket.io/*`, everything else) apply — Caddy is just the least config for a single-domain personal deploy.

## 4. Point the agent at your domain

From the machine on your LAN running the agent:

```bash
export NETATLAS_BACKEND_URL=https://netatlas.yourdomain.com
export NETATLAS_API_KEY=<copy from the dashboard's Settings panel, or the server log on first boot>
python3 -m netatlas_agent.main
```

The agent only ever makes outbound HTTPS requests to that URL — it doesn't need any inbound port opened on the LAN side.

## 5. Docker Compose variant

[docker-compose.yml](../docker-compose.yml) still works the same way for local/LAN use. For a public deploy, put Caddy (or your proxy of choice) in front of the `frontend`/`backend` service ports instead of publishing them directly, and set `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`CORS_ORIGIN` via the compose file's `environment:` block rather than relying on the auto-generated first-boot credentials.

## Security notes

- Never set `NETATLAS_DISABLE_AUTH=true` on anything internet-reachable.
- Rotate the admin password and agent API key if you ever suspect either leaked (`ADMIN_PASSWORD` env var + restart; `AGENT_API_KEY` env var + restart + update the agent's config).
- NetAtlas itself only discovers hosts on the LAN the agent runs on — see [LIMITATIONS.md](LIMITATIONS.md) for what that does and doesn't expose, and keep that in mind before deciding this is worth exposing publicly versus reaching it over a VPN (e.g. Tailscale/WireGuard) instead, which avoids opening any port at all.
