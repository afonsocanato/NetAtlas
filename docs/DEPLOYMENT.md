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

## Walkthrough: home Mac + Cloudflare Tunnel

Since your domain's DNS is already on Cloudflare, this is the easiest path — **no port forwarding, no dynamic DNS, works even behind CGNAT**, because the tunnel makes an outbound-only connection from your Mac to Cloudflare's edge; nothing needs to be reachable from the internet on your router. Cloudflare's edge also terminates HTTPS for you. Ready-made config lives in [deploy/](../deploy/) (`caddy` and `cloudflared` binaries downloaded directly, gitignored, no Homebrew/sudo needed).

1. **Authenticate cloudflared with your Cloudflare account**:
   ```bash
   ./deploy/cloudflared tunnel login
   ```
   Opens a browser — log in and pick the `yourdomain.com` zone to authorize. This saves a cert to `~/.cloudflared/cert.pem`.
2. **Create the tunnel**:
   ```bash
   ./deploy/cloudflared tunnel create netatlas
   ```
   Prints a tunnel ID and writes credentials to `~/.cloudflared/<tunnel-id>.json` — note both.
3. **Route the hostname to it** (creates the DNS CNAME in Cloudflare automatically):
   ```bash
   ./deploy/cloudflared tunnel route dns netatlas netatlas.yourdomain.com
   ```
4. **Fill in the config**: copy the template so your real IDs stay out of git:
   ```bash
   cp deploy/cloudflared-config.yml deploy/cloudflared-config.local.yml
   ```
   Edit `deploy/cloudflared-config.local.yml`, replacing `tunnel:` and `credentials-file:` with the values from step 2.
5. **Point the app at the real domain**:
   - `backend/.env`: set `CORS_ORIGIN=https://netatlas.yourdomain.com`
   - `frontend/.env`: set `VITE_API_URL=https://netatlas.yourdomain.com`, then `cd frontend && npm run build` (rebuild required — Vite bakes this in at build time)
6. **Run all three processes**, from the repo root:
   ```bash
   cd backend && npm run dev &                                                    # backend on :4000
   cd .. && ./deploy/caddy run --config deploy/Caddyfile --adapter caddyfile &     # local router on :8080
   ./deploy/cloudflared tunnel --config deploy/cloudflared-config.local.yml run    # public edge -> :8080
   ```
   Caddy here only routes locally (`/api`, `/socket.io`, static frontend) on plain HTTP — no certificate needed on your end, Cloudflare's edge already handles TLS for the public hostname.
7. **Visit `https://netatlas.yourdomain.com`** — log in, then update the agent's `NETATLAS_BACKEND_URL` to that same URL (step 4 in the [main Quickstart](../README.md#quickstart)).

Keep the Mac awake (System Settings → Battery/Energy → prevent sleep) and all three processes alive for this to stay reachable. To run unattended across reboots, wrap each in a `launchd` plist (`~/Library/LaunchAgents/`) — same pattern regardless of which process.

**Don't have Cloudflare DNS, or prefer classic port-forwarding instead?** See steps 1–4 further up this doc (DNS `A` record + your own reverse proxy with Let's Encrypt) instead of this section.

## Keeping it running: launchd (macOS)

Processes started by hand in a terminal die when the terminal closes, the Mac sleeps oddly, or any of them crash — and nothing brings them back. `launchd` fixes that: it starts all four processes (backend, Caddy, the tunnel, and the agent) on login and auto-restarts any one of them if it exits, without you noticing.

Templates are in [deploy/](../deploy/) (`com.netatlas.backend.plist`, `.caddy.plist`, `.cloudflared.plist`, `.agent.plist`) — gitignored since they embed your machine's absolute paths and the agent one embeds `AGENT_API_KEY`. Copy them into place and load once:

```bash
cp deploy/com.netatlas.*.plist ~/Library/LaunchAgents/
for label in backend caddy cloudflared agent; do
  launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.netatlas.$label.plist
done
```

Useful commands afterward:

```bash
launchctl list | grep netatlas          # PID + last exit status per service
launchctl kickstart -k gui/$(id -u)/com.netatlas.caddy   # force-restart one
launchctl bootout gui/$(id -u)/com.netatlas.caddy        # stop + unload one
```

Logs go to the same `/tmp/*.log` files as the manual commands used throughout this doc. If you change a plist (e.g. a new `AGENT_API_KEY` after rotating it), `bootout` then `bootstrap` it again to pick up the change.

## Security notes

- Never set `NETATLAS_DISABLE_AUTH=true` on anything internet-reachable.
- Rotate the admin password and agent API key if you ever suspect either leaked (`ADMIN_PASSWORD` env var + restart; `AGENT_API_KEY` env var + restart + update the agent's config).
- NetAtlas itself only discovers hosts on the LAN the agent runs on — see [LIMITATIONS.md](LIMITATIONS.md) for what that does and doesn't expose, and keep that in mind before deciding this is worth exposing publicly versus reaching it over a VPN (e.g. Tailscale/WireGuard) instead, which avoids opening any port at all.
