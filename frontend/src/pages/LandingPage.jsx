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