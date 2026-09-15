# NetAtlas Discovery Agent

Local, cross-platform (Windows/Linux/macOS) Python agent that discovers devices on your own LAN via passive ARP (optionally topped up by a rate-limited ping sweep) and reports them to the NetAtlas backend.

**Only run this against networks you own or administer.**

## Setup

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate  # .venv\Scripts\activate on Windows
pip install -r requirements.txt

export NETATLAS_BACKEND_URL=http://localhost:4000
export NETATLAS_API_KEY=change-me-to-a-random-secret   # must match backend's AGENT_API_KEY
python -m netatlas_agent.main
```

## Configuration (env vars)

| Var                         | Default                         | Purpose                                             |
|------------------------------|----------------------------------|-------------------------------------------------------|
| `NETATLAS_BACKEND_URL`       | `http://localhost:4000`          | Backend base URL                                       |
| `NETATLAS_API_KEY`           | —                                 | Must match backend's `AGENT_API_KEY`                    |
| `NETATLAS_NETWORK_ID`        | `default`                        | Network identifier (multi-network, future)              |
| `NETATLAS_SCAN_INTERVAL`     | `60`                              | Seconds between discovery cycles                        |
| `NETATLAS_ACTIVE_PROBE`      | `false`                          | Enable the opt-in ping sweep to warm the ARP cache       |
| `NETATLAS_RESOLVE_HOSTNAMES` | `true`                           | Reverse-DNS lookups per host (slower, best-effort)       |

## Notes

- Passive-only mode (`NETATLAS_ACTIVE_PROBE=false`) never sends any packet — it only reads the OS's existing ARP cache. It may miss idle devices; enable active probe for a fuller picture at the cost of a light ping sweep.
- The bundled `oui_data/sample_oui.json` is a tiny example table. For real vendor coverage, download the full IEEE OUI list (link in that file) and drop it in the same location/format.
- See [../docs/LIMITATIONS.md](../docs/LIMITATIONS.md) for what this agent can and can't see, and why.
