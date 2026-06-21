======================================================================
PROJECT CONTEXT & ARCHITECTURE MEMO (RESUMING SYSTEM ALIGNMENT)
======================================================================
Project Name: BlackHole IPS (Cyberpunk-themed Security Dashboard)
Stack: FastAPI (Backend), React + Tailwind (Frontend), MongoDB (Database)
Current Deployment Status: Localhost (Live & Fully Functional)

----------------------------------------------------------------------
1. ARCHITECTURAL PATTERNS & CODE STYLE
----------------------------------------------------------------------
• UI Theme: Dark Cyberpunk, high-contrast neon accents, clean micro-interactions.
• Frontend Feedback: Dynamic Toast alerts (Success/Error states), explicit Loading states (using Loader2 spinners) on async buttons to prevent spam clicks.
• Backend Performance: Strict adherence to Non-blocking Async operations. All third-party synchronous HTTP requests (like Telegram API) MUST use `asyncio.to_thread(requests.post, ...)` to keep the FastAPI event loop unblocked.

----------------------------------------------------------------------
2. CURRENT LIVE IMPLEMENTATION (TELEGRAM ROUTING LOOP)
----------------------------------------------------------------------
• Persistence Store: MongoDB collection `system_config` -> Document `{"type": "telegram_settings"}` holds active credentials.
• Current Active Credentials:
  - Bot Token: 8804241171:AAHQeJVoDjraC94yYMhPleUcz8-mfwvi84k
  - Chat ID: 1377720555 (Verified User Chat)
  - Target Bot Username: @MyBlackHoleGuardBot

• Workflow Handlers:
  1. UI Trigger: SettingsPage.jsx captures Token/ID -> fires to `POST /api/v1/settings/test-telegram` for explicit validation -> saves to DB via `POST /api/v1/settings/telegram`.
  2. Live Automation Hook: Injected directly inside `POST /api/v1/alerts/receive` (triggered by Scapy / agent network sniffer).
  3. Processing Logic: When a real packet anomaly is caught, the backend pulls config from MongoDB, compiles a highly-detailed Markdown payload (Attack Type, Source IP, Severity, Timestamp), and dispatches it via `asyncio.to_thread`. If configs are empty, it exits silently without logging errors.

----------------------------------------------------------------------
3. CORE ALIGNMENT TASK (APPLY PREVIOUS IMPLEMENTED MITIGATION)
----------------------------------------------------------------------
We have finalized the IPS Automated Mitigation (IP Dropping) and Dashboard synchronization. Please verify and maintain the following in `backend/routes/agent_routes.py`, `agent/agent.py`, and `frontend/src/pages/DashboardPage.jsx`:

1. IP Packet Drop: `agent/agent.py` must check `packet.haslayer(IP)` at the absolute top of `analyze_packet` and instantly DROP (return) traffic if `src_ip` is in the `blocked_ips_list`.
2. Threat Matrix Severity: The "High Severity" card on the dashboard must dynamically count ONLY volumetric/DoS attacks ('SYN Flood', 'UDP Flood', 'ICMP Flood', 'Smurf Attack', 'Land Attack') to ensure exact matching with the Donut Chart.
3. Live Mitigation Table: The dashboard must retain the split dual-table layout showing "Recent Threats" and "Mitigated Threats" connected to the `/api/v1/alerts/blocked` MongoDB endpoint, polling every 3 seconds.

Read `backend/routes/agent_routes.py`, `agent/agent.py`, and `frontend/src/pages/SettingsPage.jsx`. Maintain all established configurations, tokens, and async threading patterns perfectly. Let's make sure the environment is fully up and synced!
======================================================================