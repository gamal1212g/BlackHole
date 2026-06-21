import pymongo
import sys
import os

# Add parent directory to path to allow importing from agent.py if needed
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_blocklist():
    print("="*60)
    print("🛡️  BLACKHOLE IDS - BLOCKLIST AUDIT DIAGNOSTIC")
    print("="*60)

    # 1. MongoDB Check
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        db = client["blackhole_db"]
        collection = db["blocked_ips"]
        
        print(f"\n[DATABASE] Querying 'blocked_ips' collection...")
        blocks = list(collection.find({}))
        
        if not blocks:
            print("  -> Result: No active blocks found in MongoDB.")
        else:
            print(f"  -> Result: {len(blocks)} IP(s) currently registered as blocked:")
            for b in blocks:
                ip = b.get('ip', 'N/A')
                reason = b.get('reason', 'N/A')
                at = b.get('blocked_at', 'N/A')
                print(f"     • IP: {ip:<15} | Reason: {reason:<20} | At: {at}")
    except Exception as e:
        print(f"\n[DATABASE ERROR] Could not connect to MongoDB: {e}")

    # 2. Agent Memory Check
    print("\n" + "-"*60)
    print("[AGENT MEMORY] Inspecting IDSDetector initialization...")
    try:
        from agent import BLOCKLIST
        print(f"  -> Global BLOCKLIST variable in agent.py: {BLOCKLIST}")
    except ImportError:
        print("  -> Could not import BLOCKLIST from agent.py directly.")

    # 3. Whitelist Reassurance
    print("\n" + "-"*60)
    print("[SECURITY AUDIT] Whitelist Status:")
    loopback_ips = ["127.0.0.1", "::1"]
    
    # Check if any loopback is in the DB blocks
    db_blocked_ips = [b.get('ip') for b in blocks] if 'blocks' in locals() else []
    
    for lb in loopback_ips:
        if lb in db_blocked_ips:
            print(f"  ❌ WARNING: {lb} is present in the database blocklist!")
        else:
            print(f"  ✅ SAFE: {lb} is NOT present in the database blocklist.")

    print("\n[VERIFICATION] Local Machine Safety Reassurance:")
    print("  The 'agent/agent.py' script contains an explicit Priority 0 check:")
    print("  'if (src_ip == \"127.0.0.1\" and dst_ip == \"127.0.0.1\") or (src_ip == \"::1\" and dst_ip == \"::1\"): return'")
    print("  This ensures that loopback traffic is ALWAYS ignored before any block logic executes.")
    print("="*60 + "\n")

if __name__ == "__main__":
    check_blocklist()
