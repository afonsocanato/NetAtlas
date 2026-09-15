"""Passive-ish BLE (Bluetooth Low Energy) advertisement scanning, via the
`bleak` library. This is the only discovery step that isn't reading OS state
(unlike arp_scan) or a plain ICMP echo (unlike icmp_scan) — it listens for
BLE advertisement packets nearby devices broadcast on their own (much like
how AirDrop/"Nearby devices" pickers work), for a short fixed window each
cycle. Nothing is written to the device; this is receive-only.

The actual scan runs in a subprocess (ble_scan_worker.py) rather than
in-process — see that module's docstring for why: CoreBluetooth can abort
the whole process with an uncatchable SIGABRT in some environments, and that
must never be able to take the main discovery loop down with it.
"""
import json
import logging
import subprocess
import sys
from dataclasses import dataclass
from typing import Optional

from .oui import lookup_vendor

log = logging.getLogger("netatlas-agent.ble")

_warned_once = False


@dataclass
class BleSighting:
    address: str
    name: Optional[str]
    rssi: Optional[int]
    vendor: Optional[str]


def scan_ble(timeout: float = 5.0) -> list[BleSighting]:
    """Best-effort BLE sweep — returns [] (never raises) if BLE isn't usable
    on this machine right now, or if bleak isn't installed."""
    global _warned_once
    try:
        proc = subprocess.run(
            [sys.executable, "-m", "netatlas_agent.discovery.ble_scan_worker", str(timeout)],
            capture_output=True,
            text=True,
            timeout=timeout + 10,
        )
    except Exception as exc:
        if not _warned_once:
            log.warning("Could not launch the BLE scan subprocess (%s) — continuing without BLE", exc)
            _warned_once = True
        return []

    if proc.returncode != 0:
        stderr_tail = (proc.stderr or "").strip().splitlines()[-1:] or ["no output"]
        if "No module named 'bleak'" in (proc.stderr or ""):
            if not _warned_once:
                log.warning("bleak is not installed — skipping BLE scan (pip install bleak to enable it)")
                _warned_once = True
        elif not _warned_once:
            log.warning("BLE scan subprocess exited with code %d (%s) — continuing without it", proc.returncode, stderr_tail[0])
            _warned_once = True
        return []

    try:
        raw = json.loads(proc.stdout)
    except (json.JSONDecodeError, ValueError):
        return []

    if isinstance(raw, dict) and "error" in raw:
        return []

    return [
        BleSighting(address=r["address"], name=r["name"], rssi=r.get("rssi"), vendor=lookup_vendor(r["address"]))
        for r in raw
    ]
