import os
import sys
import time
import json
import logging
import threading
import queue
import requests
from datetime import datetime
from collections import defaultdict, deque

AGENT_ID = "DEFAULT_AGENT_01"
LOG_FILE = "agent.log"
BACKEND_URL = "http://localhost:8000/api/v1/alerts/receive"
BLOCKLIST_ADD_URL = "http://localhost:8000/api/v1/blocklist/add"
CONFIG_URL = "http://localhost:8000/api/v1/config"
API_KEY = "BLACKHOLE_DEV_KEY"
DDOS_THRESHOLD = 50
DDOS_WINDOW = 2
PORT_SCAN_THRESHOLD = 5
PORT_SCAN_WINDOW = 5
BLOCKLIST = []

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s', handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
except ImportError:
    logger.error("Scapy is not installed. Please install it using 'pip install scapy'.")
    sys.exit(1)

class IDSDetector:
    def __init__(self):
        self.ddos_history = defaultdict(lambda: deque())
        self.syn_flood_history = defaultdict(lambda: deque())
        self.udp_flood_history = defaultdict(lambda: deque())
        self.icmp_history = defaultdict(lambda: deque())
        self.xmas_history = defaultdict(lambda: deque())
        self.fin_history = defaultdict(lambda: deque())
        self.null_history = defaultdict(lambda: deque())
        self.smurf_history = defaultdict(lambda: deque())
        self.land_history = defaultdict(lambda: deque())
        self.port_scan_history = defaultdict(lambda: defaultdict(float))
        self.alert_cooldowns = defaultdict(lambda: defaultdict(float))
        self.cooldown_period = 10
        self.lock = threading.Lock()
        self.ddos_threshold = 50
        self.ddos_window = 2
        self.syn_flood_threshold = 10
        self.udp_flood_threshold = 15
        self.icmp_flood_threshold = 5
        self.xmas_threshold = 3
        self.fin_threshold = 3
        self.null_threshold = 3
        self.smurf_threshold = 3
        self.land_threshold = 1
        self.port_scan_threshold = 5
        self.port_scan_window = 5
        self.window = 5
        self.blocklist = BLOCKLIST

    def detect_land_attack(self, packet):
        if packet.haslayer(IP) and packet.haslayer(TCP):
            if packet[IP].src == packet[IP].dst and packet[TCP].sport == packet[TCP].dport:
                return "Land Attack"
        return None

    def detect_stealth_scans(self, packet):
        now = time.time()
        if packet.haslayer(IP) and packet.haslayer(TCP):
            src_ip = packet[IP].src
            if packet[TCP].flags == 0x29:
                self.xmas_history[src_ip].append(now)
                if len(self.xmas_history[src_ip]) > self.xmas_threshold:
                    return "Xmas Scan"
            elif packet[TCP].flags == 0:
                self.null_history[src_ip].append(now)
                if len(self.null_history[src_ip]) > self.null_threshold:
                    return "Null Scan"
            elif packet[TCP].flags == "F":
                self.fin_history[src_ip].append(now)
                if len(self.fin_history[src_ip]) > self.fin_threshold:
                    return "FIN Scan"
        return None

    def detect_icmp_udp_flood(self, packet):
        now = time.time()
        if packet.haslayer(IP):
            src_ip = packet[IP].src
            if packet.haslayer(ICMP):
                self.icmp_history[src_ip].append(now)
                if len(self.icmp_history[src_ip]) > self.icmp_flood_threshold:
                    return "ICMP Flood"
            elif packet.haslayer(UDP):
                self.udp_flood_history[src_ip].append(now)
                if len(self.udp_flood_history[src_ip]) > self.udp_flood_threshold:
                    return "UDP Flood"
        return None

    def analyze_packet(self, packet):
        if packet.haslayer(IP):
            src_ip = packet[IP].src
            blocked_ips_list = self.blocklist
            if src_ip in blocked_ips_list:
                return
        src_ip = None
        dst_ip = None
        if packet.haslayer(IP):
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
        elif packet.haslayer("IPv6"):
            src_ip = packet["IPv6"].src
            dst_ip = packet["IPv6"].dst
        if not src_ip or not dst_ip:
            return
        src_ip = src_ip.strip()
        dst_ip = dst_ip.strip()
        loopback_ips = {"127.0.0.1", "::1"}
        if src_ip in loopback_ips and dst_ip in loopback_ips:
            return
        infra_ports = {8000, 5173, 27017}
        packet_ports = set()
        if packet.haslayer(TCP):
            packet_ports.add(packet[TCP].sport)
            packet_ports.add(packet[TCP].dport)
        elif packet.haslayer(UDP):
            packet_ports.add(packet[UDP].sport)
            packet_ports.add(packet[UDP].dport)
        if any(port in infra_ports for port in packet_ports):
            return
        now = time.time()
        with self.lock:
            alert_triggered = False
            attack_label = None
            attack_label = self.detect_land_attack(packet)
            if attack_label:
                alert_triggered = True
            if not alert_triggered:
                attack_label = self.detect_stealth_scans(packet)
                if attack_label:
                    alert_triggered = True
            if not alert_triggered and packet.haslayer(ICMP):
                if packet[ICMP].type == 8:
                    self.smurf_history[src_ip].append(now)
                    if len(self.smurf_history[src_ip]) > self.smurf_threshold:
                        attack_label = "Smurf Attack"
                        alert_triggered = True
            if not alert_triggered:
                attack_label = self.detect_icmp_udp_flood(packet)
                if attack_label:
                    alert_triggered = True
            if not alert_triggered and (packet.haslayer(TCP) or packet.haslayer(UDP)):
                if not packet.haslayer(TCP) or packet[TCP].flags == "S":
                    dst_port = packet.dport
                    self.port_scan_history[src_ip][dst_port] = now
                    expired = [p for p, t in self.port_scan_history[src_ip].items() if t < now - self.window]
                    for p in expired:
                        del self.port_scan_history[src_ip][p]
                    if len(self.port_scan_history[src_ip]) > self.port_scan_threshold:
                        attack_label = "Port Scan"
                        alert_triggered = True
            if not alert_triggered and packet.haslayer(TCP) and packet[TCP].flags == "S":
                self.syn_flood_history[src_ip].append(now)
                if len(self.syn_flood_history[src_ip]) > self.syn_flood_threshold:
                    attack_label = "SYN Flood"
                    alert_triggered = True
            if not alert_triggered:
                self.ddos_history[src_ip].append(now)
                if len(self.ddos_history[src_ip]) > self.ddos_threshold:
                    attack_label = "DDoS Attempt"
                    alert_triggered = True
            if alert_triggered and attack_label:
                for history in [self.xmas_history, self.null_history, self.fin_history, self.smurf_history, self.icmp_history, self.udp_flood_history, self.syn_flood_history, self.ddos_history]:
                    while history[src_ip] and history[src_ip][0] < now - self.window:
                        history[src_ip].popleft()
                if now - self.alert_cooldowns[src_ip][attack_label] > self.cooldown_period:
                    self.alert_cooldowns[src_ip][attack_label] = now
                    self.generate_alert(src_ip, attack_label)
                    if attack_label == "Xmas Scan":
                        self.xmas_history[src_ip].clear()
                    elif attack_label == "Null Scan":
                        self.null_history[src_ip].clear()
                    elif attack_label == "FIN Scan":
                        self.fin_history[src_ip].clear()
                    elif attack_label == "Smurf Attack":
                        self.smurf_history[src_ip].clear()
                    elif attack_label == "ICMP Flood":
                        self.icmp_history[src_ip].clear()
                    elif attack_label == "UDP Flood":
                        self.udp_flood_history[src_ip].clear()
                    elif attack_label == "Port Scan":
                        self.port_scan_history[src_ip].clear()
                    elif attack_label == "SYN Flood":
                        self.syn_flood_history[src_ip].clear()
                    elif attack_label == "DDoS Attempt":
                        self.ddos_history[src_ip].clear()

    def update_config(self, config):
        with self.lock:
            self.ddos_threshold = config.get("ddos_threshold", self.ddos_threshold)
            self.ddos_window = config.get("ddos_window", self.ddos_window)
            self.port_scan_threshold = config.get("port_scan_threshold", self.port_scan_threshold)
            self.port_scan_window = config.get("port_scan_window", self.port_scan_window)
            self.blocklist = config.get("blocklist", self.blocklist)
            logger.info("Configuration updated from backend.")

    def generate_alert(self, src_ip, attack_type):
        alert = {"agent_id": AGENT_ID, "source_ip": src_ip, "attack_type": attack_type, "timestamp": datetime.now().isoformat()}
        logger.warning(f"ALERT: {json.dumps(alert)}")
        with self.lock:
            if src_ip not in self.blocklist:
                self.blocklist.append(src_ip)
                logger.info(f"IPS: IP {src_ip} blocked")
        headers = {"X-Agent-API-Key": API_KEY}
        try:
            requests.post(BACKEND_URL, json=alert, headers=headers, timeout=5)
            block_payload = {"ip": src_ip, "reason": attack_type}
            requests.post("http://localhost:8000/api/v1/alerts/blocked", json=block_payload, timeout=5)
            logger.info(f"Synced {src_ip} to backend")
        except Exception as e:
            logger.error(f"Error syncing mitigation to backend: {e}")

