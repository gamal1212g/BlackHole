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