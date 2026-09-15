"""Passive ARP table reading, per OS. This never sends packets by itself —
it only reads whatever the OS has already cached from normal traffic
(optionally topped up by icmp_scan's active probe beforehand).
"""
import platform
import re
import subprocess
from typing import Dict


MAC_RE = re.compile(r"([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}")
IP_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def normalize_mac(mac: str) -> str:
    return mac.upper().replace("-", ":")


def read_arp_table() -> Dict[str, str]:
    """Returns {ip: mac} for every entry the OS currently has cached."""
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
            entries[ip_match.group(0)] = normalize_mac(mac_match.group(0))

    return entries
