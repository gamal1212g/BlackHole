import psutil
import time
import os
import sys

# Import the IDS detector from our agent
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from agent.agent import IDSDetector
from scapy.all import sniff

def get_process_stats():
    proc = psutil.Process(os.getpid())
    cpu = proc.cpu_percent(interval=None)
    mem = proc.memory_info().rss / (1024 * 1024)
    return cpu, mem

def main():
    print("==========================================")
    print(" BLACKHOLE AGENT PERFORMANCE BENCHMARK")
    print("==========================================")
    
    detector = IDSDetector()
    
    # Initialize CPU percent measurement
    psutil.Process(os.getpid()).cpu_percent(interval=None)
    
    print("[*] Waiting for incoming packets (trigger hping3 attack now)...")
    print("[*] Press Ctrl+C to stop and view final report.\n")
    
    packet_count = 0
    total_latency_ms = 0.0
    
    def benchmark_callback(packet):
        nonlocal packet_count, total_latency_ms
        
        # Capture precise start time
        start_time = time.perf_counter()
        
        # Analyze packet (this includes the alert payload generation internally)
        detector.analyze_packet(packet)
        
        # Capture precise end time
        end_time = time.perf_counter()
        
        latency_ms = (end_time - start_time) * 1000
        total_latency_ms += latency_ms
        packet_count += 1
        
        # Print stats every 50 packets to avoid console I/O bottleneck affecting latency
        if packet_count % 50 == 0:
            cpu, mem = get_process_stats()
            avg_latency = total_latency_ms / packet_count
            print(f"[{packet_count} Packets] CPU: {cpu:.1f}% | RAM: {mem:.2f} MB | Avg Latency: {avg_latency:.4f} ms/packet")
            
    try:
        sniff(prn=benchmark_callback, store=0)
    except KeyboardInterrupt:
        print("\n==========================================")
        print(" BENCHMARK COMPLETE (Chapter 6 Data)")
        print("==========================================")
        if packet_count > 0:
            cpu, mem = get_process_stats()
            print(f"Total Packets Processed : {packet_count}")
            print(f"Final CPU Consumption   : {cpu:.1f} %")
            print(f"Final Memory Footprint  : {mem:.2f} MB")
            print(f"Overall Average Latency : {(total_latency_ms / packet_count):.4f} ms")
        else:
            print("No packets captured.")

if __name__ == "__main__":
    main()
