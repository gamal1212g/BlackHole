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