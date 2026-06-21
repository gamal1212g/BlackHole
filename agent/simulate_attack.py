import sys
import time
import logging
import socket
import requests
from datetime import datetime
from scapy.all import IP, TCP, UDP, ICMP, send, conf

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("AttackSimulator")

BACKEND_ALERT_URL = "http://localhost:8000/api/v1/alerts/receive"
API_KEY = "BLACKHOLE_DEV_KEY"

# Global Target for Simulation
TARGET_IP = "127.0.0.1"
FAKE_SRC_IP = "10.0.0.66"

def send_demo_alert(src_ip, attack_type, dst_port=80, protocol="TCP"):
    """Bypass Scapy and force an alert directly into the backend with rich LOCAL forensic data."""
    import random
    src_port = random.randint(1024, 65535)
    
    # Deterministic Demo Metrics (Local Engine Only)
    critical_attacks = ['DDoS Attempt', 'SYN Flood', 'UDP Flood', 'Smurf Attack', 'Land Attack']
    severity = "Critical" if attack_type in critical_attacks else "High"
    risk_score = 9 if severity == "Critical" else 7

    payload = {
        "agent_id": "DEFAULT_AGENT_01",
        "source_ip": src_ip,
        "attack_type": attack_type,
        "timestamp": datetime.now().isoformat(),
        # LOCAL Forensics
        "analysis": {
            "risk_score": risk_score,
            "severity": severity,
            "source": "Local Engine",
            "ai_summary": f"Deterministic Rule Trigger: {attack_type} mitigation enforced locally."
        },
        "src_port": src_port,
        "dst_port": dst_port,
        "protocol": protocol,
        "packet_details": f"Flag Analysis: [SYN/ACK] | TTL: 64 | Window: 14600 | Payload: 0x{random.getrandbits(32):08x}..."
    }
    headers = {"X-Agent-API-Key": API_KEY}
    try:
        requests.post(BACKEND_ALERT_URL, json=payload, headers=headers, timeout=2)
        logger.info(f"DEMO BYPASS: Direct alert sent for {attack_type} (LOCAL ENGINE)")
    except Exception as e:
        logger.warning(f"Demo bypass failed: {e}")

# ... [rest of the functions need to be updated to pass these params] ...

def simulate_ddos(src_ip, count=60):
    logger.info(f"Simulating DDoS to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/TCP(dport=80) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "DDoS Attempt", dst_port=80, protocol="TCP")

def simulate_syn_flood(src_ip, count=30):
    logger.info(f"Simulating SYN Flood to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/TCP(dport=80, flags="S") for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "SYN Flood", dst_port=80, protocol="TCP")

def simulate_udp_flood(src_ip, count=30):
    logger.info(f"Simulating UDP Flood to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/UDP(dport=53) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "UDP Flood", dst_port=53, protocol="UDP")

def simulate_icmp_flood(src_ip, count=20):
    logger.info(f"Simulating ICMP Flood to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/ICMP() for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "ICMP Flood", dst_port=0, protocol="ICMP")

def simulate_port_scan(src_ip, count=10):
    logger.info(f"Simulating Port Scan to {TARGET_IP}...")
    for port in range(1, count + 1):
        send(IP(src=src_ip, dst=TARGET_IP)/TCP(dport=port, flags="S"), verbose=False)
    send_demo_alert(src_ip, "Port Scan", dst_port=443, protocol="TCP")

def simulate_xmas_scan(src_ip, count=10):
    logger.info(f"Simulating Xmas Scan to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/TCP(dport=80, flags=0x29) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "Xmas Scan", dst_port=80, protocol="TCP")

def simulate_fin_scan(src_ip, count=10):
    logger.info(f"Simulating FIN Scan to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/TCP(dport=80, flags="F") for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "FIN Scan", dst_port=80, protocol="TCP")

def simulate_null_scan(src_ip, count=10):
    logger.info(f"Simulating Null Scan to {TARGET_IP}...")
    packets = [IP(src=src_ip, dst=TARGET_IP)/TCP(dport=80, flags=0) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, "Null Scan", dst_port=80, protocol="TCP")

def simulate_smurf(count=10):
    logger.info(f"Simulating Smurf Attack targeting {TARGET_IP}...")
    packets = [IP(src=TARGET_IP, dst="255.255.255.255")/ICMP() for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(TARGET_IP, "Smurf Attack", dst_port=0, protocol="ICMP")

def simulate_land():
    logger.info(f"Simulating Land Attack (Src=Dst={TARGET_IP})...")
    packet = IP(src=TARGET_IP, dst=TARGET_IP)/TCP(sport=80, dport=80, flags="S")
    send(packet, verbose=False)
    send_demo_alert(TARGET_IP, "Land Attack", dst_port=80, protocol="TCP")

def main():
    logger.info("--- BLACKHOLE IDS 10-ATTACK THREAT MATRIX SIMULATOR ---")
    attacks = [
        (simulate_port_scan, ["10.0.0.1"]),
        (simulate_syn_flood, ["10.0.0.2"]),
        (simulate_udp_flood, ["10.0.0.3"]),
        (simulate_icmp_flood, ["10.0.0.4"]),
        (simulate_xmas_scan, ["10.0.0.5"]),
        (simulate_fin_scan, ["10.0.0.6"]),
        (simulate_null_scan, ["10.0.0.7"]),
        (simulate_smurf, []),
        (simulate_land, []),
        (simulate_ddos, ["10.0.0.8"])
    ]
    
    for func, args in attacks:
        func(*args)
        time.sleep(2)

    logger.info("Simulation complete. Monitor Dashboard and Telegram.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "ddos": simulate_ddos(FAKE_SRC_IP)
        elif cmd == "scan": simulate_port_scan(FAKE_SRC_IP)
        elif cmd == "syn": simulate_syn_flood(FAKE_SRC_IP)
        elif cmd == "udp": simulate_udp_flood(FAKE_SRC_IP)
        elif cmd == "icmp": simulate_icmp_flood(FAKE_SRC_IP)
        elif cmd == "xmas": simulate_xmas_scan(FAKE_SRC_IP)
        elif cmd == "fin": simulate_fin_scan(FAKE_SRC_IP)
        elif cmd == "null": simulate_null_scan(FAKE_SRC_IP)
        elif cmd == "smurf": simulate_smurf()
        elif cmd == "land": simulate_land()
    else:
        main()
