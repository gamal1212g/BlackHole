import React from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Bell, AlertTriangle, ShieldBan } from 'lucide-react';

export default function DashboardPage() {
  const { trafficData, alerts, blockedIps, stats, scannedTraffic, activeThreats, clearAlerts } = useSecurityStore();
  
  const highSeverityCount = alerts.filter(a => {
    const highImpactAttacks = ['SYN Flood', 'UDP Flood', 'ICMP Flood', 'Smurf Attack', 'Land Attack'];
    return highImpactAttacks.includes(a.attack_type);
  }).length;
  
  const blockedIpsCount = stats?.blockedIPs || 0;

  const attackTypes = alerts.reduce((acc, a) => {
    let type = a.attack_type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  let distributionData = Object.entries(attackTypes).map(([name, value]) => ({ name, value }));
  
  const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#d946ef', '#f43f5e', '#94a3b8'];

  const handleBlockIp = async (ip) => {
    try {
      await fetch('http://127.0.0.1:8000/api/v1/blocklist/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Agent-API-Key': 'BLACKHOLE_DEV_KEY'},
        body: JSON.stringify({ ip, reason: "Manual Block from Dashboard" })
      });
      console.log(`IP ${ip} blocked successfully.`);
    } catch (error) {
      console.error("Failed to block IP:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-l-4 border-l-[#00ff9d]">
        <h3 className="text-xl font-black text-white tracking-widest flex items-center gap-3">
          <Activity className="w-6 h-6 text-[#00ff9d]" /> BlackHole Control Center
        </h3>
        <button onClick={clearAlerts} className="px-6 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-black tracking-widest rounded border border-red-500/30 transition-all uppercase">
          Reset Demo / Clear Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div>
            <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">Total Packets</p>
            <h3 className="text-3xl font-black text-white">{(stats?.scannedTraffic || 0).toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div>
            <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">Total Alerts</p>
            <h3 className="text-3xl font-black text-white">{alerts.length.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-[#00ff9d]/10 rounded-lg border border-[#00ff9d]/20">
            <Bell className="w-8 h-8 text-[#00ff9d]" />
          </div>
        </div>

        <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-b-2 border-b-red-500">
          <div>
            <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">High Severity</p>
            <h3 className="text-3xl font-black text-red-500">{highSeverityCount.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div>
            <p className="text-gray-400 text-sm font-bold tracking-wider mb-1">Blocked IPs</p>
            <h3 className="text-3xl font-black text-yellow-500">{blockedIpsCount}</h3>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <ShieldBan className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-white font-bold tracking-wider">Traffic Flow</h4>
            <span className="text-xs text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-1 rounded border border-[#00ff9d]/20">LIVE</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#4b5563" fontSize={12} tickMargin={10} />
                <YAxis stroke="#4b5563" fontSize={12} tickMargin={10} />
                <Tooltip contentStyle={{ backgroundColor: '#070d1a', borderColor: '#1f2937', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#00ff9d' }} />
                <Area type="monotone" dataKey="intensity" stroke="#00ff9d" strokeWidth={2} fillOpacity={1} fill="url(#colorIntensity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col">
          <h4 className="text-white font-bold tracking-wider mb-6">Attack Distribution</h4>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#070d1a', borderColor: '#1f2937', color: '#fff', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{alerts.length}</span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            {distributionData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1526] border border-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h4 className="text-white font-bold tracking-wider">Recent Threats</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#070d1a] text-gray-500 text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">TIMESTAMP</th>
                  <th className="px-6 py-4 font-bold">SOURCE IP</th>
                  <th className="px-6 py-4 font-bold">ATTACK TYPE</th>
                  <th className="px-6 py-4 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No recent threats detected.</td>
                  </tr>
                ) : (
                  alerts.slice(0, 5).map((alert, index) => (
                    <tr key={index} className="hover:bg-gray-800/20 transition-colors group">
                      <td className="px-6 py-4 text-gray-400">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td className="px-6 py-4 text-orange-400 font-mono font-bold">{alert.source_ip}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">{alert.attack_type}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleBlockIp(alert.source_ip)} className="px-4 py-1.5 bg-gray-800 hover:bg-red-500 hover:text-white text-gray-300 text-xs font-bold rounded transition-colors border border-gray-700 hover:border-red-500 opacity-0 group-hover:opacity-100">
                          Block IP
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#0d1526] border border-gray-800 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex items-center gap-2">
            <ShieldBan className="w-5 h-5 text-yellow-500" />
            <h4 className="text-white font-bold tracking-wider">Mitigated Threats</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#070d1a] text-gray-500 text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">BLOCKED IP</th>
                  <th className="px-6 py-4 font-bold">REASON / ATTACK</th>
                  <th className="px-6 py-4 font-bold text-right">BLOCKED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {blockedIps.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No active blocks enforced.</td>
                  </tr>
                ) : (
                  blockedIps.slice(0, 5).map((block, index) => (
                    <tr key={index} className="hover:bg-yellow-500/5 transition-colors">
                      <td className="px-6 py-4 text-yellow-500 font-mono font-bold">{block.ip}</td>
                      <td className="px-6 py-4 text-gray-300">{block.reason}</td>
                      <td className="px-6 py-4 text-right text-gray-500">{block.blocked_at}</td>
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