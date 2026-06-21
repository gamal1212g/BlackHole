import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { ShieldAlert, Plus, Trash2, Unlock, ShieldCheck, Server } from 'lucide-react';

export default function FirewallRulesPage() {
  const { blocklist, unblockIp, fetchConfig } = useSecurityStore();
  
  // Local state for Quick Add Form
  const [targetIp, setTargetIp] = useState('');
  const [port, setPort] = useState('');
  const [protocol, setProtocol] = useState('ALL');
  const [action, setAction] = useState('BLOCK');

  // Mock Active Policies (for demo purposes)
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
    
    // In a real app, this would post to a /rules endpoint
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
      
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3">
            <Server className="w-6 h-6 text-[#00ff9d]" /> FIREWALL RULES & POLICIES
          </h2>
        </div>
      </div>

      {/* Top Bar (Quick Add Rule) */}
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

      {/* Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Column: Active Policies (60%) */}
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

        {/* Right Column: Automated Blocklist (40%) */}
        <div className="xl:w-2/5 bg-[#0d1526] border border-red-500/30 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col relative overflow-hidden">
          {/* Subtle red glow in the corner */}
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
