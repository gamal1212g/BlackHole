import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, CreditCard, CheckCircle, ChevronLeft, Lock } from 'lucide-react';
export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan || 'Enterprise';
  const price = location.state?.price || 499;
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < value.length; i += 4) {
      parts.push(value.substring(i, i + 4));
    }
    setCardNumber(parts.length > 1 ? parts.join(' ') : value);
  };
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value);
  };
  const handleCheckout = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/console');
      }, 2000);
    }, 2500);
  };
  return (
    <div className="min-h-screen bg-[#070d1a] text-white flex flex-col font-sans selection:bg-[#00ff9d] selection:text-black">
      <nav className="border-b border-gray-800/60 bg-[#0d1526]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <Shield className="w-6 h-6 text-[#00ff9d]" />
            <span className="font-bold tracking-widest text-lg">BLACKHOLE</span>
          </div>
          <button 
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" /> BACK TO PRICING
          </button>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-3xl font-black mb-2">SECURE CHECKOUT</h1>
              <p className="text-gray-400">Complete your transaction via the BlackHole encrypted gateway.</p>
            </div>
            <div className="relative w-full max-w-md aspect-[1.586/1] rounded-2xl p-6 overflow-hidden border border-[#00ff9d]/30 shadow-[0_0_40px_rgba(0,255,157,0.15)] bg-gradient-to-br from-[#0d1526] to-[#0a101d]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <CreditCard className="w-10 h-10 text-[#00ff9d]/70" />
                  <span className="font-mono text-sm tracking-widest text-gray-400">BLACKHOLE SECURE</span>
                </div>
                <div className="mt-4">
                  <div className="font-mono text-2xl tracking-[0.2em] text-gray-200 mb-2 min-h-[32px]">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 tracking-widest">CARDHOLDER</span>
                      <span className="font-bold tracking-wider text-sm uppercase min-h-[20px]">
                        {name || 'JANE DOE'}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-500 tracking-widest">EXPIRES</span>
                      <span className="font-mono text-sm tracking-wider min-h-[20px]">
                        {expiry || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0d1526] border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-gray-400 tracking-widest mb-4 border-b border-gray-800 pb-4">ORDER SUMMARY</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-bold">{plan} License</span>
                <span className="text-white">${price}.00</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>Billed monthly</span>
                <span>Includes global nodes</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                <span className="font-bold tracking-wider text-[#00ff9d]">TOTAL DUE</span>
                <span className="text-2xl font-black text-[#00ff9d]">${price}.00</span>
              </div>
            </div>
          </div>
          <div className="bg-[#0d1526] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {isSuccess && (
              <div className="absolute inset-0 z-50 bg-[#070d1a]/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-20 h-20 rounded-full bg-[#00ff9d]/20 flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-[#00ff9d]" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-wide">PAYMENT AUTHORIZED</h2>
                <p className="text-[#00ff9d] font-mono text-sm mb-8">Accessing Global Console...</p>
                <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00ff9d] animate-[loading_2s_ease-in-out_forwards]"></div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 mb-8 text-gray-400 border-b border-gray-800 pb-4">
              <Lock className="w-4 h-4 text-[#00ff9d]" />
              <span className="text-xs font-mono tracking-widest">256-BIT ENCRYPTION ACTIVE</span>
            </div>
            <form onSubmit={handleCheckout} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider">CARDHOLDER NAME</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="JANE DOE"
                  className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors uppercase font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider">CARD NUMBER</label>
                <input 
                  type="text" 
                  required
                  maxLength="19"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 tracking-wider">EXPIRY DATE</label>
                  <input 
                    type="text" 
                    required
                    maxLength="5"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm text-center"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 tracking-wider">CVV</label>
                  <input 
                    type="password" 
                    required
                    maxLength="4"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••"
                    className="bg-[#070d1a] border border-gray-700 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff9d] transition-colors font-mono text-sm text-center tracking-widest"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isProcessing || isSuccess}
                className="mt-4 w-full py-4 rounded-lg bg-[#00ff9d] text-black font-black tracking-widest hover:bg-[#00cc7d] transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] disabled:opacity-70 disabled:cursor-wait relative overflow-hidden group"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    PROCESSING VIA GATEWAY...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" /> AUTHORIZE SECURE PAYMENT
                  </span>
                )}
                <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12 z-0"></div>
              </button>
            </form>
          </div>
        </div>
      </main>
      <style dangerouslySetInlineStyle={{__html: `
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}