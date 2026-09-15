# NetAtlas Discovery Agent

Local, cross-platform (Windows/Linux/macOS) Python agent that discovers devices on your own LAN via passive ARP (optionally topped up by a rate-limited ping sweep) and reports them to the NetAtlas backend.

**Only run this against networks you own or administer.**

## Setup

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate  # .venv\Scripts\activate on Windows
pip3 install -r requirements.txt   # just "pip" on Windows

export NETATLAS_BACKEND_URL=http://localhost:4000
export NETATLAS_API_KEY=<copy from the dashboard's Settings panel, or the backend's server log>
python3 -m netatlas_agent.main   # just "python" on Windows
```

The backend auto-generates this key on first boot if `AGENT_API_KEY` isn't set on its side — no need to invent one and keep both `.env` files in sync by hand. See [../backend/README.md#login](../backend/README.md#login).

## Configuration (env vars)

| Var                         | Default                         | Purpose                                             |
|------------------------------|----------------------------------|-------------------------------------------------------|
| `NETATLAS_BACKEND_URL`       | `http://localhost:4000`          | Backend base URL                                       |
| `NETATLAS_API_KEY`           | —                                 | Must match backend's `AGENT_API_KEY`                    |
| `NETATLAS_NETWORK_ID`        | `default`                        | Network identifier (multi-network, future)              |
| `NETATLAS_SCAN_INTERVAL`     | `60`                              | Seconds between discovery cycles                        |
| `NETATLAS_ACTIVE_PROBE`      | `false`                          | Enable the opt-in ping sweep to warm the ARP cache       |
| `NETATLAS_RESOLVE_HOSTNAMES` | `true`                           | Reverse-DNS lookups per host (slower, best-effort)       |
| `NETATLAS_BLE_SCAN`          | `true`                           | Scan nearby BLE advertisements to fill in device names   |
| `NETATLAS_BLE_SCAN_SECONDS`  | `5`                               | How long each BLE scan window lasts, per cycle           |

## Notes

- Passive-only mode (`NETATLAS_ACTIVE_PROBE=false`) never sends any packet — it only reads the OS's existing ARP cache. It may miss idle devices; enable active probe for a fuller picture at the cost of a light ping sweep.
- Vendor lookups use `oui_data/full_oui.json`, a full snapshot of IEEE's MA-L OUI registry (~40k entries) — `oui_data/sample_oui.json` is only a tiny fallback for if that file is ever missing. Re-run `python3 scripts/update_oui.py` occasionally to refresh it (IEEE adds assignments continuously; there's no automatic/runtime refresh, this is a point-in-time snapshot).
- BLE scanning needs a Bluetooth adapter and OS permission for whatever runs the agent:
  - **macOS**: the first scan triggers a system Bluetooth permission prompt — it needs an interactive GUI session to show up (a headless/SSH/launchd-before-login context won't see it, and the scan silently no-ops instead). If it was denied, re-grant it in System Settings → Privacy & Security → Bluetooth.
  - **Linux**: the user running the agent typically needs to be in the `bluetooth` group (or run as root).
  - Whenever the adapter/permission isn't available, or `bleak` isn't installed, BLE scanning just contributes nothing that cycle — set `NETATLAS_BLE_SCAN=false` to turn it off outright. See [discovery/ble_match.py](netatlas_agent/discovery/ble_match.py) for why a BLE name is only ever a best-effort, heuristically-matched guess, never a certain identification.
- See [../docs/LIMITATIONS.md](../docs/LIMITATIONS.md) for what this agent can and can't see, and why.
