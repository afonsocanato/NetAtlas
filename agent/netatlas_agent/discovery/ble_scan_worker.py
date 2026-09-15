"""Standalone entrypoint that runs the actual BLE scan and prints the result
as JSON on stdout — run as a subprocess by ble_scan.scan_ble(), never
imported/called in-process.

Why a subprocess: CoreBluetooth (macOS's BLE stack, via pyobjc) can abort the
whole process with SIGABRT — not a catchable Python exception — when it's
unhappy about how it's being invoked (e.g. no Info.plist usage-description
in a plain venv script). That's a fatal crash instead of a degrade, which
would take the entire agent down with it, not just BLE discovery. Running
the scan in its own subprocess means a SIGABRT there just makes
scan_ble() see a bad exit code — the main agent process, and ARP/ICMP
discovery, never even notices.
"""
import asyncio
import json
import sys


async def _discover(timeout: float) -> list[dict]:
    from bleak import BleakScanner

    sightings = []
    try:
        discovered = await BleakScanner.discover(timeout=timeout, return_adv=True)
    except TypeError:
        devices = await BleakScanner.discover(timeout=timeout)
        discovered = {d.address: (d, None) for d in devices}

    for address, entry in discovered.items():
        device, adv = entry if isinstance(entry, tuple) else (entry, None)
        name = (adv.local_name if adv and adv.local_name else None) or device.name
        rssi = getattr(adv, "rssi", None) if adv else getattr(device, "rssi", None)
        if not name:
            continue
        sightings.append({"address": address, "name": name, "rssi": rssi})

    return sightings


def main() -> None:
    timeout = float(sys.argv[1]) if len(sys.argv) > 1 else 5.0
    try:
        result = asyncio.run(_discover(timeout))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
