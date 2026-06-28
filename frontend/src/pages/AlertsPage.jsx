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