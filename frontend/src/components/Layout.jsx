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