def packet_callback(packet, packet_queue):
    packet_queue.put(packet)

def worker_thread(packet_queue, detector):
    logger.info("Worker started.")
    while True:
        try:
            packet = packet_queue.get(timeout=1)
            if packet is None:
                break
            detector.analyze_packet(packet)
            packet_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            logger.error(f"Worker error: {e}")

def config_poller_thread(detector):
    logger.info("Config poller started.")
    while True:
        try:
            headers = {"X-Agent-API-Key": API_KEY}
            response = requests.get(CONFIG_URL, headers=headers, timeout=5)
            if response.status_code == 200:
                config = response.json()
                detector.update_config(config)
            else:
                logger.error(f"Failed to fetch config. Status: {response.status_code}")
        except Exception as e:
            logger.error(f"Error polling config: {e}")
        time.sleep(10)

def check_privileges():
    try:
        if os.name == 'nt':
            import ctypes
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        else:
            return os.getuid() == 0
    except AttributeError:
        return False

def main():
    if not check_privileges():
        logger.error("This script requires root/administrative privileges to sniff network traffic.")
        sys.exit(1)
    logger.info(f"Starting BLACKHOLE IDS Agent: {AGENT_ID}")
    packet_queue = queue.Queue()
    detector = IDSDetector()
    worker = threading.Thread(target=worker_thread, args=(packet_queue, detector), daemon=True)
    worker.start()
    poller = threading.Thread(target=config_poller_thread, args=(detector,), daemon=True)
    poller.start()
    logger.info("Sniffing started... Press Ctrl+C to stop.")
    try:
        from scapy.all import conf, get_if_list
        sniff_thread = threading.Thread(target=lambda: sniff(iface=None, prn=lambda p: packet_callback(p, packet_queue), store=0), daemon=True)
        sniff_thread.start()
        while True:
            time.sleep(1)
    except PermissionError as e:
        logger.error(f"Permission error during sniffing: {e}. Ensure you have the right drivers (e.g., Npcap) and privileges.")
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        packet_queue.put(None)
        logger.info("Agent stopped.")

if __name__ == "__main__":
    main()
