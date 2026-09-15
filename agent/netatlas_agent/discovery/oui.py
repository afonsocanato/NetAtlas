"""MAC OUI -> vendor lookup, entirely local (no external API calls). Prefers
the full IEEE MA-L table (oui_data/full_oui.json — see scripts/update_oui.py
to regenerate it) when present, falling back to the tiny bundled
oui_data/sample_oui.json otherwise so lookups still work out of the box.
"""
import json
from functools import lru_cache
from pathlib import Path

_OUI_DATA_DIR = Path(__file__).resolve().parent.parent / "oui_data"
_FULL_TABLE_PATH = _OUI_DATA_DIR / "full_oui.json"
_SAMPLE_TABLE_PATH = _OUI_DATA_DIR / "sample_oui.json"


@lru_cache(maxsize=1)
def _load_table() -> dict[str, str]:
    path = _FULL_TABLE_PATH if _FULL_TABLE_PATH.exists() else _SAMPLE_TABLE_PATH
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data.pop("_comment", None)
    return {k.upper(): v for k, v in data.items()}


def lookup_vendor(mac: str | None) -> str | None:
    if not mac:
        return None
    prefix = mac.upper()[:8]  # "AA:BB:CC"
    return _load_table().get(prefix)
