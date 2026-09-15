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

A second, weaker tier handles the single most common real-world case: phones
and watches (exactly the devices you'd most want a BLE name for) routinely
use a randomized "locally administered" WiFi MAC per network on iOS/Android,
which has no OUI vendor at all — so the vendor-bucket match above can never
apply to them. When nothing at all matched by vendor, and there's exactly
one still-unnamed WiFi device with a locally-administered MAC and exactly
one strong BLE sighting left over network-wide, match those two — same
"only one candidate, nothing to guess between" logic, just without a vendor
check to narrow the pool down first, so it's only attempted when that pool
is already down to one on each side.
"""
from collections import defaultdict

from .ble_scan import BleSighting
from ..models import DiscoveredDevice

DEFAULT_RSSI_THRESHOLD = -70


def _is_locally_administered(mac: str) -> bool:
    # IEEE 802: the 2nd-least-significant bit of the first octet marks a
    # locally administered (i.e. not globally OUI-assigned) address — set on
    # every randomized MAC iOS/Android generates per-network.
    try:
        first_octet = int(mac.split(":")[0], 16)
    except (ValueError, IndexError):
        return False
    return bool(first_octet & 0x02)


def match_ble_names(
    devices: list[DiscoveredDevice],
    sightings: list[BleSighting],
    rssi_threshold: int = DEFAULT_RSSI_THRESHOLD,
) -> None:
    """Mutates `devices` in place, filling in `.ble_name` wherever a
    confident match is found (vendor-bucketed first, then the
    locally-administered-MAC fallback — see module docstring)."""
    if not devices or not sightings:
        return

    strong_sightings = [
        s for s in sightings if s.name and (s.rssi is None or s.rssi >= rssi_threshold)
    ]

    candidates_by_vendor: dict[str, list[BleSighting]] = defaultdict(list)
    for s in strong_sightings:
        if s.vendor:
            candidates_by_vendor[s.vendor].append(s)

    devices_by_vendor: dict[str, list[DiscoveredDevice]] = defaultdict(list)
    unresolved_random_mac_devices: list[DiscoveredDevice] = []
    for d in devices:
        if d.is_router or not d.mac:
            continue
        if d.vendor:
            devices_by_vendor[d.vendor].append(d)
        elif _is_locally_administered(d.mac):
            unresolved_random_mac_devices.append(d)

    matched_sightings: set[str] = set()
    for vendor, wifi_devices in devices_by_vendor.items():
        ble_candidates = candidates_by_vendor.get(vendor)
        if not ble_candidates or len(wifi_devices) != 1 or len(ble_candidates) != 1:
            continue  # ambiguous (or nothing seen) for this vendor — skip it
        wifi_devices[0].ble_name = ble_candidates[0].name
        matched_sightings.add(ble_candidates[0].address)

    leftover_sightings = [s for s in strong_sightings if s.address not in matched_sightings]
    if len(unresolved_random_mac_devices) == 1 and len(leftover_sightings) == 1:
        unresolved_random_mac_devices[0].ble_name = leftover_sightings[0].name
