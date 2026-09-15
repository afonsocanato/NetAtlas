"""Passive ARP table reading, per OS. This never sends packets by itself —
it only reads whatever the OS has already cached from normal traffic
(optionally topped up by icmp_scan's active probe beforehand).
"""
import platform
import re
import subprocess
from typing import Dict


# Octets are 1-2 hex digits: BSD/macOS's `arp -a` does NOT zero-pad them
# (e.g. "8:f9:7e:2a:3:2d"), so a strict {2}-per-octet pattern silently
# drops any real device whose MAC happens to have a leading-zero octet.
MAC_RE = re.compile(r"([0-9A-Fa-f]{1,2}[:-]){5}[0-9A-Fa-f]{1,2}")
IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

BROADCAST_MAC = "FF:FF:FF:FF:FF:FF"


def normalize_mac(mac: str) -> str:
    octets = re.split(r"[:-]", mac)
    return ":".join(o.upper().zfill(2) for o in octets)


def is_multicast_or_broadcast(mac: str) -> bool:
    if mac == BROADCAST_MAC:
        return True
    first_octet = int(mac.split(":")[0], 16)
    # The multicast/group bit is the least-significant bit of the first
    # octet (IEEE 802) — matches mDNS (01:00:5E:...), IPv6 multicast
    # (33:33:...), etc. None of these are a real, addressable device.
    return bool(first_octet & 0x01)


def read_arp_table() -> Dict[str, str]:
    """Returns {ip: mac} for every real-device entry the OS currently has
    cached — broadcast/multicast entries are filtered out, they're not
    devices."""
    system = platform.system()
    entries: Dict[str, str] = {}

    try:
        if system == "Windows":
            output = subprocess.check_output(["arp", "-a"], text=True, errors="ignore")
        elif system == "Darwin":
            output = subprocess.check_output(["arp", "-a"], text=True, errors="ignore")
        else:  # Linux
            try:
                output = subprocess.check_output(["ip", "neigh"], text=True, errors="ignore")
            except FileNotFoundError:
                output = subprocess.check_output(["arp", "-a"], text=True, errors="ignore")
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        return entries

    for line in output.splitlines():
        ip_match = IP_RE.search(line)
        mac_match = MAC_RE.search(line)
        if ip_match and mac_match:
            if "incomplete" in line.lower() or "failed" in line.lower():
                continue
            mac = normalize_mac(mac_match.group(0))
            if is_multicast_or_broadcast(mac):
                continue
            entries[ip_match.group(0)] = mac

    return entries
