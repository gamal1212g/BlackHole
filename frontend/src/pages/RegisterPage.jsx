import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, User, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      // Create mock user object
      const mockUser = {
        username: username || (localStorage.getItem('user_name') || 'BlackHole Operator'),
        email: email || (localStorage.getItem('user_email') || 'admin@blackhole.lab'),
        role: 'Lead SOC Manager / Product Engineer',
        organization: 'BlackHole Cyber Security Lab',
        station: 'Primary Management Node (Localhost)'
      };

      // Save to localStorage to simulate persistent login
      localStorage.setItem('blackhole_auth_active', 'true');
      localStorage.setItem('blackhole_user_profile', JSON.stringify(mockUser));
      localStorage.setItem('user_name', username);
      localStorage.setItem('user_email', email);

      alert("✨ Account Provisioned! Redirecting to Management Console...");
      setIsLoading(false);
      navigate('/console');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center relative overflow-hidden font-sans selection:bg-[#00ff9d] selection:text-black">
      
      {/* Dynamic Network Background Overlay */}
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

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-[420px] p-8 md:p-10 bg-[#0a1120]/95 backdrop-blur-xl border border-[#00ff9d]/20 rounded-2xl shadow-[0_0_60px_-10px_rgba(0,255,157,0.2)] flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="p-3 bg-[#00ff9d]/10 rounded-xl border border-[#00ff9d]/30 mb-4 shadow-[0_0_20px_rgba(0,255,157,0.2)]">
            <Shield className="w-8 h-8 text-[#00ff9d]" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-[#00ff9d] mb-1">BLACKHOLE</h1>
          <p className="text-sm font-bold tracking-widest text-gray-500 uppercase">Deploy Agent Node</p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleRegister} className="w-full flex flex-col gap-5">
          
          {/* Username Input */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Display Name"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#00ff9d] transition-all placeholder:text-gray-600"
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@blackhole.lab"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#00ff9d] transition-all placeholder:text-gray-600"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#00ff9d] transition-colors" />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#050b14] border border-gray-700 text-white text-sm rounded-lg pl-12 pr-12 py-3.5 focus:outline-none focus:border-[#00ff9d] transition-all placeholder:text-gray-600 tracking-wider"
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

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-lg bg-[#00ff9d] text-black font-black tracking-widest uppercase hover:bg-[#00cc7d] transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] disabled:opacity-50"
          >
            {isLoading ? "PROVISIONING..." : "Register Account"}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6">
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#00ff9d] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Secure Sign In
          </button>
        </div>
      </div>

    </div>
  );
}
