"""Regenerates netatlas_agent/oui_data/full_oui.json from IEEE's official
MA-L (24-bit OUI) assignment registry — the same table vendor lookups
(oui.py) and hence device names/BLE matching ultimately depend on.

The bundled file is a point-in-time snapshot; IEEE adds new assignments
continuously, so re-run this occasionally (there's no automatic refresh —
querying it at runtime would mean every discovery cycle depends on an
external service being up).

Usage:
    cd agent && python3 scripts/update_oui.py
"""
import csv
import json
import re
import urllib.request
from pathlib import Path

SOURCE_URL = "https://standards-oui.ieee.org/oui/oui.csv"
OUT_PATH = Path(__file__).resolve().parent.parent / "netatlas_agent" / "oui_data" / "full_oui.json"


def main() -> None:
    print(f"Downloading {SOURCE_URL} ...")
    with urllib.request.urlopen(SOURCE_URL, timeout=60) as resp:
        text = resp.read().decode("utf-8")

    table: dict[str, str] = {}
    for row in csv.DictReader(text.splitlines()):
        assignment = (row.get("Assignment") or "").strip().upper()
        org = (row.get("Organization Name") or "").strip()
        if not org or not re.fullmatch(r"[0-9A-F]{6}", assignment):
            continue
        prefix = f"{assignment[0:2]}:{assignment[2:4]}:{assignment[4:6]}"
        table[prefix] = org

    result = {
        "_comment": (
            "Full IEEE MA-L OUI assignment table "
            f"({SOURCE_URL}), converted to prefix->org JSON. "
            "Regenerate with agent/scripts/update_oui.py."
        ),
        **dict(sorted(table.items())),
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Wrote {len(table)} entries to {OUT_PATH}")


if __name__ == "__main__":
    main()
