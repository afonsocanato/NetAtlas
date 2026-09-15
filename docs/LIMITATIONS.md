# NetAtlas — Technical Limitations & Risks

## Browser limitations (why discovery can't live in the frontend)

Browsers deliberately have no access to raw sockets, ARP tables, or ICMP — this is why NetAtlas needs a native local agent instead of doing discovery from JavaScript in the browser. The frontend can only ever talk to the backend over HTTP/WebSocket.

## Network discovery limitations

- **Ping (ICMP) is not reliable for inventory.** Many devices (phones, IoT) silently drop ICMP echo requests while still being fully reachable on other protocols, and some routers rate-limit or block ICMP entirely. NetAtlas treats ICMP as one weak signal, not the source of truth.
- **ARP is LAN-scoped and cache-based.** `arp -a` only shows hosts the OS has recently talked to — a device that's been idle can be missing from the table even though it's online. An active ARP probe (broadcasting who-has requests) repopulates it but is a mild active technique, so it's opt-in and rate-limited, never a flood.
- **ARP only works on the local segment.** Devices behind a different VLAN/subnet, or behind Wi-Fi client isolation (common on guest networks and many mesh systems), won't appear via ARP even though they're technically "on the network."
- **Hostname resolution is best-effort.** Reverse DNS often fails on home routers with no local DNS server; mDNS (`.local` names) only works for devices announcing themselves (mostly Apple/Bonjour, some Linux/IoT with Avahi). Many devices will simply show no hostname — the UI must handle this gracefully (show IP/vendor instead).
- **MAC address may be hidden.** Modern iOS/Android use MAC randomization for network scans/certain states, so the MAC (and therefore vendor lookup) can be inconsistent across sessions for phones — expect occasional duplicate entries for the same physical phone until it settles on a stable address for that network.
- **OUI → vendor lookup is a prefix table, not identification of the device model.** It tells you "Apple," "Samsung," "Espressif (generic IoT chip)," not "iPhone 15." Device type is therefore a heuristic (vendor + hostname pattern), always user-correctable via `customLabel`/`deviceType`.

## Cross-platform (Windows/Linux/macOS) limitations

- ARP table location/format differs: Windows `arp -a`, Linux `/proc/net/arp` or `ip neigh`, macOS `arp -a` (BSD format). The agent's `discovery` module abstracts this per-OS.
- Raw socket / active ARP probing may require elevated privileges (admin on Windows, root or capabilities on Linux, admin on macOS) — the agent should degrade gracefully to passive-only discovery when it lacks privileges, rather than fail outright.
- Local firewalls (Windows Defender Firewall, macOS pf, Linux iptables/ufw) can block outgoing probes even with the right privileges — this is a per-environment risk to document in the agent README, not something the app can fully control.

## Scope / ethics boundaries (by design)

- NetAtlas only discovers hosts, never scans for open ports/services in the MVP, and any future "common service detection" (roadmap item) will be limited to a small, safe, opt-in allowlist (e.g. checking if port 80/443/22 is open) — never vulnerability scanning or exploitation.
- The agent should only ever be pointed at subnets the user owns/administers. This is a documented usage policy, not something technically enforceable — same as any inventory/monitoring tool.

## Data freshness

- The dashboard reflects the last completed agent scan, not truly live network state — there's an inherent lag equal to the scan interval (default suggestion: 30–60s).
