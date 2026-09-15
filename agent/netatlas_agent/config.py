"""Agent configuration, loaded from environment variables (with sane defaults)."""
import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    backend_url: str = os.environ.get("NETATLAS_BACKEND_URL", "http://localhost:4000")
    api_key: str = os.environ.get("NETATLAS_API_KEY", "change-me-to-a-random-secret")
    network_id: str = os.environ.get("NETATLAS_NETWORK_ID", "default")
    scan_interval_seconds: int = int(os.environ.get("NETATLAS_SCAN_INTERVAL", "60"))
    active_probe: bool = os.environ.get("NETATLAS_ACTIVE_PROBE", "false").lower() == "true"
    resolve_hostnames: bool = os.environ.get("NETATLAS_RESOLVE_HOSTNAMES", "true").lower() == "true"
    ble_scan: bool = os.environ.get("NETATLAS_BLE_SCAN", "true").lower() == "true"
    ble_scan_seconds: float = float(os.environ.get("NETATLAS_BLE_SCAN_SECONDS", "5"))


config = Config()
