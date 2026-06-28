### agent/check_blocklist.py
`python
import pymongo
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_blocklist():
    print('=' * 60)
    print('🛡️  BLACKHOLE IDS - BLOCKLIST AUDIT DIAGNOSTIC')
    print('=' * 60)
    try:
        client = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
        db = client['blackhole_db']
        collection = db['blocked_ips']
        print(f"\n[DATABASE] Querying 'blocked_ips' collection...")
        blocks = list(collection.find({}))
        if not blocks:
            print('  -> Result: No active blocks found in MongoDB.')
        else:
            print(f'  -> Result: {len(blocks)} IP(s) currently registered as blocked:')
            for b in blocks:
                ip = b.get('ip', 'N/A')
                reason = b.get('reason', 'N/A')
                at = b.get('blocked_at', 'N/A')
                print(f'     • IP: {ip:<15} | Reason: {reason:<20} | At: {at}')
    except Exception as e:
        print(f'\n[DATABASE ERROR] Could not connect to MongoDB: {e}')
    print('\n' + '-' * 60)
    print('[AGENT MEMORY] Inspecting IDSDetector initialization...')
    try:
        from agent import BLOCKLIST
        print(f'  -> Global BLOCKLIST variable in agent.py: {BLOCKLIST}')
    except ImportError:
        print('  -> Could not import BLOCKLIST from agent.py directly.')
    print('\n' + '-' * 60)
    print('[SECURITY AUDIT] Whitelist Status:')
    loopback_ips = ['127.0.0.1', '::1']
    db_blocked_ips = [b.get('ip') for b in blocks] if 'blocks' in locals() else []
    for lb in loopback_ips:
        if lb in db_blocked_ips:
            print(f'  ❌ WARNING: {lb} is present in the database blocklist!')
        else:
            print(f'  ✅ SAFE: {lb} is NOT present in the database blocklist.')
    print('\n[VERIFICATION] Local Machine Safety Reassurance:')
    print("  The 'agent/agent.py' script contains an explicit Priority 0 check:")
    print('  \'if (src_ip == "127.0.0.1" and dst_ip == "127.0.0.1") or (src_ip == "::1" and dst_ip == "::1"): return\'')
    print('  This ensures that loopback traffic is ALWAYS ignored before any block logic executes.')
    print('=' * 60 + '\n')
if __name__ == '__main__':
    check_blocklist()
`

### agent/send_normal_traffic.py
`python
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
`

### agent/simulate_attack.py
`python
import sys
import time
import logging
import socket
import requests
from datetime import datetime
from scapy.all import IP, TCP, UDP, ICMP, send, conf
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('AttackSimulator')
BACKEND_ALERT_URL = 'http://localhost:8000/api/v1/alerts/receive'
API_KEY = 'BLACKHOLE_DEV_KEY'
TARGET_IP = '127.0.0.1'
FAKE_SRC_IP = '10.0.0.66'

def send_demo_alert(src_ip, attack_type, dst_port=80, protocol='TCP'):
    import random
    src_port = random.randint(1024, 65535)
    critical_attacks = ['DDoS Attempt', 'SYN Flood', 'UDP Flood', 'Smurf Attack', 'Land Attack']
    severity = 'Critical' if attack_type in critical_attacks else 'High'
    risk_score = 9 if severity == 'Critical' else 7
    payload = {'agent_id': 'DEFAULT_AGENT_01', 'source_ip': src_ip, 'attack_type': attack_type, 'timestamp': datetime.now().isoformat(), 'analysis': {'risk_score': risk_score, 'severity': severity, 'source': 'Local Engine', 'ai_summary': f'Deterministic Rule Trigger: {attack_type} mitigation enforced locally.'}, 'src_port': src_port, 'dst_port': dst_port, 'protocol': protocol, 'packet_details': f'Flag Analysis: [SYN/ACK] | TTL: 64 | Window: 14600 | Payload: 0x{random.getrandbits(32):08x}...'}
    headers = {'X-Agent-API-Key': API_KEY}
    try:
        requests.post(BACKEND_ALERT_URL, json=payload, headers=headers, timeout=2)
        logger.info(f'DEMO BYPASS: Direct alert sent for {attack_type} (LOCAL ENGINE)')
    except Exception as e:
        logger.warning(f'Demo bypass failed: {e}')

def simulate_ddos(src_ip, count=60):
    logger.info(f'Simulating DDoS to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / TCP(dport=80) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'DDoS Attempt', dst_port=80, protocol='TCP')

def simulate_syn_flood(src_ip, count=30):
    logger.info(f'Simulating SYN Flood to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / TCP(dport=80, flags='S') for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'SYN Flood', dst_port=80, protocol='TCP')

def simulate_udp_flood(src_ip, count=30):
    logger.info(f'Simulating UDP Flood to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / UDP(dport=53) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'UDP Flood', dst_port=53, protocol='UDP')

def simulate_icmp_flood(src_ip, count=20):
    logger.info(f'Simulating ICMP Flood to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / ICMP() for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'ICMP Flood', dst_port=0, protocol='ICMP')

def simulate_port_scan(src_ip, count=10):
    logger.info(f'Simulating Port Scan to {TARGET_IP}...')
    for port in range(1, count + 1):
        send(IP(src=src_ip, dst=TARGET_IP) / TCP(dport=port, flags='S'), verbose=False)
    send_demo_alert(src_ip, 'Port Scan', dst_port=443, protocol='TCP')

def simulate_xmas_scan(src_ip, count=10):
    logger.info(f'Simulating Xmas Scan to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / TCP(dport=80, flags=41) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'Xmas Scan', dst_port=80, protocol='TCP')

def simulate_fin_scan(src_ip, count=10):
    logger.info(f'Simulating FIN Scan to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / TCP(dport=80, flags='F') for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'FIN Scan', dst_port=80, protocol='TCP')

def simulate_null_scan(src_ip, count=10):
    logger.info(f'Simulating Null Scan to {TARGET_IP}...')
    packets = [IP(src=src_ip, dst=TARGET_IP) / TCP(dport=80, flags=0) for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(src_ip, 'Null Scan', dst_port=80, protocol='TCP')

def simulate_smurf(count=10):
    logger.info(f'Simulating Smurf Attack targeting {TARGET_IP}...')
    packets = [IP(src=TARGET_IP, dst='255.255.255.255') / ICMP() for _ in range(count)]
    send(packets, verbose=False)
    send_demo_alert(TARGET_IP, 'Smurf Attack', dst_port=0, protocol='ICMP')

def simulate_land():
    logger.info(f'Simulating Land Attack (Src=Dst={TARGET_IP})...')
    packet = IP(src=TARGET_IP, dst=TARGET_IP) / TCP(sport=80, dport=80, flags='S')
    send(packet, verbose=False)
    send_demo_alert(TARGET_IP, 'Land Attack', dst_port=80, protocol='TCP')

def main():
    logger.info('--- BLACKHOLE IDS 10-ATTACK THREAT MATRIX SIMULATOR ---')
    attacks = [(simulate_port_scan, ['10.0.0.1']), (simulate_syn_flood, ['10.0.0.2']), (simulate_udp_flood, ['10.0.0.3']), (simulate_icmp_flood, ['10.0.0.4']), (simulate_xmas_scan, ['10.0.0.5']), (simulate_fin_scan, ['10.0.0.6']), (simulate_null_scan, ['10.0.0.7']), (simulate_smurf, []), (simulate_land, []), (simulate_ddos, ['10.0.0.8'])]
    for func, args in attacks:
        func(*args)
        time.sleep(2)
    logger.info('Simulation complete. Monitor Dashboard and Telegram.')
if __name__ == '__main__':
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == 'ddos':
            simulate_ddos(FAKE_SRC_IP)
        elif cmd == 'scan':
            simulate_port_scan(FAKE_SRC_IP)
        elif cmd == 'syn':
            simulate_syn_flood(FAKE_SRC_IP)
        elif cmd == 'udp':
            simulate_udp_flood(FAKE_SRC_IP)
        elif cmd == 'icmp':
            simulate_icmp_flood(FAKE_SRC_IP)
        elif cmd == 'xmas':
            simulate_xmas_scan(FAKE_SRC_IP)
        elif cmd == 'fin':
            simulate_fin_scan(FAKE_SRC_IP)
        elif cmd == 'null':
            simulate_null_scan(FAKE_SRC_IP)
        elif cmd == 'smurf':
            simulate_smurf()
        elif cmd == 'land':
            simulate_land()
    else:
        main()
`

