"""Best-effort device-type guess from hostname/vendor keywords. This is a
heuristic, not identification — same caveat as OUI vendor lookup (see
docs/LIMITATIONS.md): a hostname like "iPhone-de-Ana" is a strong signal, a
bare "ESP_3AF221" from a generic Espressif chip is weaker but still useful.
Users can always override the result by hand from the dashboard.
"""
import re

# Ordered: more specific patterns first, since a hostname/vendor can match
# more than one bucket (e.g. "AppleTV" contains "tv" but should win as tv,
# not computer, even though vendor is Apple).
_HOSTNAME_RULES = [
    ("tv", ["appletv", "apple-tv", r"\btv\b", "roku", "chromecast", "firetv", "fire-tv", "androidtv", "bravia", "webos"]),
    ("phone", ["iphone", "ipad", "android", "galaxy-s", "galaxy-note", "pixel-", r"\bphone\b", "smartphone", "tablet"]),
    (
        "computer",
        [
            "macbook",
            "imac",
            "mac-mini",
            "macmini",
            r"^mac$",
            r"^mac-",
            r"^mac\d",
            "mbp",
            "mba",
            r"\bpc\b",
            "desktop",
            "laptop",
            "workstation",
            "thinkpad",
        ],
    ),
    (
        "iot",
        [
            "echo",
            "alexa",
            "google-home",
            "nest",
            "smartplug",
            "smart-plug",
            "sonoff",
            "shelly",
            "tasmota",
            "esp_",
            "esp-",
            "camera",
            "cam-",
            "doorbell",
            "sensor",
            "thermostat",
            "hue-",
            "philips-hue",
            # Common auto-generated printer/peripheral hostnames — not a
            # perfect fit for "iot" but closer than leaving them unknown.
            r"^hp[a-z0-9]{4,}$",
            "printer",
            r"^epson",
            r"^brother",
        ],
    ),
]

_VENDOR_RULES = [
    (
        "iot",
        [
            "espressif",
            "sonoff",
            "shelly",
            "raspberry pi",
            "amazon technologies",
            "google, inc",
            "nest labs",
            "ring llc",
            "hewlett packard",
            "hp inc",
            "canon",
            "epson",
            "brother industries",
        ],
    ),
    ("tv", ["roku", "vizio", "sony visual", "samsung electronics"]),  # only checked if hostname gave no match
]


def _matches_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text) for p in patterns)


def guess_device_type(hostname: str | None, vendor: str | None) -> str:
    lower_hostname = (hostname or "").lower()

    if lower_hostname:
        for device_type, patterns in _HOSTNAME_RULES:
            if _matches_any(lower_hostname, patterns):
                return device_type

    lower_vendor = (vendor or "").lower()
    if lower_vendor:
        for device_type, patterns in _VENDOR_RULES:
            if _matches_any(lower_vendor, patterns):
                return device_type
        if "apple" in lower_vendor:
            # Apple's OUI covers phones, laptops and more with no reliable
            # way to tell apart from the MAC/vendor alone — leave it to the
            # hostname rules above, or unknown for the user to label by hand.
            return "unknown"

    return "unknown"
