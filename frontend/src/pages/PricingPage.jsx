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