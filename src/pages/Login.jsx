import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = btoa(`${email || 'hadhy@spotundoo.local'}:${password || 'demo123'}`);
    localStorage.setItem('jwt', token);
    if (onLogin) onLogin();
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] max-w-[420px] mx-auto px-4 py-6 flex flex-col justify-between font-sans">
      {/* ── Top Hero Card ── */}
      <div className="space-y-3">
        {/* Top Header Pill Row */}
        <div className="flex items-center justify-between pt-1">
          <img
            src="/logo.png"
            alt="spot-undoo"
            className="h-9 w-auto object-contain"
          />
          <span className="bg-white border-[2px] border-black rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-[0_2px_0_0_#000000]">
            GO LOCAL!
          </span>
        </div>

        {/* Illustrated S-Curve Map Mini Banner */}
        <div className="relative bg-white border-[2.5px] border-black rounded-3xl p-4 shadow-[0_4px_0_0_#000000] overflow-hidden min-h-[140px] flex items-center justify-between">
          {/* Subtle River Path SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 320 140"
            preserveAspectRatio="none"
          >
            <path
              d="M 20 110 C 80 120, 100 30, 180 60 S 260 20, 310 40"
              fill="none"
              stroke="#BAE6FD"
              strokeWidth="22"
              strokeLinecap="round"
            />
            <path
              d="M 20 110 C 80 120, 100 30, 180 60 S 260 20, 310 40"
              fill="none"
              stroke="#0B3BF4"
              strokeWidth="3"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </svg>

          {/* Pill 1: Hidden Nature */}
          <div className="relative z-10 bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 shadow-[0_2px_0_0_#000000]">
            <span className="text-xs">🌿</span>
            <span className="text-[11px] font-black text-black">Hidden nature</span>
          </div>

          {/* Central Map Pin Icon */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-400 border-[2.5px] border-black flex items-center justify-center shadow-[0_2px_0_0_#000000]">
              <span className="text-base font-black">📍</span>
            </div>
            <div className="w-4 h-1 bg-black/20 rounded-full blur-[1px] mt-0.5" />
          </div>

          {/* Pill 2: Local Bites */}
          <div className="relative z-10 bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 shadow-[0_2px_0_0_#000000]">
            <span className="text-xs">🍴</span>
            <span className="text-[11px] font-black text-black">Local bites</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="pt-2">
          <h1 className="text-3xl font-black text-black tracking-tight leading-tight">
            Welcome back,
          </h1>
          <p className="text-xs font-semibold text-gray-600 mt-1 leading-relaxed">
            Sign in for little detours, local favourites and hidden spots worth finding.
          </p>
        </div>
      </div>

      {/* ── Login Form Card ── */}
      <div className="my-5 bg-white border-[2.5px] border-black rounded-3xl p-5 shadow-[0_5px_0_0_#000000] space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-black block">
              Email address
            </label>
            <div className="relative flex items-center bg-white border-[2px] border-black rounded-2xl px-3 py-2.5 shadow-[0_1.5px_0_0_#000000] focus-within:ring-2 focus-within:ring-[#0B3BF4]">
              <Mail size={16} className="text-black shrink-0 mr-2" strokeWidth={2.2} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs font-bold text-black placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-black block">
              Password
            </label>
            <div className="relative flex items-center bg-white border-[2px] border-black rounded-2xl px-3 py-2.5 shadow-[0_1.5px_0_0_#000000] focus-within:ring-2 focus-within:ring-[#0B3BF4]">
              <Lock size={16} className="text-black shrink-0 mr-2" strokeWidth={2.2} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full text-xs font-bold text-black placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-black hover:text-gray-700 shrink-0 ml-1"
              >
                {showPassword ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={() => alert('Demo login: Any email & password works!')}
              className="text-xs font-black text-[#0B3BF4] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#0B3BF4] hover:bg-blue-700 active:translate-y-0.5 border-[2.5px] border-black rounded-2xl py-3 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_3px_0_0_#000000] transition"
          >
            <span>Sign in</span>
            <ArrowRight size={16} strokeWidth={2.8} />
          </button>
        </form>
      </div>

      {/* ── Footer ── */}
      <div className="text-center space-y-1.5 pb-2">
        <p className="text-xs font-bold text-gray-700">
          New around here?{' '}
          <button
            type="button"
            onClick={handleSubmit}
            className="font-black text-[#0B3BF4] underline cursor-pointer"
          >
            Sign up
          </button>
        </p>
        <p className="text-[11px] font-semibold text-gray-500">
          Nearby adventures. Local bites. Hidden gems.
        </p>
      </div>
    </div>
  );
}
