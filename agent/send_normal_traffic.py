import socket
import time
from scapy.all import IP, ICMP, send

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    return local_ip

def send_normal_packets():
    target_ip = get_local_ip()
    print(f'[*] Starting normal, clean traffic simulation to {target_ip}...')
    print('[*] These packets are completely safe and should NOT trigger any alerts.')
    for i in range(1, 6):
        packet = IP(dst=target_ip) / ICMP()
        send(packet, verbose=False)
        print(f'  [+] Normal Packet #{i} sent successfully.')
        time.sleep(2)
    print('[*] Finished sending normal traffic.')
if __name__ == '__main__':
    send_normal_packets()