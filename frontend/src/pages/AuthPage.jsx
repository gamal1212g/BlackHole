import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
export default function AuthPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/console');
  };
  return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#00ff9d] selection:text-black">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(rgba(0, 255, 157, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.15,
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)'
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00ff9d]/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-[420px] p-8 md:p-10 bg-[#0a1120]/95 backdrop-blur-xl border border-[#00ff9d]/20 rounded-2xl shadow-[0_0_60px_-10px_rgba(0,255,157,0.2)] flex flex-col items-center">
        <div className="flex flex-col items-center mb-10">
          <div className="p-3 bg-[#00ff9d]/10 rounded-xl border border-[#00ff9d]/30 mb-4 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
            <Shield className="w-8 h-8 text-[#00ff9d]" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-[#00ff9d] mb-1">BLACKHOLE</h1>
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">Secure Access</p>
        </div>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="profile@i.com"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all placeholder:text-gray-600"
              required
            />
          </div>
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-12 py-3.5 focus:outline-none focus:border-[#00ff9d] focus:shadow-[0_0_10px_rgba(0,255,157,0.1)] transition-all placeholder:text-gray-600 tracking-wider"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#00ff9d] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button 
            type="submit"
            className="w-full mt-2 py-3.5 rounded-lg bg-[#00ff9d] text-black font-black tracking-widest uppercase hover:bg-[#00cc7d] transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-3">
          <a href="#" className="text-sm font-bold text-[#00ff9d] hover:text-white transition-colors">
            Forgot Password?
          </a>
          <p className="text-xs text-gray-500">
            First time here? <button onClick={() => navigate('/register')} className="text-[#00ff9d] hover:underline font-bold ml-1 bg-transparent border-none p-0 cursor-pointer">Request Access</button>
          </p>
        </div>
      </div>
    </div>
  );
}