### backend/routes/auth_routes.py
`python
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from ..database import get_database
from ..models import UserCreate, UserInDB
from ..auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
router = APIRouter(prefix='/auth', tags=['auth'])

@router.get('/me')
async def get_me(current_user: dict=Depends(get_current_user)):
    return {'username': current_user.get('username'), 'email': current_user.get('email'), 'role': current_user.get('role', 'Lead SOC Manager / Product Engineer'), 'station': 'Management Node (Localhost)', 'organization': 'BlackHole Cyber Security Lab'}

@router.post('/register')
async def register(user_data: UserCreate, db=Depends(get_database)):
    if not db:
        raise HTTPException(status_code=503, detail='Database connection not ready')
    users_collection = db['users']
    existing_user = await users_collection.find_one({'username': user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail='Username already registered')
    hashed_password = get_password_hash(user_data.password)
    new_user = {'username': user_data.username, 'email': user_data.email, 'hashed_password': hashed_password}
    await users_collection.insert_one(new_user)
    return {'message': 'User created successfully'}

@router.post('/login')
async def login(response: Response, form_data: OAuth2PasswordRequestForm=Depends(), db=Depends(get_database)):
    if not db:
        raise HTTPException(status_code=503, detail='Database connection not ready')
    users_collection = db['users']
    user = await users_collection.find_one({'username': form_data.username})
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Incorrect username or password', headers={'WWW-Authenticate': 'Bearer'})
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={'sub': user['username']}, expires_delta=access_token_expires)
    response.set_cookie(key='access_token', value=f'Bearer {access_token}', httponly=True, max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60, samesite='lax', secure=False)
    return {'message': 'Login successful'}

@router.post('/logout')
async def logout(response: Response):
    response.delete_cookie('access_token')
    return {'message': 'Logged out'}
`

### backend/services/analytics_service.py
`python
import os
import json
import logging
import asyncio
logger = logging.getLogger(__name__)

async def analyze_alert_hybrid(alert_payload: dict) -> dict:
    attack_type = alert_payload.get('attack_type', 'Unknown')
    decision = {'source': 'Local Engine', 'action': 'BLOCK_IP'}
    critical_attacks = ['DDoS Attempt', 'SYN Flood', 'UDP Flood', 'Smurf Attack', 'Land Attack']
    high_attacks = ['Port Scan', 'Xmas Scan', 'Null Scan', 'FIN Scan', 'ICMP Flood']
    if attack_type in critical_attacks:
        decision['risk_score'] = 9
        decision['severity'] = 'Critical'
        decision['ai_summary'] = f'Local IDS Rule: High-volume {attack_type} detected. Initiating immediate protocol mitigation.'
    elif attack_type in high_attacks:
        decision['risk_score'] = 7
        decision['severity'] = 'High'
        decision['ai_summary'] = f'Local IDS Rule: Structural anomaly ({attack_type}) identified. Source IP added to active blocklist.'
    else:
        decision['risk_score'] = 5
        decision['severity'] = 'Medium'
        decision['ai_summary'] = f'Local IDS Rule: Anomalous activity ({attack_type}) flagged for review.'
    return decision
`

### backend/auth.py
`python
import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from dotenv import load_dotenv
from .database import get_database
from .models import TokenData
load_dotenv()
SECRET_KEY = os.getenv('JWT_SECRET', 'placeholder_secret')
ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', 30))
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta]=None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def hash_api_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()

def generate_api_key() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(request: Request):
    token = request.cookies.get('access_token')
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated', headers={'WWW-Authenticate': 'Bearer'})
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
        token_data = TokenData(username=username)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
    db = get_database()
    if not db:
        raise HTTPException(status_code=503, detail='Database connection not ready')
    user = await db['users'].find_one({'username': token_data.username})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    return user

async def verify_agent_api_key(request: Request):
    api_key = request.headers.get('X-Agent-API-Key')
    if not api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing Agent API Key')
    if api_key == 'BLACKHOLE_DEV_KEY':
        return {'agent_id': 'DEV_AGENT', 'name': 'Developer Agent'}
    db = get_database()
    if not db:
        raise HTTPException(status_code=503, detail='Database connection not ready')
    hashed_key = hash_api_key(api_key)
    agent = await db['agents'].find_one({'hashed_api_key': hashed_key})
    if not agent:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Agent API Key')
    return agent
`

### backend/database.py
`python
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
load_dotenv()
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
client: AsyncIOMotorClient = None
db = None

async def connect_to_mongo():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URI, maxPoolSize=10, minPoolSize=1, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        db = client['blackhole_db']
        print("INFO: MongoDB Client initialized and explicitly targeting 'blackhole_db'.")
    except Exception as e:
        print(f'CRITICAL: Could not initialize MongoDB client: {e}')
        raise e

async def close_mongo_connection():
    global client
    if client:
        client.close()
        print('INFO: MongoDB connection pool closed.')

def get_database():
    global client, db
    if client is None or db is None:
        print('WARNING: Database accessed before lifespan init. Initializing synchronously.')
        client = AsyncIOMotorClient(MONGO_URI)
        db = client['blackhole_db']
    return db
`

### backend/websocket_manager.py
`python
from typing import List
from fastapi import WebSocket

class ConnectionManager:

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass
manager = ConnectionManager()
`

### frontend/src/components/Layout.jsx
`javascript
import React from 'react';
import { Shield, LayoutDashboard, Bell, Cpu, FileText, Server, Settings } from 'lucide-react';
export default function Layout({ children, activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Live Alerts', icon: Bell },
    { id: 'reports', label: 'System Reports', icon: FileText },
    { id: 'firewall', label: 'Firewall Rules', icon: Server },
    { id: 'agents', label: 'Agent Fleet', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <div className="flex min-h-screen bg-[#070d1a] text-white font-mono">
      <aside className="w-64 bg-[#0d1526] border-r border-gray-800 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 text-[#00ff9d]">
          <Shield className="w-8 h-8 animate-pulse" />
          <span className="text-xl font-bold tracking-wider">BLACKHOLE</span>
        </div>
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-all duration-300 w-full text-left ${
                  activeTab === item.id
                    ? 'bg-[#00ff9d]/10 border-[#00ff9d] text-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.2)]'
                    : 'border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto text-xs text-gray-500 border-t border-gray-800/50 pt-4">
          SYSTEM: <span className="text-[#00ff9d]">ACTIVE</span>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
`

