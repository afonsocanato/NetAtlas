"""Thin HTTP client for reporting discovery batches to the NetAtlas backend."""
from datetime import datetime, timezone

import requests

from .config import config
from .models import DiscoveredDevice


def report_devices(network_cidr: str, devices: list[DiscoveredDevice]) -> dict:
    payload = {
        "network": {"id": config.network_id, "cidr": network_cidr},
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "devices": [d.to_payload() for d in devices],
    }
    response = requests.post(
        f"{config.backend_url}/api/agent/report",
        json=payload,
        headers={"X-Api-Key": config.api_key},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
