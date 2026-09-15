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

    def to_payload(self) -> dict:
        return {
            "ip": self.ip,
            "mac": self.mac,
            "hostname": self.hostname,
            "vendor": self.vendor,
            "is_router": self.is_router,
        }
