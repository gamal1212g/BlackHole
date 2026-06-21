from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
import motor.motor_asyncio
from ..database import get_database
from ..websocket_manager import manager
from ..models import AlertCreate
from ..auth import verify_agent_api_key
from datetime import datetime
import logging

# Configure logging for the routes
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# block ip schema
class BlockedIPSchema(BaseModel):
    ip: str
    reason: str = "Malicious activity detected by BLACKHOLE"

import asyncio

from fastapi.encoders import jsonable_encoder
from ..services.analytics_service import analyze_alert_hybrid

import requests

class TelegramTestSchema(BaseModel):
    botToken: str
    chatId: str
    message: str = "🛡️ *BlackHole IPS Alert:* Telegram integration verified successfully!"

class TelegramSettingsSchema(BaseModel):
    botToken: str
    chatId: str
    enabled: bool

@router.post("/settings/telegram")
async def save_telegram_settings(payload: TelegramSettingsSchema, db = Depends(get_database)):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection not ready")
            
        await db["system_config"].update_one(
            {"type": "telegram_settings"},
            {"$set": {
                "botToken": payload.botToken,
                "chatId": payload.chatId,
                "enabled": payload.enabled,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        return {"status": "success", "message": "Telegram settings saved globally."}
    except Exception as e:
        logger.error(f"Failed to save Telegram settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal DB error")

@router.get("/settings/telegram")
async def get_telegram_settings(db = Depends(get_database)):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection not ready")
            
        tg_config = await db["system_config"].find_one({"type": "telegram_settings"})
        if tg_config:
            return {
                "botToken": tg_config.get("botToken", ""),
                "chatId": tg_config.get("chatId", ""),
                "enabled": tg_config.get("enabled", False)
            }
        return {"botToken": "", "chatId": "", "enabled": False}
    except Exception as e:
        logger.error(f"Failed to fetch Telegram settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal DB error")

@router.post("/settings/test-telegram")
async def test_telegram(payload: TelegramTestSchema):
    try:
        url = f"https://api.telegram.org/bot{payload.botToken}/sendMessage"
        data = {
            "chat_id": payload.chatId,
            "text": payload.message,
            "parse_mode": "Markdown"
        }
        # Run synchronous requests call in a non-blocking way using asyncio.to_thread
        response = await asyncio.to_thread(requests.post, url, json=data, timeout=5)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
            
        return {"status": "success", "message": "Notification sent successfully"}
    except Exception as e:
        logger.error(f"Telegram Test Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# receive alerts from agents
@router.post("/alerts/receive")
async def receive_alert(alert: AlertCreate, db = Depends(get_database), agent = Depends(verify_agent_api_key)):
    try:
        if db is None:
            print("CRITICAL AGENT POST ERROR: Database connection not ready")
            return {"status": "success", "message": "Accepted (Fallback: DB not ready)"}
            
        # prep data
        alert_data = alert.dict()
        alert_data["received_at"] = datetime.utcnow()
        
        # hybrid analytics
        analysis = await analyze_alert_hybrid(alert_data)
        alert_data["analysis"] = analysis
        
        # save to db
        result = await db["alerts"].insert_one(alert_data)
        
        # websocket broadcast
        if "_id" in alert_data:
            alert_data["_id"] = str(alert_data["_id"])
            
        broadcast_data = jsonable_encoder(alert_data)
            
        async def do_broadcast(data):
            try:
                await manager.broadcast(data)
                print("Real-time broadcast successful")
            except Exception as broadcast_err:
                print(f"Broadcast failed: {broadcast_err}")

        asyncio.create_task(do_broadcast(broadcast_data))
        
        # automated ips action
        if analysis.get("action") == "BLOCK_IP":
            src_ip = alert_data.get("source_ip")
            attack_type = alert_data.get("attack_type") or "Malicious Activity"
            
            if src_ip:
                # sync block
                async def persist_block(ip, reason):
                    try:
                        # save for dashboard
                        block_data = {
                            "ip": ip,
                            "reason": reason,
                            "blocked_at": datetime.utcnow().strftime("%I:%M:%S %p"),
                            "timestamp": datetime.utcnow()
                        }
                        await db["blocked_ips"].update_one(
                            {"ip": ip},
                            {"$set": block_data},
                            upsert=True
                        )
                        # update global blocklist for agents
                        await db["system_config"].update_one(
                            {"type": "global_policy"},
                            {"$addToSet": {"blocklist": ip}},
                            upsert=True
                        )
                    except Exception as e:
                        logger.error(f"Failed to persist blocked IP {ip}: {e}")

                asyncio.create_task(persist_block(src_ip, attack_type))

                # 2. Execute OS Level Firewall Command (DISABLED FOR DEMO)
                # async def apply_firewall_rule(ip):
                #     try:
                #         # Windows Netsh Command
                #         cmd = f'netsh advfirewall firewall add rule name="BlackHole_Block_{ip}" dir=in action=block remoteip={ip}'
                #         process = await asyncio.create_subprocess_shell(
                #             cmd,
                #             stdout=asyncio.subprocess.PIPE,
                #             stderr=asyncio.subprocess.PIPE
                #         )
                #         stdout, stderr = await process.communicate()
                #         if process.returncode == 0:
                #             logger.info(f"IPS ACTION SUCCESS: Firewall rule applied for {ip}")
                #         else:
                #             logger.warning(f"IPS ACTION FAILED for {ip} (Requires Admin): {stderr.decode().strip()}")
                #     except Exception as e:
                #         logger.error(f"Subprocess firewall error: {e}")
                
                # asyncio.create_task(apply_firewall_rule(src_ip))
                
        # auto telegram routing
        async def send_telegram_alert(alert_info, analysis_info):
            try:
                # 1. Fetch config
                tg_config = await db["system_config"].find_one({"type": "telegram_settings"})
                
                if tg_config and not tg_config.get("enabled", True):
                    return
                
                # Use provided fallback credentials if config is missing or incomplete
                bot_token = tg_config.get("botToken") if tg_config and tg_config.get("botToken") else "8804241171:AAHQeJVoDjraC94yYMhPleUcz8-mfwvi84k"
                chat_id = tg_config.get("chatId") if tg_config and tg_config.get("chatId") else "1377720555"
                
                if not bot_token or not chat_id:
                    return
                
                # 2. Robust Key Extraction
                msg_type = alert_info.get("attack_type") or alert_info.get("type") or "Unknown Attack"
                msg_src = alert_info.get("source_ip") or alert_info.get("source") or "0.0.0.0"
                msg_sev = analysis_info.get("severity", "High")
                msg_ts = alert_info.get("timestamp", datetime.utcnow().isoformat())
                
                # 3. Format Message
                text = f"🚨 *[BLACKHOLE IDS - NEW ALERT DETECTED]* 🚨\n\n" \
                       f"• *Attack Type:* {msg_type}\n" \
                       f"• *Source IP:* `{msg_src}`\n" \
                       f"• *Severity Level:* {msg_sev}\n" \
                       f"• *Timestamp:* {msg_ts}\n\n" \
                       f"🛡️ _Automated mitigation protocols have been initiated._"
                       
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                data = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
                
                response = await asyncio.to_thread(requests.post, url, json=data, timeout=5)
                
                if response.status_code == 200:
                    logger.info("Automated Telegram alert dispatched successfully.")
                else:
                    logger.error(f"Telegram API rejected message: {response.text}")
            except Exception as e:
                logger.error(f"Automated Telegram dispatch failed: {str(e)}")
                
        asyncio.create_task(send_telegram_alert(alert_data, analysis))
        
        return {"status": "success", "message": "Alert persistent, analyzed, and broadcasted"}
    except Exception as e:
        print(f"CRITICAL AGENT POST ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "success", "message": "Fallback: Alert accepted despite internal error"}

# register blocked ip
@router.post("/alerts/blocked")
async def register_blocked_ip(payload: BlockedIPSchema, db = Depends(get_database)):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection not ready")
            
        block_data = {
            "ip": payload.ip,
            "reason": payload.reason,
            "blocked_at": datetime.utcnow().strftime("%I:%M:%S %p"),
            "timestamp": datetime.utcnow() # Internal timestamp for sorting
        }
        
        await db["blocked_ips"].update_one(
            {"ip": payload.ip},
            {"$set": block_data},
            upsert=True
        )
        
        # update global blocklist
        await db["system_config"].update_one(
            {"type": "global_policy"},
            {"$addToSet": {"blocklist": payload.ip}},
            upsert=True
        )
        
        return {"status": "success", "message": f"IP {payload.ip} registered as blocked."}
    except Exception as e:
        logger.error(f"Failed to register blocked IP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# fetch blocked ips
@router.get("/alerts/blocked")
async def get_blocked_ips(db = Depends(get_database)):
    try:
        if db is None:
            return []
        # Use projection to ensure _id is handled or dropped if needed, 
        # but standardizing on string conversion for consistency.
        cursor = db["blocked_ips"].find({}).sort("timestamp", -1)
        blocked = await cursor.to_list(length=100)
        
        prepared_blocked = []
        for doc in blocked:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            prepared_blocked.append(doc)
            
        return jsonable_encoder(prepared_blocked)
    except Exception as e:
        logger.error(f"Failed to fetch blocked IPs: {e}")
        return []

# get alert history
@router.get("/alerts")
async def get_alerts(db = Depends(get_database)):
    try:
        if db is None:
            print("CRITICAL ROUTE ERROR: Database connection not ready.")
            return []
            
        print("DEBUG MONGO: Actual alerts count in DB ->", await db["alerts"].count_documents({}))
        
        # Simple, unfiltered fetch ordered by timestamp (newest first)
        cursor = db["alerts"].find({}).sort("timestamp", -1)
        # Remove length=100 to allow the full volume to be fetched and accurately counted
        alerts = await cursor.to_list(length=None)
        
        # Safe _id stringification to prevent serialization crashes
        prepared_alerts = []
        for alert in alerts:
            if "_id" in alert:
                alert["_id"] = str(alert["_id"])
            prepared_alerts.append(alert)
        
        # Let FastAPI's encoder handle datetimes safely
        return jsonable_encoder(prepared_alerts)
    except Exception as e:
        print(f"CRITICAL ROUTE ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return an empty list so the dashboard doesn't show 1 fake fallback alert
        return []

# clear all alerts
@router.delete("/alerts/clear")
async def clear_all_alerts(db = Depends(get_database)):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection not ready")
        
        # Purge both collections for a clean demo reset
        await db["alerts"].delete_many({})
        await db["blocked_ips"].delete_many({})
        
        # Reset global policy blocklist as well
        await db["system_config"].update_one(
            {"type": "global_policy"},
            {"$set": {"blocklist": []}}
        )
        
        return {"status": "success", "message": "All alerts and blocked IPs purged"}
    except Exception as e:
        logger.error(f"Error clearing alerts: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to clear data")

# get agent config
@router.get("/config")
async def get_agent_config(db = Depends(get_database), agent = Depends(verify_agent_api_key)):
    # fetch config and blocklist
    config = await db["system_config"].find_one({"type": "global_policy"})
    if not config:
        # default settings
        return {
            "ddos_threshold": 100,
            "port_scan_threshold": 50,
            "blocklist": ["192.168.1.99", "10.0.0.66"]
        }
    return {
        "ddos_threshold": config.get("ddos_threshold", 100),
        "port_scan_threshold": config.get("port_scan_threshold", 50),
        "blocklist": config.get("blocklist", [])
    }

# add ip to blocklist
@router.post("/blocklist/add")
async def add_to_blocklist(payload: BlockedIPSchema, db = Depends(get_database)):
    try:
        # add ip to array in global policy
        result = await db["system_config"].update_one(
            {"type": "global_policy"},
            {"$addToSet": {"blocklist": payload.ip}},
            upsert=True
        )
        return {"status": "success", "message": f"IP {payload.ip} has been successfully blacklisted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UnblockIPSchema(BaseModel):
    ip: str

# remove ip from blocklist
@router.post("/blocklist/remove")
async def remove_from_blocklist(payload: UnblockIPSchema, db = Depends(get_database)):
    try:
        if db is None:
            raise HTTPException(status_code=503, detail="Database connection not ready")
            
        result = await db["system_config"].update_one(
            {"type": "global_policy"},
            {"$pull": {"blocklist": payload.ip}}
        )
        return {"status": "success", "message": f"IP {payload.ip} has been removed from blocklist."}
    except Exception as e:
        logger.error(f"Error unblocking IP: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to unblock IP")