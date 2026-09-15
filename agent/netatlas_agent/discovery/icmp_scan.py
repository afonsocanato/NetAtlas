"""Optional, opt-in active discovery: a light ping sweep across the subnet to
populate the OS ARP cache for hosts that haven't talked recently. This is a
mild, rate-limited technique (one ping per host, small timeout) — never a
flood, never anything beyond ICMP echo. Disabled by default
(NETATLAS_ACTIVE_PROBE=false); ARP-only passive discovery still works without
it, just with more blind spots for idle hosts (see docs/LIMITATIONS.md).
"""
import ipaddress
import platform
import subprocess
from concurrent.futures import ThreadPoolExecutor


def _ping_once(ip: str, timeout_s: float = 0.5) -> bool:
    system = platform.system()
    if system == "Windows":
        cmd = ["ping", "-n", "1", "-w", str(int(timeout_s * 1000)), ip]
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(1, int(timeout_s))), ip]

    try:
        result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=timeout_s + 1)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return False


def ping_sweep(cidr: str, max_workers: int = 32) -> None:
    """Fires a single ping at every host in the subnet, purely to warm the ARP
    cache. Results are intentionally discarded — the caller re-reads the ARP
    table afterward, which is the actual source of truth."""
    network = ipaddress.ip_network(cidr, strict=False)
    hosts = list(network.hosts())
    if len(hosts) > 1024:
        hosts = hosts[:1024]  # sanity cap for unexpectedly large subnets

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        list(pool.map(lambda h: _ping_once(str(h)), hosts))
