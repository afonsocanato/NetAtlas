"""NetAtlas discovery agent entrypoint.

Runs one discovery cycle every NETATLAS_SCAN_INTERVAL seconds:
  1. detect local subnet + default gateway
  2. (optional) ping sweep to warm the ARP cache
  3. read the OS ARP table (ip -> mac)
  4. resolve hostname + vendor per host
  5. POST the batch to the backend

See docs/LIMITATIONS.md for why this can never be a complete/instant picture
of the network.
"""
import logging
import time

from .config import config
from .discovery.network import get_local_ip, guess_subnet_cidr, get_default_gateway
from .discovery.arp_scan import read_arp_table
from .discovery.icmp_scan import ping_sweep
from .discovery.hostname import resolve_hostname
from .discovery.oui import lookup_vendor
from .discovery.classify import guess_device_type
from .models import DiscoveredDevice
from .client import report_devices

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("netatlas-agent")


def run_discovery_cycle() -> None:
    local_ip = get_local_ip()
    subnet_cidr = guess_subnet_cidr(local_ip)
    gateway_ip = get_default_gateway()

    if config.active_probe:
        log.info("Active probe enabled — pinging %s to warm the ARP cache", subnet_cidr)
        ping_sweep(subnet_cidr)

    arp_table = read_arp_table()
    log.info("ARP table has %d entries", len(arp_table))

    devices: list[DiscoveredDevice] = []
    for ip, mac in arp_table.items():
        hostname = resolve_hostname(ip) if config.resolve_hostnames else None
        vendor = lookup_vendor(mac)
        is_router = ip == gateway_ip
        devices.append(
            DiscoveredDevice(
                ip=ip,
                mac=mac,
                hostname=hostname,
                vendor=vendor,
                is_router=is_router,
                device_type="router" if is_router else guess_device_type(hostname, vendor),
            )
        )

    if not devices:
        log.warning("No devices discovered this cycle — check ARP permissions/firewall")
        return

    try:
        result = report_devices(subnet_cidr, devices)
        log.info("Reported %d devices (new=%s, updated=%s)", result["received"], result["new"], result["updated"])
    except Exception as exc:  # network errors, backend down, etc.
        log.error("Failed to report to backend: %s", exc)


def main() -> None:
    log.info("NetAtlas agent starting — backend=%s interval=%ss", config.backend_url, config.scan_interval_seconds)
    while True:
        run_discovery_cycle()
        time.sleep(config.scan_interval_seconds)


if __name__ == "__main__":
    main()
