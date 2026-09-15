"""MAC OUI -> vendor lookup, entirely local (no external API calls). Ships
with a small sample table; swap oui_data/sample_oui.json for the full IEEE
OUI list for real coverage (see the file's _comment for the source URL).
"""
import json
from functools import lru_cache
from pathlib import Path

OUI_DATA_PATH = Path(__file__).resolve().parent.parent / "oui_data" / "sample_oui.json"


@lru_cache(maxsize=1)
def _load_table() -> dict[str, str]:
    if not OUI_DATA_PATH.exists():
        return {}
    with open(OUI_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    data.pop("_comment", None)
    return {k.upper(): v for k, v in data.items()}


def lookup_vendor(mac: str | None) -> str | None:
    if not mac:
        return None
    prefix = mac.upper()[:8]  # "AA:BB:CC"
    return _load_table().get(prefix)
