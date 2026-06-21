import os
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

async def analyze_alert_hybrid(alert_payload: dict) -> dict:
    """
    STRICT LOCAL ANALYST ENGINE (AI BYPASS FOR DEMO)
    This function has been hardcoded to use deterministic local rules 
    to ensure 100% reliability and local operation for the presentation.
    """
    attack_type = alert_payload.get("attack_type", "Unknown")
    
    # Deterministic Severity Mapping
    # DDoS and High-Volume attacks are Critical (9)
    # Scans and Anomaly detections are High (7)
    # Basic triggers are Medium (5)
    
    decision = {
        "source": "Local Engine",
        "action": "BLOCK_IP"
    }
    
    critical_attacks = ['DDoS Attempt', 'SYN Flood', 'UDP Flood', 'Smurf Attack', 'Land Attack']
    high_attacks = ['Port Scan', 'Xmas Scan', 'Null Scan', 'FIN Scan', 'ICMP Flood']
    
    if attack_type in critical_attacks:
        decision["risk_score"] = 9
        decision["severity"] = "Critical"
        decision["ai_summary"] = f"Local IDS Rule: High-volume {attack_type} detected. Initiating immediate protocol mitigation."
    elif attack_type in high_attacks:
        decision["risk_score"] = 7
        decision["severity"] = "High"
        decision["ai_summary"] = f"Local IDS Rule: Structural anomaly ({attack_type}) identified. Source IP added to active blocklist."
    else:
        decision["risk_score"] = 5
        decision["severity"] = "Medium"
        decision["ai_summary"] = f"Local IDS Rule: Anomalous activity ({attack_type}) flagged for review."
        
    return decision
