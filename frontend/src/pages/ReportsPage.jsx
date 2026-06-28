import React, { useState } from 'react';
import { useSecurityStore } from '../store/useSecurityStore';
import { FileText, Printer, Calendar, ChevronDown, Activity, AlertTriangle, ShieldBan, Cpu } from 'lucide-react';
export default function ReportsPage() {
  const { alerts, stats } = useSecurityStore();
  const [reportType, setReportType] = useState('Daily Summary');
  const [dateRange, setDateRange] = useState('Last 7 Days');
  const totalAnalyzed = stats.scannedTraffic || alerts.length * 2750; 
  const blockedEvents = alerts.filter(a => a.analysis?.action === 'BLOCK_IP').length;
  const criticalAlerts = alerts.filter(a => a.analysis?.severity === 'Critical' || a.attack_type?.includes('DDoS')).length;
  const handlePrint = () => {
    window.print();
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <style>{`
        @media print {
          html, body {
            background-color: #0b1322 !important;
            color: #f1f5f9 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-report, #printable-report * {
            visibility: visible !important;
          }
          #printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background-color: #0b1322 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
      <div className="flex items-center gap-3 mb-2 print:hidden">
        <FileText className="w-6 h-6 text-[#00ff9d]" />
        <h2 className="text-2xl font-black text-white tracking-widest">SYSTEM REPORTS</h2>
      </div>
      <div className="bg-[#0d1526] border border-gray-800 p-4 rounded-xl flex flex-wrap items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)] print:hidden">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors appearance-none cursor-pointer"
            >
              <option value="Daily Summary">Daily Summary</option>
              <option value="Weekly Threat Intel">Weekly Threat Intel</option>
              <option value="Compliance Report">Compliance Report</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors appearance-none cursor-pointer"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Current Month">Current Month</option>
            </select>
            <Calendar className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="px-4 py-2 border border-gray-800 rounded-lg text-gray-400 text-sm font-bold tracking-wider">
            10 June - 17 June
          </div>
        </div>
        <button className="px-6 py-2.5 bg-[#00ff9d] hover:bg-[#00cc7d] text-black rounded-lg text-sm font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]">
          GENERATE REPORT
        </button>
      </div>
      <div className="flex justify-between items-end mt-4 print:hidden">
        <h3 className="text-xl font-bold tracking-widest text-white">LIVE REPORT PREVIEW</h3>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-[#00ff9d]/10 border border-[#00ff9d]/50 hover:bg-[#00ff9d]/20 text-[#00ff9d] rounded-lg transition-all shadow-[0_0_15px_rgba(0,255,157,0.1)] font-bold text-sm"
        >
          <Printer className="w-4 h-4" /> 
          Print / Download PDF
        </button>
      </div>
      <div id="printable-report" className="w-full max-w-4xl mx-auto bg-[#0a1120] border border-gray-800 border-t-4 border-t-[#00ff9d] p-8 rounded-xl shadow-2xl">
        <div className="border-b border-gray-800 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-1">
              {reportType.toUpperCase()} REPORT - {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
            </h1>
            <p className="text-sm font-bold text-[#00ff9d] tracking-widest">BLACKHOLE IDS NETWORK SECURITY</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-mono">CONFIDENTIAL</p>
            <p className="text-xs text-gray-500 font-mono mt-1">GENERATED: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">1. Executive Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#070d1a] p-4 rounded-lg border border-gray-800 text-center">
              <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 tracking-wider font-bold mb-1">TOTAL TRAFFIC ANALYZED</p>
              <p className="text-2xl font-black text-white">{totalAnalyzed.toLocaleString()}</p>
            </div>
            <div className="bg-[#070d1a] p-4 rounded-lg border border-gray-800 text-center">
              <ShieldBan className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 tracking-wider font-bold mb-1">BLOCKED EVENTS</p>
              <p className="text-2xl font-black text-white">{blockedEvents}</p>
            </div>
            <div className="bg-[#070d1a] p-4 rounded-lg border border-gray-800 text-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 tracking-wider font-bold mb-1">CRITICAL ALERTS</p>
              <p className="text-2xl font-black text-red-500">{criticalAlerts}</p>
            </div>
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">2. Alert Detailed Log (Top Events)</h2>
          <div className="bg-[#070d1a] rounded-lg border border-gray-800 p-4 font-mono text-sm space-y-3">
            {alerts.slice(0, 4).map((a, i) => (
              <div key={i} className="flex gap-4 border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                <span className="text-gray-500">[{new Date(a.timestamp).toLocaleTimeString()}]</span>
                <span className={a.analysis?.severity === 'Critical' ? 'text-red-400' : 'text-yellow-400'}>
                  {a.attack_type} Mitigation Activated
                </span>
                <span className="text-gray-400 ml-auto">(Source: {a.source_ip})</span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-gray-500 text-center italic py-2">No security events recorded in this period.</div>
            )}
          </div>
        </div>
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">3. Agent Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#070d1a] rounded-lg border border-gray-800 p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Cpu className="w-5 h-5 text-gray-400" />
                 <span className="font-bold text-gray-300">Web-Serv-01</span>
               </div>
               <div className="text-right">
                 <span className="text-[#00ff9d] font-bold text-sm">ACTIVE</span>
                 <p className="text-xs text-gray-500 font-mono mt-0.5">99.9% Uptime</p>
               </div>
            </div>
            <div className="bg-[#070d1a] rounded-lg border border-gray-800 p-4 flex items-center justify-between opacity-70">
               <div className="flex items-center gap-3">
                 <Cpu className="w-5 h-5 text-gray-600" />
                 <span className="font-bold text-gray-500">DB-Replica</span>
               </div>
               <div className="text-right">
                 <span className="text-red-500 font-bold text-sm">OFFLINE</span>
                 <p className="text-xs text-gray-600 font-mono mt-0.5">Last seen 2h ago</p>
               </div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-widest uppercase border-b border-gray-800 pb-2 mb-4">4. Recommended Actions</h2>
          <ul className="space-y-2 list-none">
            <li className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#00ff9d] font-bold">-</span>
              Investigate recurring {alerts.length > 0 ? alerts[0].attack_type : 'DDoS'} sources mapped in the primary logs.
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#00ff9d] font-bold">-</span>
              Update custom rule set for emerging threat signatures observed in the past 24 hours.
            </li>
            <li className="flex gap-3 text-sm text-gray-300">
              <span className="text-[#00ff9d] font-bold">-</span>
              Review network perimeter configurations for offline agent nodes.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}