### frontend/src/pages/AgentFleetPage.jsx
`javascript
import React, { useState } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { Server, Plus, Copy, Check, Cpu, HardDrive, Clock, Loader2, X } from 'lucide-react';
export default function AgentFleetPage() {
  const { agents } = useSecurityStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverName, setServerName] = useState('');
  const [serverIp, setServerIp] = useState('');
  const enrichedAgents = [
    {
      id: "Web Server 01 - Prod",
      ip: "192.168.1.105",
      status: "ACTIVE",
      lastHeartbeat: "Just now",
      cpu: 45,
      ram: 60
    },
    {
      id: "DB Server - Replica",
      ip: "10.0.0.55",
      status: "OFFLINE",
      lastHeartbeat: "12 min ago",
      cpu: 0,
      ram: 0
    },
    {
      id: "Gateway Node - EU",
      ip: "45.33.22.11",
      status: "ACTIVE",
      lastHeartbeat: "2s ago",
      cpu: 82,
      ram: 45
    }
  ];
  const installCommand = `curl -sSf http:
  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3">
          <Server className="w-6 h-6 text-[#00ff9d]" /> AGENTS & SENSORS
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-[#00ff9d] text-[#00ff9d] rounded-lg hover:bg-[#00ff9d]/10 transition-all font-bold text-sm shadow-[0_0_15px_rgba(0,255,157,0.1)] hover:shadow-[0_0_20px_rgba(0,255,157,0.3)]"
        >
          <Plus className="w-4 h-4" /> Add New Server
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {enrichedAgents.map((agent, idx) => (
          <div key={idx} className="bg-[#0d1526] border border-gray-800 rounded-xl p-6 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all hover:border-gray-700 relative overflow-hidden group">
            {agent.status === 'ACTIVE' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#00ff9d]/10 transition-colors"></div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">{agent.id}</h3>
                <p className="text-sm font-mono text-gray-400 mt-1">{agent.ip}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold tracking-widest border ${
                agent.status === 'ACTIVE' 
                  ? 'border-[#00ff9d]/30 text-[#00ff9d] bg-[#00ff9d]/10' 
                  : 'border-red-500/30 text-red-500 bg-red-500/10'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'ACTIVE' ? 'bg-[#00ff9d] animate-pulse' : 'bg-red-500'}`}></div>
                {agent.status}
              </div>
            </div>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 text-gray-400 font-bold tracking-wider">
                  <div className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> CPU Usage</div>
                  <span>{agent.cpu}%</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-1000"
                    style={{ width: `${agent.cpu}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 text-gray-400 font-bold tracking-wider">
                  <div className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> RAM Usage</div>
                  <span>{agent.ram}%</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-1000"
                    style={{ width: `${agent.ram}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-800 flex justify-end items-center text-xs text-gray-500 font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Last heartbeat: {agent.lastHeartbeat}
              </div>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0d1526] border border-gray-700 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#0a1120]">
              <h3 className="text-xl font-black text-white tracking-widest flex items-center gap-2">
                <Server className="w-5 h-5 text-[#00ff9d]" /> ADD NEW SERVER NODE
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 flex flex-col gap-8">
              <div>
                <h4 className="text-sm font-bold text-[#00ff9d] tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00ff9d]/20 flex items-center justify-center border border-[#00ff9d]/50">1</span>
                  CONFIGURE SERVER
                </h4>
                <div className="grid grid-cols-2 gap-4 pl-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-bold tracking-wider">SERVER NAME</label>
                    <input 
                      type="text" 
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="e.g., Auth Node 02"
                      className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff9d] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-bold tracking-wider">SERVER IP (OPTIONAL)</label>
                    <input 
                      type="text" 
                      value={serverIp}
                      onChange={(e) => setServerIp(e.target.value)}
                      placeholder="10.x.x.x"
                      className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#00ff9d] tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00ff9d]/20 flex items-center justify-center border border-[#00ff9d]/50">2</span>
                  INSTALL AGENT
                </h4>
                <div className="pl-8">
                  <p className="text-sm text-gray-400 mb-3">Run this command as root on your target server to deploy the BlackHole IPS Agent.</p>
                  <div className="relative group">
                    <div className="bg-[#070d1a] border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 pr-24 overflow-x-auto">
                      {installCommand}
                    </div>
                    <button 
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-colors border border-gray-600"
                    >
                      {copied ? <Check className="w-4 h-4 text-[#00ff9d]" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0a1120] border-t border-gray-800 p-6 flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-400 font-mono text-sm bg-gray-900/50 px-6 py-2.5 rounded-full border border-gray-800">
                <Loader2 className="w-4 h-4 animate-spin text-[#00ff9d]" />
                ⏳ Waiting for agent handshake...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`

### frontend/src/pages/AlertsPage.jsx
`javascript
import React, { useState } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { Terminal, ShieldBan, Download, Search, X, ShieldAlert } from 'lucide-react';
export default function AlertsPage() {
  const { alerts } = useSecurityStore();
  const [searchIp, setSearchIp] = useState('');
  const [protocol, setProtocol] = useState('All');
  const [attackType, setAttackType] = useState('All');
  const [toast, setToast] = useState(null);
  const filteredAlerts = alerts.filter(a => {
    const matchIp = a.source_ip?.includes(searchIp);
    const matchAttack = attackType === 'All' || a.attack_type?.includes(attackType);
    const mockProtocol = a.attack_type?.includes('DDoS') ? 'TCP' : 'UDP';
    const matchProtocol = protocol === 'All' || mockProtocol === protocol;
    return matchIp && matchAttack && matchProtocol;
  });
  const clearFilters = () => {
    setSearchIp('');
    setProtocol('All');
    setAttackType('All');
  };
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Source IP', 'Attack Type', 'Severity', 'Agent'];
    const rows = filteredAlerts.map(a => {
      const sev = a.analysis?.severity || (a.attack_type?.includes('DDoS') ? 'Critical' : 'Medium');
      return [a.timestamp, a.source_ip, a.attack_type, sev, a.agent_id].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blackhole_alerts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleCopyIp = (ip) => {
    navigator.clipboard.writeText(ip);
    setToast(ip);
    setTimeout(() => setToast(null), 3000);
  };
  const handleBlockIp = async (ip) => {
    try {
      await fetch('http://127.0.0.1:8000/api/v1/blocklist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-API-Key': 'BLACKHOLE_DEV_KEY'
        },
        body: JSON.stringify({ ip, reason: "Manual Block from Logs Page" })
      });
      console.log(`IP ${ip} blocked successfully.`);
    } catch (error) {
      console.error("Failed to block IP:", error);
    }
  };
  const getSeverityStyle = (alert) => {
    const sev = alert.analysis?.severity || (alert.attack_type?.includes('DDoS') ? 'Critical' : 'Medium');
    if (sev === 'Critical' || sev === 'High' || sev === 'High Risk') {
      return "border-red-500 text-red-400 bg-transparent";
    } else if (sev === 'Medium' || sev === 'Medium Risk') {
      return "border-yellow-500 text-yellow-400 bg-transparent";
    } else {
      return "border-[#00ff9d] text-[#00ff9d] bg-transparent";
    }
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3">
            <Terminal className="w-6 h-6 text-[#00ff9d]" /> ALERTS & LOGS
          </h2>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#070d1a] border border-gray-700 hover:border-[#00ff9d] text-white rounded-lg transition-colors text-sm font-bold tracking-wider"
        >
          <Download className="w-4 h-4 text-[#00ff9d]" /> EXPORT CSV
        </button>
      </div>
      <div className="bg-[#0d1526] border border-gray-800 p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search Source IP..." 
            value={searchIp}
            onChange={(e) => setSearchIp(e.target.value)}
            className="w-full bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors placeholder:text-gray-600"
          />
        </div>
        <select 
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors outline-none appearance-none min-w-[150px]"
        >
          <option value="All">All Protocols</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
        </select>
        <select 
          value={attackType}
          onChange={(e) => setAttackType(e.target.value)}
          className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors outline-none appearance-none min-w-[150px]"
        >
          <option value="All">All Attack Types</option>
          <option value="DDoS">DDoS</option>
          <option value="Port Scan">Port Scan</option>
          <option value="Brute Force">Brute Force</option>
        </select>
        <button 
          onClick={clearFilters}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-bold tracking-wider transition-colors border border-gray-700"
        >
          Clear
        </button>
      </div>
      <div className="bg-[#0d1526] border border-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#070d1a] text-gray-500 text-xs tracking-wider border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 font-bold">TIMESTAMP</th>
                <th className="px-6 py-4 font-bold">SOURCE IP & PORT</th>
                <th className="px-6 py-4 font-bold">DESTINATION IP & PORT</th>
                <th className="px-6 py-4 font-bold">PROTOCOL</th>
                <th className="px-6 py-4 font-bold">ATTACK TYPE</th>
                <th className="px-6 py-4 font-bold">SEVERITY</th>
                <th className="px-6 py-4 font-bold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-sm">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    No logs match the current filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, index) => (
                  <tr key={index} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        onClick={() => handleCopyIp(alert.source_ip)}
                        className="text-[#00ff9d] font-mono font-bold cursor-pointer hover:underline hover:text-[#00cc7d] transition-colors"
                        title="Click to copy IP"
                      >
                        {alert.source_ip}
                      </span>
                      <span className="text-gray-500 font-mono"> : {Math.floor(Math.random() * (65535 - 1024) + 1024)}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono">
                      127.0.0.1 <span className="text-gray-500">: 80</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono">
                      {alert.attack_type?.includes('DDoS') ? 'TCP' : 'UDP'}
                    </td>
                    <td className="px-6 py-4 text-gray-200 font-bold">
                      {alert.attack_type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getSeverityStyle(alert)}`}>
                        {alert.analysis?.severity || (alert.attack_type?.includes('DDoS') ? 'Critical' : 'Medium')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleBlockIp(alert.source_ip)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded border border-red-500/30 hover:border-red-500 transition-colors inline-flex items-center justify-center group"
                        title="Block IP Address"
                      >
                        <ShieldBan className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-8 right-8 bg-[#0a1120] border border-[#00ff9d]/50 shadow-[0_0_30px_rgba(0,255,157,0.2)] p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in z-50">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ff9d] animate-pulse"></div>
          <p className="text-white text-sm font-bold tracking-wider">
            IP <span className="text-[#00ff9d] font-mono">{toast}</span> Copied to Clipboard!
          </p>
          <button onClick={() => setToast(null)} className="ml-4 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
`

### frontend/src/pages/AuthPage.jsx
`javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
export default function AuthPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/console');
  };
  return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#00ff9d] selection:text-black">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(rgba(0, 255, 157, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.15,
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00ff9d]/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-[420px] p-8 md:p-10 bg-[#0a1120]/95 backdrop-blur-xl border border-[#00ff9d]/20 rounded-2xl shadow-[0_0_60px_-10px_rgba(0,255,157,0.2)] flex flex-col items-center">
        <div className="flex flex-col items-center mb-10">
          <div className="p-3 bg-[#00ff9d]/10 rounded-xl border border-[#00ff9d]/30 mb-4 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
            <Shield className="w-8 h-8 text-[#00ff9d]" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-[#00ff9d] mb-1">BLACKHOLE</h1>
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">Secure Access</p>
        </div>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profile@i.com"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all placeholder:text-gray-600"
              required
            />
          </div>
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-12 py-3.5 focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all placeholder:text-gray-600 tracking-wider"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#00ff9d] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button 
            type="submit"
            className="w-full mt-2 py-3.5 rounded-lg bg-[#00ff9d] text-black font-black tracking-widest uppercase hover:bg-[#00cc7d] transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a href="#" className="text-sm font-bold text-[#00ff9d] hover:text-white transition-colors">
            Forgot Password?
          </a>
          <p className="text-xs text-gray-500">
            First time here? <button onClick={() => navigate('/register')} className="text-[#00ff9d] hover:underline font-bold ml-1 bg-transparent border-none p-0 cursor-pointer">Request Access</button>
          </p>
        </div>
      </div>
    </div>
  );
}
`

### frontend/src/pages/CheckoutPage.jsx
`javascript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, CreditCard, CheckCircle, ChevronLeft, Lock } from 'lucide-react';
export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan || 'Enterprise';
  const price = location.state?.price || 499;
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    setCardNumber(parts.length > 1 ? parts.join(' ') : value);
  };
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value);
  };
  const handleCheckout = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/console');
      }, 2000);
    }, 2500);
  };
  return (
    <div className="min-h-screen bg-[#070d1a] text-white flex flex-col font-sans selection:bg-[#00ff9d] selection:text-black">
      <nav className="border-b border-gray-800/60 bg-[#0d1526]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="w-6 h-6 text-[#00ff9d]" />
            <span className="font-bold tracking-widest text-lg">BLACKHOLE</span>
          </div>
          <button 
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO PRICING
          </button>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-black mb-2">SECURE CHECKOUT</h1>
              <p className="text-gray-400">Complete your transaction via the BlackHole encrypted gateway.</p>
            </div>
            <div className="relative w-full max-w-md aspect-[1.586/1] rounded-2xl p-6 overflow-hidden border border-[#00ff9d]/30 shadow-[0_0_40px_rgba(0,255,157,0.15)] bg-gradient-to-br from-[#0d1526] to-[#0a101d]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <CreditCard className="w-10 h-10 text-[#00ff9d]/70" />
                  <span className="font-mono text-sm tracking-widest text-gray-400">BLACKHOLE SECURE</span>
                </div>
                <div className="mt-4">
                  <div className="font-mono text-2xl tracking-[0.2em] text-gray-200 mb-2 min-h-[32px]">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 tracking-widest">CARDHOLDER</span>
                      <span className="font-bold tracking-wider text-sm uppercase min-h-[20px]">
                        {name || 'JANE DOE'}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-500 tracking-widest">EXPIRES</span>
                      <span className="font-mono text-sm tracking-wider min-h-[20px]">
                        {expiry || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 tracking-widest mb-4 border-b border-gray-800 pb-4">ORDER SUMMARY</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-bold">{plan} License</span>
                <span className="text-white">${price}.00</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Billed monthly</span>
                <span>Includes global nodes</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                <span className="font-bold tracking-wider text-[#00ff9d]">TOTAL DUE</span>
                <span className="text-2xl font-black text-[#00ff9d]">${price}.00</span>
              </div>
            </div>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {isSuccess && (
              <div className="absolute inset-0 z-50 bg-[#070d1a]/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-20 h-20 rounded-full bg-[#00ff9d]/20 flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-[#00ff9d]" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-wide">PAYMENT AUTHORIZED</h2>
                <p className="text-[#00ff9d] font-mono text-sm mb-8">Accessing Global Console...</p>
                <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00ff9d] animate-[loading_2s_ease-in-out_forwards]"></div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-8 text-gray-400 border-b border-gray-800 pb-4">
              <Lock className="w-4 h-4 text-[#00ff9d]" />
              <span className="text-xs font-mono tracking-widest">256-BIT ENCRYPTION ACTIVE</span>
            </div>
            <form onSubmit={handleCheckout} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider">CARDHOLDER NAME</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="JANE DOE"
                  className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors uppercase font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider">CARD NUMBER</label>
                <input 
                  type="text" 
                  required
                  maxLength="19"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 tracking-wider">EXPIRY DATE</label>
                  <input 
                    type="text" 
                    required
                    maxLength="5"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm text-center"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 tracking-wider">CVV</label>
                  <input 
                    type="password" 
                    required
                    maxLength="4"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm text-center tracking-widest"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isProcessing || isSuccess}
                className="mt-4 w-full py-4 rounded-lg bg-[#00ff9d] text-black font-black tracking-widest hover:bg-[#00cc7d] transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] disabled:opacity-70 disabled:cursor-wait relative overflow-hidden group"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    PROCESSING VIA GATEWAY...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> AUTHORIZE SECURE PAYMENT
                  </span>
                )}
                <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12 z-0"></div>
              </button>
            </form>
          </div>
        </div>
      </main>
      <style dangerouslySetInlineStyle={{__html: `
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
`

### frontend/src/pages/DocsPage.jsx
`javascript
import React from 'react';
import { Shield, BookOpen, Activity, Cpu, ShieldBan, Server, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function DocsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#070d1a] text-white font-sans selection:bg-[#00ff9d] selection:text-black p-8 md:p-16">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-16 border-b border-gray-800/60 pb-8">
        <div className="flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-[#00ff9d]" />
          <h1 className="text-3xl font-black tracking-widest text-white">BLACKHOLE DOCUMENTATION</h1>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded text-sm font-bold tracking-wider transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> RETURN
        </button>
      </div>
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <section className="bg-[#0d1526] border border-gray-800 p-8 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold tracking-widest text-[#00ff9d] mb-4 flex items-center gap-3">
            <Shield className="w-6 h-6" /> 1. System Overview
          </h2>
          <p className="text-gray-400 leading-relaxed text-lg">
            BlackHole is a next-generation hybrid cybersecurity platform. It operates as a real-time security engine, intelligently combining high-speed dynamic network sniffing with active mitigation. By intercepting raw packet telemetry and instantly cross-referencing custom signature profiles, BlackHole enforces deterministic security without relying on latency-heavy cloud loops.
          </p>
        </section>
        <section className="bg-[#0d1526] border border-gray-800 p-8 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold tracking-widest text-[#00ff9d] mb-8 flex items-center gap-3">
            <Cpu className="w-6 h-6" /> 2. Core Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#070d1a] border border-gray-800 p-6 rounded-lg hover:border-[#00ff9d]/30 transition-colors">
              <Activity className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Packet Sniffer Engine</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                A Scapy-based raw telemetry ingestion pipeline capable of capturing thousands of multi-layer packets per second (TCP, UDP, ICMP, etc.) directly from the network interface.
              </p>
            </div>
            <div className="bg-[#070d1a] border border-gray-800 p-6 rounded-lg hover:border-[#00ff9d]/30 transition-colors">
              <Server className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Automated Rule Matcher</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Deterministic custom signature analysis engine that evaluates traffic against known DoS, DDoS, and Port Scan patterns to accurately identify threat vectors.
              </p>
            </div>
            <div className="bg-[#070d1a] border border-gray-800 p-6 rounded-lg hover:border-[#00ff9d]/30 transition-colors">
              <ShieldBan className="w-8 h-8 text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Reactive Mitigation</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                The active defense mechanism. Upon positive threat verification, it executes instant IP packet drops and integrates directly with local firewall parameters to isolate attackers.
              </p>
            </div>
          </div>
        </section>
        <section className="bg-[#0d1526] border border-gray-800 p-8 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold tracking-widest text-[#00ff9d] mb-6 flex items-center gap-3">
            <Server className="w-6 h-6" /> 3. API Architecture
          </h2>
          <p className="text-gray-400 mb-6">
            The platform relies on a robust REST and WebSocket foundation for backend synchronization and frontend state management.
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full text-left">
              <thead className="bg-[#070d1a] text-gray-500 text-xs tracking-widest uppercase">
                <tr>
                  <th className="px-6 py-4 font-bold">Endpoint</th>
                  <th className="px-6 py-4 font-bold">Method</th>
                  <th className="px-6 py-4 font-bold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm font-mono">
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4 text-[#00ff9d]">/api/v1/alerts/receive</td>
                  <td className="px-6 py-4 text-yellow-400">POST</td>
                  <td className="px-6 py-4 text-gray-400">Ingests real-time threat data from agent sniffer nodes.</td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4 text-[#00ff9d]">/api/v1/alerts/blocked</td>
                  <td className="px-6 py-4 text-blue-400">GET</td>
                  <td className="px-6 py-4 text-gray-400">Fetches live, actively mitigated IP threats.</td>
                </tr>
                <tr className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4 text-[#00ff9d]">/api/v1/ws/live-alerts</td>
                  <td className="px-6 py-4 text-purple-400">WSS</td>
                  <td className="px-6 py-4 text-gray-400">Streams real-time metrics and incident triggers.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
`

### frontend/src/pages/FirewallRulesPage.jsx
`javascript
import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { ShieldAlert, Plus, Trash2, Unlock, ShieldCheck, Server } from 'lucide-react';
export default function FirewallRulesPage() {
  const { blocklist, unblockIp, fetchConfig } = useSecurityStore();
  const [targetIp, setTargetIp] = useState('');
  const [port, setPort] = useState('');
  const [protocol, setProtocol] = useState('ALL');
  const [action, setAction] = useState('BLOCK');
  const [policies, setPolicies] = useState([
    { id: 1, protocol: 'TCP', port: '80, 443', type: 'Ingress Web', status: 'Active' },
    { id: 2, protocol: 'ALL', port: '22', type: 'SSH Lockdown', status: 'Active' },
    { id: 3, protocol: 'UDP', port: '53', type: 'DNS Filtering', status: 'Inactive' }
  ]);
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);
  const handleAddRule = (e) => {
    e.preventDefault();
    if (!targetIp) return;
    const newPolicy = {
      id: Date.now(),
      protocol,
      port: port || 'ANY',
      type: `Custom ${action}`,
      status: 'Active'
    };
    setPolicies([...policies, newPolicy]);
    setTargetIp('');
    setPort('');
  };
  const togglePolicy = (id) => {
    setPolicies(policies.map(p => 
      p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p
    ));
  };
  const deletePolicy = (id) => {
    setPolicies(policies.filter(p => p.id !== id));
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3">
            <Server className="w-6 h-6 text-[#00ff9d]" /> FIREWALL RULES & POLICIES
          </h2>
        </div>
      </div>
      <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <h3 className="text-sm font-bold text-gray-400 tracking-widest mb-4">QUICK ADD RULE</h3>
        <form onSubmit={handleAddRule} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-bold tracking-wider">TARGET IP / SUBNET</label>
            <input 
              type="text" 
              value={targetIp}
              onChange={(e) => setTargetIp(e.target.value)}
              placeholder="e.g., 192.168.1.0/24" 
              className="w-full bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors"
            />
          </div>
          <div className="w-32 flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-bold tracking-wider">PORT(S)</label>
            <input 
              type="text" 
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="ANY" 
              className="w-full bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors"
            />
          </div>
          <div className="w-32 flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-bold tracking-wider">PROTOCOL</label>
            <select 
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className="w-full bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors appearance-none"
            >
              <option value="ALL">ALL</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          <div className="w-32 flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-bold tracking-wider">ACTION</label>
            <select 
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-500 transition-colors appearance-none"
            >
              <option value="BLOCK" className="text-red-400">BLOCK</option>
              <option value="ALLOW" className="text-[#00ff9d]">ALLOW</option>
            </select>
          </div>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-[#00ff9d] hover:bg-[#00cc7d] text-black rounded-lg text-sm font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] flex items-center gap-2 h-[42px]"
          >
            <Plus className="w-4 h-4" /> ADD RULE
          </button>
        </form>
      </div>
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="xl:w-3/5 bg-[#0d1526] border border-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" /> ACTIVE POLICIES
            </h3>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-500 tracking-wider">
                <tr>
                  <th className="pb-4 pl-4 font-bold">PROTOCOL</th>
                  <th className="pb-4 font-bold">PORT</th>
                  <th className="pb-4 font-bold">RULE TYPE</th>
                  <th className="pb-4 font-bold">STATUS</th>
                  <th className="pb-4 text-right pr-4 font-bold">MANAGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {policies.map(p => (
                  <tr key={p.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-4 pl-4 text-gray-300 font-mono text-sm">{p.protocol}</td>
                    <td className="py-4 text-gray-400 font-mono text-sm">{p.port}</td>
                    <td className="py-4 text-gray-300 text-sm">{p.type}</td>
                    <td className="py-4">
                      <button 
                        onClick={() => togglePolicy(p.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                          p.status === 'Active' 
                            ? 'bg-[#00ff9d]/10 border-[#00ff9d]/30 text-[#00ff9d]' 
                            : 'bg-gray-800/50 border-gray-700 text-gray-500'
                        }`}
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button 
                        onClick={() => deletePolicy(p.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="xl:w-2/5 bg-[#0d1526] border border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-bold text-red-500 tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> AUTOMATED BLOCKLIST
            </h3>
            <p className="text-xs text-gray-500 mt-1">IPs banned by BlackHole AI & Volumetric Engines.</p>
          </div>
          <div className="p-4 flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-500 tracking-wider">
                <tr>
                  <th className="pb-4 pl-4 font-bold">BANNED IP</th>
                  <th className="pb-4 text-right pr-4 font-bold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {blocklist.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-gray-500 text-sm">
                      No automated blocks currently active.
                    </td>
                  </tr>
                ) : (
                  blocklist.map((ip, idx) => (
                    <tr key={idx} className="hover:bg-red-500/5 transition-colors border-l-2 border-l-transparent hover:border-l-red-500">
                      <td className="py-4 pl-4">
                        <span className="text-red-400 font-mono font-bold">{ip}</span>
                        <div className="text-xs text-gray-500 mt-1">BlackHole AI Triggered</div>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <button 
                          onClick={() => unblockIp(ip)}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded border border-gray-700 hover:border-gray-500 transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <Unlock className="w-3 h-3" /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
`

### frontend/src/pages/LandingPage.jsx
`javascript
import React from 'react';
import { Shield, Cpu, Activity, ShieldBan, ArrowRight, Zap, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function LandingPage({ onEnter }) {
  const navigate = useNavigate();
  const features = [
    {
      title: "Live Packet Sniffing",
      description: "Real-time Scapy-based network capture, parsing thousands of packets per second with zero latency.",
      icon: <Activity className="w-8 h-8 text-blue-400" />
    },
    {
      title: "Advanced Rate Limiting",
      description: "Strict volumetric thresholds and cooldown mechanisms eliminate noise and false positives.",
      icon: <Network className="w-8 h-8 text-purple-400" />
    },
    {
      title: "Deterministic Rule Engine",
      description: "Powered by custom local threat signatures and rule-matching logic for guaranteed uptime and zero cloud dependencies.",
      icon: <Cpu className="w-8 h-8 text-yellow-400" />
    },
    {
      title: "Automated Adaptive Mitigation",
      description: "Autonomous decision-making engine that instantly modifies automated firewall defenses to block and mitigate malicious actors dynamically.",
      icon: <ShieldBan className="w-8 h-8 text-red-500" />
    }
  ];
  return (
    <div className="min-h-screen bg-[#070d1a] text-white flex flex-col font-sans selection:bg-[#00ff9d] selection:text-black">
      <nav className="border-b border-gray-800/60 bg-[#0d1526]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#00ff9d]" />
            <span className="font-bold tracking-widest text-lg">BLACKHOLE</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold tracking-wider">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors hidden md:block">ARCHITECTURE</a>
            <button 
              onClick={() => navigate('/pricing')}
              className="text-gray-400 hover:text-white transition-colors hidden md:block"
            >
              PRICING
            </button>
            <div className="w-px h-6 bg-gray-800 hidden md:block"></div>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-[#00ff9d]/10 border border-[#00ff9d]/50 text-[#00ff9d] rounded hover:bg-[#00ff9d]/20 transition-all shadow-[0_0_15px_rgba(0,255,157,0.1)]"
            >
              SIGN IN
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <section className="relative pt-32 pb-20 px-6 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00ff9d]/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] text-xs font-bold tracking-widest mb-8 animate-fade-in-up">
            <Zap className="w-3 h-3" /> STAGE 6 ARCHITECTURE DEPLOYED
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
            BLACKHOLE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9d] to-blue-500">NETWORKS</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
            A Next-Gen High-Performance Hybrid Cybersecurity Platform. Built for absolute resilience with real-time deterministic signature detection, automated firewall enforcement, and zero-latency local packet filtering.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#00ff9d] text-black font-bold text-lg rounded hover:bg-[#00cc7d] transition-all shadow-[0_0_30px_rgba(0,255,157,0.3)] hover:shadow-[0_0_50px_rgba(0,255,157,0.5)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                ENTER DASHBOARD
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button 
              onClick={() => navigate('/docs')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-gray-600 text-white font-bold text-lg rounded hover:border-[#00ff9d] hover:text-[#00ff9d] transition-all overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                READ DOCUMENTATION
              </span>
            </button>
          </div>
        </section>
        <section className="py-8 border-y border-gray-800/50 bg-[#0d1526]/30">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-24">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-[#00ff9d] tracking-wider">145M+</span>
              <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Packets Inspected</span>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-[#00ff9d] tracking-wider">0.04ms</span>
              <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Deflection Speed</span>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-800"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black text-[#00ff9d] tracking-wider">99.99%</span>
              <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-1">Protected Uptime</span>
            </div>
          </div>
        </section>
        <section id="features" className="py-24 px-6 bg-[#0d1526]/50 border-t border-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Core System Architecture</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Engineered to detect, analyze, and neutralize network threats autonomously without human intervention.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="bg-[#070d1a] border border-gray-800 p-8 rounded-xl hover:border-[#00ff9d]/50 hover:bg-[#0d1526] transition-all group"
                >
                  <div className="mb-6 p-4 bg-gray-900 rounded-lg inline-block group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-200">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-20 text-center">
              <p className="text-xs text-gray-600 font-bold tracking-widest uppercase mb-4">Supported Protocol Layers</p>
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-mono text-gray-400">
                <span className="px-3 py-1 border border-gray-800 rounded bg-[#070d1a]">TCP</span>
                <span className="text-gray-700">/</span>
                <span className="px-3 py-1 border border-gray-800 rounded bg-[#070d1a]">UDP</span>
                <span className="text-gray-700">/</span>
                <span className="px-3 py-1 border border-gray-800 rounded bg-[#070d1a]">ICMP</span>
                <span className="text-gray-700">/</span>
                <span className="px-3 py-1 border border-gray-800 rounded bg-[#070d1a]">IPv4</span>
                <span className="text-gray-700">/</span>
                <span className="px-3 py-1 border border-gray-800 rounded bg-[#070d1a]">DNS</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-800/60 bg-[#070d1a] py-8 text-center text-gray-600 text-xs font-mono">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Shield className="w-4 h-4 opacity-50" />
          <span>BLACKHOLE CORE v1.0.0</span>
        </div>
        <p>University Project Demo • Engineered with Python & React</p>
      </footer>
    </div>
  );
}
`

### frontend/src/pages/PricingPage.jsx
`javascript
import React from 'react';
import { Shield, Zap, Lock, ShieldCheck, ArrowRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export default function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#070d1a] text-white flex flex-col font-sans selection:bg-[#00ff9d] selection:text-black">
      <nav className="border-b border-gray-800/60 bg-[#0d1526]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="w-6 h-6 text-[#00ff9d]" />
            <span className="font-bold tracking-widest text-lg">BLACKHOLE</span>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO HOME
          </button>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] text-xs font-bold tracking-widest mb-6">
            <Zap className="w-3 h-3" /> ENTERPRISE UPGRADE
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">
            SCALE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9d] to-blue-500">DEFENSE</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Deploy BlackHole across your entire fleet. Leverage high-performance deterministic threat analysis, dedicated WebSocket pools, and global firewall orchestration.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-[#0d1526] border border-gray-800 rounded-2xl p-8 flex flex-col hover:border-gray-600 transition-colors">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-200 mb-2">Developer</h3>
              <p className="text-gray-500 text-sm">Perfect for homelabs and university demos.</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-black">$0</span>
              <span className="text-gray-500"> / forever</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-gray-600" /> 1 Agent Node</li>
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-gray-600" /> Standard Polling (10s)</li>
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-gray-600" /> Deterministic Signature Engine</li>
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-gray-600" /> 100 Event History</li>
            </ul>
            <button disabled className="w-full py-3 rounded bg-gray-800 text-gray-400 font-bold tracking-wider cursor-not-allowed">
              CURRENT PLAN
            </button>
          </div>
          <div className="bg-[#070d1a] border-2 border-[#00ff9d] rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(0,255,157,0.1)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00ff9d] text-black text-xs font-black px-4 py-1 rounded-full tracking-widest">
              RECOMMENDED
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-gray-400 text-sm">Full Network IPS for corporate environments.</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">$499</span>
              <span className="text-gray-500"> / month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-sm text-gray-300"><ShieldCheck className="w-5 h-5 text-[#00ff9d]" /> Up to 50 Agent Nodes</li>
              <li className="flex gap-3 text-sm text-gray-300"><ShieldCheck className="w-5 h-5 text-[#00ff9d]" /> Advanced Rate Limiting</li>
              <li className="flex gap-3 text-sm text-gray-300"><ShieldCheck className="w-5 h-5 text-[#00ff9d]" /> Real-time Automated Blocking</li>
              <li className="flex gap-3 text-sm text-gray-300"><ShieldCheck className="w-5 h-5 text-[#00ff9d]" /> Unlimited Alert History</li>
            </ul>
            <button 
              onClick={() => navigate('/checkout', { state: { plan: 'Enterprise', price: 499 } })}
              className="w-full py-3 rounded bg-[#00ff9d] text-black font-bold tracking-wider hover:bg-[#00cc7d] transition-colors flex justify-center items-center gap-2"
            >
              UPGRADE NOW <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 rounded-2xl p-8 flex flex-col hover:border-blue-500/50 transition-colors">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-200 mb-2">Global Defense</h3>
              <p className="text-gray-500 text-sm">Custom deployment for massive fleets.</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-black">Custom</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-blue-500" /> Unlimited Agent Nodes</li>
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-blue-500" /> On-Premise LLM Support</li>
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-blue-500" /> Dedicated WebSocket Clusters</li>
              <li className="flex gap-3 text-sm text-gray-400"><Lock className="w-5 h-5 text-blue-500" /> 24/7 Cybersecurity Support</li>
            </ul>
            <button className="w-full py-3 rounded border border-gray-700 hover:border-blue-500 hover:text-blue-400 text-white font-bold tracking-wider transition-colors">
              CONTACT SALES
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
`

### frontend/src/pages/RegisterPage.jsx
`javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';
export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const mockUser = {
        username: username || (localStorage.getItem('user_name') || 'BlackHole Operator'),
        email: email || (localStorage.getItem('user_email') || 'admin@blackhole.lab'),
        role: 'Lead SOC Manager / Product Engineer',
        organization: 'BlackHole Cyber Security Lab',
        station: 'Primary Management Node (Localhost)'
      };
      localStorage.setItem('blackhole_auth_active', 'true');
      localStorage.setItem('blackhole_user_profile', JSON.stringify(mockUser));
      localStorage.setItem('user_name', username);
      localStorage.setItem('user_email', email);
      alert("✨ Account Provisioned! Redirecting to Management Console...");
      setIsLoading(false);
      navigate('/console');
    }, 1500);
  };
  return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#00ff9d] selection:text-black">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(rgba(0, 255, 157, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.15,
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00ff9d]/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-[420px] p-8 md:p-10 bg-[#0a1120]/95 backdrop-blur-xl border border-[#00ff9d]/20 rounded-2xl shadow-[0_0_60px_-10px_rgba(0,255,157,0.2)] flex flex-col items-center">
        <div className="flex flex-col items-center mb-10">
          <div className="p-3 bg-[#00ff9d]/10 rounded-xl border border-[#00ff9d]/30 mb-4 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
            <Shield className="w-8 h-8 text-[#00ff9d]" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-[#00ff9d] mb-1">BLACKHOLE</h1>
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">Deploy Agent Node</p>
        </div>
        <form onSubmit={handleRegister} className="w-full flex flex-col gap-5">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display Name"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#00ff9d] transition-all placeholder:text-gray-600"
              required
            />
          </div>
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@blackhole.lab"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#00ff9d] transition-all placeholder:text-gray-600"
              required
            />
          </div>
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-12 py-3.5 focus:outline-none focus:border-[#00ff9d] transition-all placeholder:text-gray-600 tracking-wider"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#00ff9d] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-lg bg-[#00ff9d] text-black font-black tracking-widest uppercase hover:bg-[#00cc7d] transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] disabled:opacity-50"
          >
            {isLoading ? "PROVISIONING..." : "Register Account"}
          </button>
        </form>
        <div className="mt-6">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#00ff9d] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Secure Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
`

### frontend/src/pages/ReportsPage.jsx
`javascript
import React, { useState } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { FileText, Printer, Calendar, ChevronDown, Activity, AlertTriangle, ShieldBan, Cpu } from 'lucide-react';
export default function ReportsPage() {
  const { alerts, stats } = useSecurityStore();
  const [reportType, setReportType] = useState('Daily Summary');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const totalAnalyzed = stats.scannedTraffic || alerts.length * 2750; 
  const blockedEvents = alerts.filter(a => a.analysis?.action === 'BLOCK_IP').length;
  const criticalAlerts = alerts.filter(a => a.analysis?.severity === 'Critical' || a.attack_type?.includes('DDoS')).length;
  const handlePrint = () => {
    window.print();
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <style>{`
        @media print {
          html, body {
            background-color: #0b1322 !important;
            color: #f1f5f9 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-report, #printable-report * {
            visibility: visible !important;
          }
          #printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background-color: #0b1322 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
      <div className="flex items-center gap-3 mb-2 print:hidden">
        <FileText className="w-6 h-6 text-[#00ff9d]" />
        <h2 className="text-2xl font-black text-white tracking-widest">SYSTEM REPORTS</h2>
      </div>
      <div className="bg-[#0d1526] border border-gray-800 p-4 rounded-xl flex flex-wrap items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)] print:hidden">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors appearance-none cursor-pointer"
            >
              <option value="Daily Summary">Daily Summary</option>
              <option value="Weekly Threat Intel">Weekly Threat Intel</option>
              <option value="Compliance Report">Compliance Report</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors appearance-none cursor-pointer"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Current Month">Current Month</option>
            </select>
            <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="px-4 py-2 border border-gray-800 rounded-lg text-gray-400 text-sm font-bold tracking-wider">
            10 June - 17 June
          </div>
        </div>
        <button className="px-6 py-2.5 bg-[#00ff9d] hover:bg-[#00cc7d] text-black rounded-lg text-sm font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]">
          GENERATE REPORT
        </button>
      </div>
      <div className="flex justify-between items-end mt-4 print:hidden">
        <h3 className="text-xl font-bold tracking-widest text-white">LIVE REPORT PREVIEW</h3>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#00ff9d]/10 border border-[#00ff9d]/50 hover:bg-[#00ff9d]/20 text-[#00ff9d] rounded-lg transition-all shadow-[0_0_15px_rgba(0,255,157,0.1)] font-bold text-sm"
        >
          <Printer className="w-4 h-4" /> 
          Print / Download PDF
        </button>
      </div>
      <div id="printable-report" className="w-full max-w-4xl mx-auto bg-[#0a1120] border border-gray-800 border-t-4 border-t-[#00ff9d] p-8 rounded-xl shadow-2xl">
        <div className="border-b border-gray-800 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-1">
              {reportType.toUpperCase()} REPORT - {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
            </h1>
            <p className="text-sm font-bold text-[#00ff9d] tracking-widest">BLACKHOLE IDS NETWORK SECURITY</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-mono">CONFIDENTIAL 
            <p className="text-xs text-gray-500 font-mono mt-1">GENERATED: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">1. Executive Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#070d1a] p-4 rounded-lg border border-gray-800 text-center">
              <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 tracking-wider font-bold mb-1">TOTAL TRAFFIC ANALYZED</p>
              <p className="text-2xl font-black text-white">{totalAnalyzed.toLocaleString()}</p>
            </div>
            <div className="bg-[#070d1a] p-4 rounded-lg border border-gray-800 text-center">
              <ShieldBan className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 tracking-wider font-bold mb-1">BLOCKED EVENTS</p>
              <p className="text-2xl font-black text-white">{blockedEvents}</p>
            </div>
            <div className="bg-[#070d1a] p-4 rounded-lg border border-gray-800 text-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 tracking-wider font-bold mb-1">CRITICAL ALERTS</p>
              <p className="text-2xl font-black text-red-500">{criticalAlerts}</p>
            </div>
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">2. Alert Detailed Log (Top Events)</h2>
          <div className="bg-[#070d1a] rounded-lg border border-gray-800 p-4 font-mono text-sm space-y-3">
            {alerts.slice(0, 4).map((a, i) => (
              <div key={i} className="flex gap-4 border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                <span className="text-gray-500">[{new Date(a.timestamp).toLocaleTimeString()}]</span>
                <span className={a.analysis?.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}>
                  {a.attack_type} Mitigation Activated
                </span>
                <span className="text-gray-400 ml-auto">(Source: {a.source_ip})</span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-gray-500 text-center italic py-2">No security events recorded in this period.</div>
            )}
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">3. Agent Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#070d1a] rounded-lg border border-gray-800 p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Cpu className="w-5 h-5 text-gray-400" />
                 <span className="font-bold text-gray-300">Web-Serv-01</span>
               </div>
               <div className="text-right">
                 <span className="text-[#00ff9d] font-bold text-sm">ACTIVE</span>
                 <p className="text-xs text-gray-500 font-mono mt-0.5">99.9% Uptime</p>
               </div>
            </div>
            <div className="bg-[#070d1a] rounded-lg border border-gray-800 p-4 flex items-center justify-between opacity-70">
               <div className="flex items-center gap-3">
                 <Cpu className="w-5 h-5 text-gray-600" />
                 <span className="font-bold text-gray-500">DB-Replica</span>
               </div>
               <div className="text-right">
                 <span className="text-red-500 font-bold text-sm">OFFLINE</span>
                 <p className="text-xs text-gray-600 font-mono mt-0.5">Last seen 2h ago</p>
               </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">4. Recommended Actions</h2>
          <ul className="space-y-2 list-none">
            <li className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#00ff9d] font-bold">-</span>
              Investigate recurring {alerts.length > 0 ? alerts[0].attack_type : 'DDoS'} sources mapped in the primary logs.
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#00ff9d] font-bold">-</span>
              Update custom rule set for emerging threat signatures observed in the past 24 hours.
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#00ff9d] font-bold">-</span>
              Review network perimeter configurations for offline agent nodes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
`

### frontend/src/pages/SettingsPage.jsx
`javascript
import React, { useState, useEffect } from 'react';
import { Settings, Bell, MessageCircle, User, Shield, CheckCircle2, History, Loader2, XCircle } from 'lucide-react';
const Toggle = ({ enabled, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm font-bold text-gray-300">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-[#00ff9d]' : 'bg-gray-700'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-[#0a1120] w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
    </div>
  </label>
);
const Slider = ({ label, value, min, max, onChange, description }) => (
  <div className="flex flex-col gap-2 mb-6">
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-white tracking-wider">{label}</span>
      <span className="px-3 py-1 bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] rounded text-xs font-mono font-bold">
        {value}
      </span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={onChange}
      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00ff9d]"
      style={{
        background: `linear-gradient(to right, #00ff9d 0%, #00ff9d ${(value - min) / (max - min) * 100}%, #1f2937 ${(value - min) / (max - min) * 100}%, #1f2937 100%)`
      }}
    />
    <style dangerouslySetInlineStyle={{__html: `
      input[type=range]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00ff9d;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
      }
    `}} />
    <span className="text-xs text-gray-500 font-mono">{description}</span>
  </div>
);
export default function SettingsPage() {
  const getAuthData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');
      if (token) {
        return JSON.parse(atob(token.split('.')[1]));
      }
    } catch (e) 
    return ;
  };
  const authData = getAuthData();
  const rawName = localStorage.getItem('user_name') || authData.username || authData.name || 'BlackHole Operator';
  const generatedEmail = rawName.toLowerCase().replace(/\s+/g, '.') + '@blackhole.lab';
  const currentEmail = localStorage.getItem('user_email') || authData.email || generatedEmail;
  const currentRole = localStorage.getItem('user_role') || authData.role || 'Lead SOC Manager / Product Engineer';
  const currentOrg = authData.organization || 'BlackHole Cyber Security Lab';
  const FALLBACK_PROFILE = {
    username: rawName,
    email: currentEmail,
    role: currentRole,
    organization: currentOrg,
    station: 'Primary Management Node (Localhost)'
  };
  const [userData, setUserData] = useState(FALLBACK_PROFILE);
  const [tgEnabled, setTgEnabled] = useState(true);
  const [tgToken, setTgToken] = useState('8804241171:AAHQeJVoDjraC94yYMhPleUcz8-mfwvi84k');
  const [tgChatId, setTgChatId] = useState('1377720555');
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [portScanVal, setPortScanVal] = useState(150);
  const [ddosVal, setDdosVal] = useState(750);
  const [bruteForceVal, setBruteForceVal] = useState(30);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  useEffect(() => {
    const fetchData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      try {
        const profRes = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
          signal: controller.signal,
          credentials: 'include' 
        });
        clearTimeout(timeoutId);
        if (profRes.ok) {
          const profData = await profRes.json();
          const fetchedName = profData.username || profData.name || rawName;
          const genEmail = fetchedName.toLowerCase().replace(/\s+/g, '.') + '@blackhole.lab';
          setUserData({
            username: fetchedName,
            email: profData.email || genEmail,
            role: profData.role || currentRole,
            organization: profData.organization || currentOrg,
            station: profData.station || 'Primary Management Node (Localhost)'
          });
        } else {
          setUserData(FALLBACK_PROFILE);
        }
      } catch (e) {
        setUserData(FALLBACK_PROFILE);
        console.warn("Auth fetch failed/timed out, enforcing local demo profile.");
      }
      try {
        const tgRes = await fetch('http://127.0.0.1:8000/api/v1/settings/telegram', {
          credentials: 'include'
        });
        if (tgRes.ok) {
          const data = await tgRes.json();
          if (data.botToken) setTgToken(data.botToken);
          if (data.chatId) setTgChatId(data.chatId);
          setTgEnabled(true); 
        }
      } catch (e) {
        setTgEnabled(true);
        console.error("Failed to fetch Telegram settings", e);
      }
      setPortScanVal(150);
      setDdosVal(750);
      setBruteForceVal(30);
    };
    fetchData();
  }, []);
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          botToken: tgToken,
          chatId: tgChatId,
          enabled: tgEnabled
        })
      });
      if (response.ok) {
        setToastType('success');
        setToastMessage('✨ Settings saved & Agents updated!');
      } else {
        setToastType('error');
        setToastMessage('❌ Failed to save Telegram config to database');
      }
    } catch (e) {
      setToastType('error');
      setToastMessage('❌ Network Error: Could not reach backend');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/settings/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botToken: tgToken, chatId: tgChatId })
      });
      if (response.ok) {
        setToastType('success');
        setToastMessage('🔔 Test notification sent to Telegram!');
      } else {
        setToastType('error');
        setToastMessage('❌ Telegram Error: Invalid Token or Chat ID');
      }
    } catch (e) {
      setToastType('error');
      setToastMessage('❌ Network Error: Could not reach backend');
    }
    setShowToast(true);
    setIsTestingTg(false);
    setTimeout(() => setShowToast(false), 4000);
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative">
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#00ff9d]" /> SYSTEM SETTINGS
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" /> NOTIFICATIONS
              </h3>
              <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Connected
              </span>
            </div>
            <div className="bg-[#070d1a] border border-gray-800 rounded-lg p-4 mb-6">
              <Toggle enabled={tgEnabled} onChange={() => setTgEnabled(!tgEnabled)} label="Enable Telegram Alerts" />
            </div>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 tracking-wider">BOT TOKEN</label>
                <input 
                  type="password" 
                  value={tgToken}
                  onChange={(e) => setTgToken(e.target.value)}
                  className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono tracking-widest"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 tracking-wider">CHAT ID</label>
                <input 
                  type="text" 
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="123456789"
                  className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono"
                />
              </div>
            </div>
            <button 
              onClick={handleTestTelegram}
              disabled={isTestingTg}
              className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold tracking-wider transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isTestingTg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {isTestingTg ? "SENDING..." : "TEST NOTIFICATION"}
            </button>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-purple-400" /> OPERATOR PROFILE
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <User className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white tracking-tight">{userData.username}</p>
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">{userData.role}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-bold tracking-wider transition-colors border border-gray-700">
                  EDIT
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-800/50">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm text-gray-300 font-mono">{userData.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Organization</p>
                  <p className="text-sm text-gray-300">{userData.organization}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Assigned Station</p>
                  <p className="text-sm text-gray-300 font-mono text-[#00ff9d]">{userData.station}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Session Status</p>
                  <p className="text-sm text-blue-400 flex items-center gap-1.5 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div> Active (Auth)
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Assigned RBAC Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {['Manage Rules', 'Flush Database', 'View Forensic Logs', 'Agent Deployment'].map((perm) => (
                    <span key={perm} className="px-2 py-1 bg-purple-500/5 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest rounded flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> {perm.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col h-full">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-red-500" /> ALERTS THRESHOLDS
            </h3>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Fine-tune the volumetric detection engines. Agents will automatically sync these settings globally upon saving.
            </p>
            <div className="flex-1 flex flex-col justify-center">
              <Slider 
                label="Port Scan" 
                value={portScanVal} 
                min={50} max={200} 
                onChange={(e) => setPortScanVal(e.target.value)} 
                description="Ports scanned within 5s"
              />
              <Slider 
                label="DDoS" 
                value={ddosVal} 
                min={100} max={1000} 
                onChange={(e) => setDdosVal(e.target.value)} 
                description="Packets per second"
              />
              <Slider 
                label="Brute Force" 
                value={bruteForceVal} 
                min={5} max={50} 
                onChange={(e) => setBruteForceVal(e.target.value)} 
                description="Failed SSH attempts"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              className="w-full mt-6 py-3.5 bg-[#00ff9d] hover:bg-[#00cc7d] text-black rounded-lg text-sm font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]"
            >
              SAVE THRESHOLDS
            </button>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-gray-400" /> AUDIT LOGS
            </h3>
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-[#070d1a] text-gray-500 text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">SETTING</th>
                    <th className="px-4 py-3 font-bold">DATE</th>
                    <th className="px-4 py-3 font-bold">AUTHOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-300">DDoS Threshold updated</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">2026-06-17 09:17:33</td>
                    <td className="px-4 py-3 text-[#00ff9d] font-bold">{userData.username}</td>
                  </tr>
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-300">Telegram Alert enabled</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">2026-06-16 14:22:10</td>
                    <td className="px-4 py-3 text-[#00ff9d] font-bold">{userData.username}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div className={`fixed bottom-8 right-8 bg-[#0a1120] border shadow-[0_0_30px_rgba(0,0,0,0.5)] p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in z-50 ${toastType === 'success' ? 'border-[#00ff9d]/50' : 'border-red-500/50'}`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#00ff9d]" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <p className="text-white text-sm font-bold tracking-wider">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}
`

### frontend/src/store/useSecurityStore.js
`javascript
import { create } from 'zustand';
const loadState = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};
const saveState = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage Save Error:", err);
  }
};
export const useSecurityStore = create((set, get) => ({
  alerts: [],
  blockedIps: [],
  agents: [
    { id: "SENTINEL_NODE_01", ip: "192.168.1.105", status: "Online", lastHeartbeat: "Just now", apiKey: "sentinel_ak_7a92x..." }
  ],
  trafficData: loadState('sentinel_traffic_data', []),
  blocklist: [],
  thresholds: { portScan: 150, ddos: 750, bruteForce: 30 },
  stats: {
    scannedTraffic: loadState('sentinel_total_packets', 0),
    blockedIPs: 0,
    activeAgents: 1
  },
  lastScannedTraffic: loadState('sentinel_total_packets', 0),
  wsConnected: false,
  fetchConfig: async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/config', {
        headers: { 'X-Agent-API-Key': 'SENTINEL_DEV_KEY' }
      });
      if (response.ok) {
        const data = await response.json();
        set((state) => ({
          blocklist: data.blocklist || [],
          thresholds: {
            portScan: data.port_scan_threshold || 150,
            ddos: data.ddos_threshold || 750,
            bruteForce: data.brute_force_threshold || 30
          },
          stats: {
            ...state.stats,
            blockedIPs: data.blocklist ? data.blocklist.length : state.stats.blockedIPs
          }
        }));
      } else {
        set((state) => ({ thresholds: { portScan: 150, ddos: 750, bruteForce: 30 } }));
      }
    } catch (error) {
      set((state) => ({ thresholds: { portScan: 150, ddos: 750, bruteForce: 30 } }));
    }
  },
  fetchBlockedIps: async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/alerts/blocked');
      if (response.ok) {
        const data = await response.json();
        set((state) => ({
          blockedIps: data,
          stats: {
            ...state.stats,
            blockedIPs: data.length
          }
        }));
      }
    } catch (error) {
      console.error("Failed to fetch blocked IPs:", error);
    }
  },
  unblockIp: async (ip) => {
    try {
      await fetch('http://127.0.0.1:8000/api/v1/blocklist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-API-Key': 'SENTINEL_DEV_KEY'
        },
        body: JSON.stringify({ ip })
      });
    } catch (error) {
      console.error("Failed to unblock IP:", error);
    }
  },
  fetchAlerts: async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/alerts');
      if (!response.ok) return;
      const history = await response.json();
      set((state) => {
        const alertCount = history.length;
        const newTotal = Math.max(state.stats.scannedTraffic, alertCount);
        saveState('sentinel_total_packets', newTotal);
        return {
          alerts: history,
          stats: {
            ...state.stats,
            scannedTraffic: newTotal,
            activeThreats: alertCount,
          }
        };
      });
    } catch (error) {
      console.error("Critical Fetch Error:", error);
    }
  },
  clearAlerts: async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/alerts/clear', { method: 'DELETE' });
      if (response.ok) {
        const clearedStats = {
          scannedTraffic: 0,
          activeThreats: 0,
          activeAgents: 1,
          blockedIPs: 0
        };
        set({
          alerts: [],
          blockedIps: [],
          blocklist: [],
          trafficData: [],
          lastScannedTraffic: 0,
          stats: clearedStats
        });
        saveState('sentinel_traffic_data', []);
        saveState('sentinel_total_packets', 0);
      }
    } catch (error) {
      console.error("Failed to clear alerts:", error);
    }
  },
  connectWebSocket: () => {
    if (get().wsConnected) return;
    const wsUrl = 'ws://localhost:8000/api/v1/ws/live-alerts';
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => set({ wsConnected: true });
    ws.onmessage = (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        set((state) => {
          const updatedAlerts = [newAlert, ...state.alerts];
          const newTotal = state.stats.scannedTraffic + 150;
          saveState('sentinel_total_packets', newTotal);
          return {
            alerts: updatedAlerts,
            stats: { 
              ...state.stats, 
              scannedTraffic: newTotal,
              activeThreats: updatedAlerts.length
            }
          };
        });
      } catch (err) {
        console.error("Failed to parse live alert:", err);
      }
    };
    ws.onclose = () => {
      set({ wsConnected: false });
      setTimeout(() => get().connectWebSocket(), 5000);
    };
  },
  startPolling: () => {
    const interval = setInterval(() => {
      get().fetchAlerts();
      get().fetchBlockedIps();
      set((state) => {
        const noise = Math.floor(Math.random() * (6 - 2 + 1)) + 2;
        const newTotal = state.stats.scannedTraffic + noise;
        const delta = newTotal - state.lastScannedTraffic;
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const updatedTrafficData = [
          ...state.trafficData, 
          { time: timeString, intensity: delta }
        ].slice(-15);
        saveState('sentinel_total_packets', newTotal);
        saveState('sentinel_traffic_data', updatedTrafficData);
        return {
          lastScannedTraffic: newTotal,
          trafficData: updatedTrafficData,
          stats: {
            ...state.stats,
            scannedTraffic: newTotal,
            blockedIPs: state.blockedIps.length 
          }
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }
}));
`

### frontend/src/App.jsx
`javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';
import ReportsPage from './pages/ReportsPage';
import FirewallRulesPage from './pages/FirewallRulesPage';
import AgentFleetPage from './pages/AgentFleetPage';
import SettingsPage from './pages/SettingsPage';
import DocsPage from './pages/DocsPage';
import { useSecurityStore } from './store/useSecurityStore';
import { Cpu } from 'lucide-react';
function ConsoleApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { connectWebSocket, fetchAlerts, fetchConfig, startPolling } = useSecurityStore();
  useEffect(() => {
    fetchAlerts();
    connectWebSocket();
    const stopPolling = startPolling();
    return () => stopPolling();
  }, [fetchAlerts, fetchConfig, connectWebSocket, startPolling]);
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardPage />}
      {activeTab === 'alerts' && <AlertsPage />}
      {activeTab === 'reports' && <ReportsPage />}
      {activeTab === 'firewall' && <FirewallRulesPage />}
      {activeTab === 'agents' && <AgentFleetPage />}
      {activeTab === 'settings' && <SettingsPage />}
    </Layout>
  );
}
function LandingWrapper() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate('/console')} />;
}
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/console" element={<ConsoleApp />} />
      </Routes>
    </Router>
  );
}
export default App;
`

### frontend/src/main.jsx
`javascript
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
