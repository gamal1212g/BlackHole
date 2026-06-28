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