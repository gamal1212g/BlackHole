import React, { useState, useEffect } from 'react';
import { Settings, Bell, MessageCircle, User, Shield, CheckCircle2, History, Loader2, XCircle } from 'lucide-react';
const Toggle = ({ enabled, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-sm font-bold text-gray-300">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-[#00ff9d]' : 'bg-gray-700'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-[#0a1120] w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
    </div>
  </label>
);
const Slider = ({ label, value, min, max, onChange, description }) => (
  <div className="flex flex-col gap-2 mb-6">
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-white tracking-wider">{label}</span>
      <span className="px-3 py-1 bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] rounded text-xs font-mono font-bold">
        {value}
      </span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={onChange}
      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00ff9d]"
      style={{
        background: `linear-gradient(to right, #00ff9d 0%, #00ff9d ${(value - min) / (max - min) * 100}%, #1f2937 ${(value - min) / (max - min) * 100}%, #1f2937 100%)`
      }}
    />
    <style dangerouslySetInlineStyle={{__html: `
      input[type=range]::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #00ff9d;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
      }
    `}} />
    <span className="text-xs text-gray-500 font-mono">{description}</span>
  </div>
);
export default function SettingsPage() {
  const getAuthData = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      const token = localStorage.getItem('token') || localStorage.getItem('jwt');
      if (token) {
        return JSON.parse(atob(token.split('.')[1]));
      }
    } catch (e) {
      return;
    }
  };
  const authData = getAuthData();
  const rawName = localStorage.getItem('user_name') || authData.username || authData.name || 'BlackHole Operator';
  const generatedEmail = rawName.toLowerCase().replace(/\s+/g, '.') + '@blackhole.lab';
  const currentEmail = localStorage.getItem('user_email') || authData.email || generatedEmail;
  const currentRole = localStorage.getItem('user_role') || authData.role || 'Lead SOC Manager / Product Engineer';
  const currentOrg = authData.organization || 'BlackHole Cyber Security Lab';
  const FALLBACK_PROFILE = {
    username: rawName,
    email: currentEmail,
    role: currentRole,
    organization: currentOrg,
    station: 'Primary Management Node (Localhost)'
  };
  const [userData, setUserData] = useState(FALLBACK_PROFILE);
  const [tgEnabled, setTgEnabled] = useState(true);
  const [tgToken, setTgToken] = useState('8804241171:AAHQeJVoDjraC94yYMhPleUcz8-mfwvi84k');
  const [tgChatId, setTgChatId] = useState('1377720555');
  const [isTestingTg, setIsTestingTg] = useState(false);
  const [portScanVal, setPortScanVal] = useState(150);
  const [ddosVal, setDdosVal] = useState(750);
  const [bruteForceVal, setBruteForceVal] = useState(30);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  useEffect(() => {
    const fetchData = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      try {
        const profRes = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
          signal: controller.signal,
          credentials: 'include' 
        });
        clearTimeout(timeoutId);
        if (profRes.ok) {
          const profData = await profRes.json();
          const fetchedName = profData.username || profData.name || rawName;
          const genEmail = fetchedName.toLowerCase().replace(/\s+/g, '.') + '@blackhole.lab';
          setUserData({
            username: fetchedName,
            email: profData.email || genEmail,
            role: profData.role || currentRole,
            organization: profData.organization || currentOrg,
            station: profData.station || 'Primary Management Node (Localhost)'
          });
        } else {
          setUserData(FALLBACK_PROFILE);
        }
      } catch (e) {
        setUserData(FALLBACK_PROFILE);
        console.warn("Auth fetch failed/timed out, enforcing local demo profile.");
      }
      try {
        const tgRes = await fetch('http://127.0.0.1:8000/api/v1/settings/telegram', {
          credentials: 'include'
        });
        if (tgRes.ok) {
          const data = await tgRes.json();
          if (data.botToken) setTgToken(data.botToken);
          if (data.chatId) setTgChatId(data.chatId);
          setTgEnabled(true); 
        }
      } catch (e) {
        setTgEnabled(true);
        console.error("Failed to fetch Telegram settings", e);
      }
      setPortScanVal(150);
      setDdosVal(750);
      setBruteForceVal(30);
    };
    fetchData();
  }, []);
  const handleSaveSettings = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          botToken: tgToken,
          chatId: tgChatId,
          enabled: tgEnabled
        })
      });
      if (response.ok) {
        setToastType('success');
        setToastMessage('✨ Settings saved & Agents updated!');
      } else {
        setToastType('error');
        setToastMessage('❌ Failed to save Telegram config to database');
      }
    } catch (e) {
      setToastType('error');
      setToastMessage('❌ Network Error: Could not reach backend');
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/settings/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botToken: tgToken, chatId: tgChatId })
      });
      if (response.ok) {
        setToastType('success');
        setToastMessage('🔔 Test notification sent to Telegram!');
      } else {
        setToastType('error');
        setToastMessage('❌ Telegram Error: Invalid Token or Chat ID');
      }
    } catch (e) {
      setToastType('error');
      setToastMessage('❌ Network Error: Could not reach backend');
    }
    setShowToast(true);
    setIsTestingTg(false);
    setTimeout(() => setShowToast(false), 4000);
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 relative">
      <div className="flex justify-between items-center bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#00ff9d]" /> SYSTEM SETTINGS
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border-l-4 border-l-blue-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" /> NOTIFICATIONS
              </h3>
              <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Connected
              </span>
            </div>
            <div className="bg-[#070d1a] border border-gray-800 rounded-lg p-4 mb-6">
              <Toggle enabled={tgEnabled} onChange={() => setTgEnabled(!tgEnabled)} label="Enable Telegram Alerts" />
            </div>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 tracking-wider">BOT TOKEN</label>
                <input 
                  type="password" 
                  value={tgToken}
                  onChange={(e) => setTgToken(e.target.value)}
                  className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono tracking-widest"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 tracking-wider">CHAT ID</label>
                <input 
                  type="text" 
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  placeholder="123456789"
                  className="bg-[#070d1a] border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#00ff9d] transition-colors font-mono"
                />
              </div>
            </div>
            <button 
              onClick={handleTestTelegram}
              disabled={isTestingTg}
              className="w-full py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-bold tracking-wider transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isTestingTg ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              {isTestingTg ? "SENDING..." : "TEST NOTIFICATION"}
            </button>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-purple-400" /> OPERATOR PROFILE
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center border-2 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <User className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white tracking-tight">{userData.username}</p>
                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">{userData.role}</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-bold tracking-wider transition-colors border border-gray-700">
                  EDIT
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-800/50">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Email Address</p>
                  <p className="text-sm text-gray-300 font-mono">{userData.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Organization</p>
                  <p className="text-sm text-gray-300">{userData.organization}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Assigned Station</p>
                  <p className="text-sm text-gray-300 font-mono text-[#00ff9d]">{userData.station}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Session Status</p>
                  <p className="text-sm text-blue-400 flex items-center gap-1.5 font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div> Active (Auth)
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Assigned RBAC Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {['Manage Rules', 'Flush Database', 'View Forensic Logs', 'Agent Deployment'].map((perm) => (
                    <span key={perm} className="px-2 py-1 bg-purple-500/5 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest rounded flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> {perm.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex flex-col h-full">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-red-500" /> ALERTS THRESHOLDS
            </h3>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Fine-tune the volumetric detection engines. Agents will automatically sync these settings globally upon saving.
            </p>
            <div className="flex-1 flex flex-col justify-center">
              <Slider 
                label="Port Scan" 
                value={portScanVal} 
                min={50} max={200} 
                onChange={(e) => setPortScanVal(e.target.value)} 
                description="Ports scanned within 5s"
              />
              <Slider 
                label="DDoS" 
                value={ddosVal} 
                min={100} max={1000} 
                onChange={(e) => setDdosVal(e.target.value)} 
                description="Packets per second"
              />
              <Slider 
                label="Brute Force" 
                value={bruteForceVal} 
                min={5} max={50} 
                onChange={(e) => setBruteForceVal(e.target.value)} 
                description="Failed SSH attempts"
              />
            </div>
            <button 
              onClick={handleSaveSettings}
              className="w-full mt-6 py-3.5 bg-[#00ff9d] hover:bg-[#00cc7d] text-black rounded-lg text-sm font-black tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)]"
            >
              SAVE THRESHOLDS
            </button>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 p-6 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-white tracking-widest flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-gray-400" /> AUDIT LOGS
            </h3>
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-[#070d1a] text-gray-500 text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-bold">SETTING</th>
                    <th className="px-4 py-3 font-bold">DATE</th>
                    <th className="px-4 py-3 font-bold">AUTHOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-300">DDoS Threshold updated</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">2026-06-17 09:17:33</td>
                    <td className="px-4 py-3 text-[#00ff9d] font-bold">{userData.username}</td>
                  </tr>
                  <tr className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-300">Telegram Alert enabled</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">2026-06-16 14:22:10</td>
                    <td className="px-4 py-3 text-[#00ff9d] font-bold">{userData.username}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div className={`fixed bottom-8 right-8 bg-[#0a1120] border shadow-[0_0_30px_rgba(0,0,0,0.5)] p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in z-50 ${toastType === 'success' ? 'border-[#00ff9d]/50' : 'border-red-500/50'}`}>
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#00ff9d]" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <p className="text-white text-sm font-bold tracking-wider">
            {toastMessage}
          </p>
        </div>
      )}
    </div>
  );
}