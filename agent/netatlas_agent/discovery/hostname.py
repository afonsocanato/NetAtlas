"""Best-effort hostname resolution. Expect this to fail for a large fraction
of devices (see docs/LIMITATIONS.md) — home routers rarely run local DNS,
and mDNS only works for hosts that announce themselves.
"""
import socket


def resolve_hostname(ip: str, timeout_s: float = 0.5) -> str | None:
    socket.setdefaulttimeout(timeout_s)
    try:
        name, _, _ = socket.gethostbyaddr(ip)
        return name.rstrip(".")
    except (socket.herror, socket.gaierror, socket.timeout, OSError):
        return None
    finally:
        socket.setdefaulttimeout(None)
