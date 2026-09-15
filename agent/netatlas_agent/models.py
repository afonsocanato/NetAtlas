"""Plain data structures shared across the agent's discovery modules."""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class DiscoveredDevice:
    ip: str
    mac: Optional[str] = None
    hostname: Optional[str] = None
    vendor: Optional[str] = None
    is_router: bool = False
    # Heuristic guess only (hostname/vendor keywords) — the backend uses it
    # just to seed a brand-new device, never to overwrite a type the user
    # already set by hand. See discovery/classify.py.
    device_type: Optional[str] = None
    # Name from a nearby BLE advertisement, heuristically matched to this
    # device by discovery/ble_match.py — best-effort, often absent. See that
    # module's docstring for why this can't be a certain match.
    ble_name: Optional[str] = None

    def to_payload(self) -> dict:
        return {
            "ip": self.ip,
            "mac": self.mac,
            "hostname": self.hostname,
            "vendor": self.vendor,
            "is_router": self.is_router,
            "device_type": self.device_type,
            "ble_name": self.ble_name,
        }
