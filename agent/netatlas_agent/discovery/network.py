"""Local subnet / default gateway detection, without any external dependency.

Strategy: open a UDP "connection" to a public IP (no packet is actually sent
for UDP until you write to the socket) purely to ask the OS which local
interface/IP it would use for outbound traffic. This works offline too, since
UDP sockets don't require a reachable peer to be created.
"""
import ipaddress
import socket
import subprocess
import platform


def get_local_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()


def guess_subnet_cidr(local_ip: str, prefix_length: int = 24) -> str:
    """Assumes a /24 unless told otherwise — correct for the vast majority of
    home networks. Explicit CIDR can be set via NETATLAS_SUBNET_OVERRIDE later."""
    network = ipaddress.ip_network(f"{local_ip}/{prefix_length}", strict=False)
    return str(network)


def get_default_gateway() -> str | None:
    system = platform.system()
    try:
        if system == "Windows":
            output = subprocess.check_output(["ipconfig"], text=True, errors="ignore")
            for line in output.splitlines():
                if "Default Gateway" in line and ":" in line:
                    value = line.split(":", 1)[1].strip()
                    if value:
                        return value
        elif system == "Darwin":
            output = subprocess.check_output(["route", "-n", "get", "default"], text=True, errors="ignore")
            for line in output.splitlines():
                if "gateway:" in line:
                    return line.split(":", 1)[1].strip()
        else:  # Linux
            output = subprocess.check_output(["ip", "route", "show", "default"], text=True, errors="ignore")
            parts = output.split()
            if "via" in parts:
                return parts[parts.index("via") + 1]
    except (subprocess.CalledProcessError, FileNotFoundError, IndexError, OSError):
        return None
    return None
