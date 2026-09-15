"""Best-effort correlation between BLE advertisements and WiFi/ARP-discovered
devices.

There is no reliable way to prove a BLE sighting and a WiFi device are the
same physical device from passive scanning alone: BLE and WiFi radios almost
always advertise *different* MAC addresses for the same device, and modern
iOS/Android rotate the BLE address periodically on top of that (see
docs/LIMITATIONS.md). What we *can* use as a weak signal is:

  - both sides resolve to the same OUI vendor (e.g. both "Apple"), and
  - the BLE sighting is strong/close (RSSI above a threshold — the agent
    runs on a machine inside the same home, so a strong signal means "in the
    house", not "next door"), and
  - it's the *only* candidate on both sides for that vendor this cycle — if
    two Apple devices are on the WiFi and only one Apple BLE name was seen,
    there's no way to tell which one it belongs to, so nothing is assigned
    rather than guessing.

This deliberately trades recall for precision: most cycles will match
nothing, but what it does match should rarely be wrong.
"""
from collections import defaultdict

from .ble_scan import BleSighting
from ..models import DiscoveredDevice

DEFAULT_RSSI_THRESHOLD = -70


def match_ble_names(
    devices: list[DiscoveredDevice],
    sightings: list[BleSighting],
    rssi_threshold: int = DEFAULT_RSSI_THRESHOLD,
) -> None:
    """Mutates `devices` in place, filling in `.ble_name` wherever a
    confident 1:1 vendor match is found."""
    if not devices or not sightings:
        return

    candidates_by_vendor: dict[str, list[BleSighting]] = defaultdict(list)
    for s in sightings:
        if not s.vendor or not s.name:
            continue
        if s.rssi is not None and s.rssi < rssi_threshold:
            continue
        candidates_by_vendor[s.vendor].append(s)

    devices_by_vendor: dict[str, list[DiscoveredDevice]] = defaultdict(list)
    for d in devices:
        if d.is_router or not d.vendor:
            continue
        devices_by_vendor[d.vendor].append(d)

    for vendor, wifi_devices in devices_by_vendor.items():
        ble_candidates = candidates_by_vendor.get(vendor)
        if not ble_candidates or len(wifi_devices) != 1 or len(ble_candidates) != 1:
            continue  # ambiguous (or nothing seen) for this vendor — skip it
        wifi_devices[0].ble_name = ble_candidates[0].name
