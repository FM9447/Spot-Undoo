import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { getBackendUrl } from '../utils/apiConfig';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const backendUrl = getBackendUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === 'register') {
        const res = await fetch(`${backendUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: cleanEmail, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        localStorage.setItem('jwt', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (onLogin) onLogin();
      } else {
        const res = await fetch(`${backendUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid credentials');

        localStorage.setItem('jwt', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        if (onLogin) onLogin();
      }
    } catch (err) {
      // Local fallback for offline/demo access
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        const fallbackUser = {
          name: name.trim() || 'Local Explorer',
          email: cleanEmail || 'explorer@spotundoo.local',
        };
        const token = btoa(`${fallbackUser.email}:${fallbackUser.name}`);
        localStorage.setItem('jwt', token);
        localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
        if (onLogin) onLogin();
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
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
            {mode === 'login' ? 'GO LOCAL!' : 'JOIN THE CLUB'}
          </span>
        </div>

        {/* Illustrated S-Curve Map Mini Banner */}
        <div className="relative bg-white border-[2.5px] border-black rounded-3xl p-4 shadow-[0_4px_0_0_#000000] overflow-hidden min-h-[140px] flex items-center justify-between">
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

          {/* Pill 1 */}
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

          {/* Pill 2 */}
          <div className="relative z-10 bg-white border-[2px] border-black rounded-full px-3 py-1 flex items-center gap-1.5 shadow-[0_2px_0_0_#000000]">
            <span className="text-xs">🍴</span>
            <span className="text-[11px] font-black text-black">Local bites</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-snug">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-xs font-semibold text-gray-600 mt-1.5 leading-relaxed">
            {mode === 'login'
              ? 'Sign in for little detours, local favourites, and hidden spots worth finding.'
              : 'Join Spot-Undoo to discover secret Kerala gems and save itineraries to cloud history.'}
          </p>
        </div>
      </div>

      {/* ── Auth Form Card ── */}
      <div className="my-4 bg-white border-[2.5px] border-black rounded-3xl p-5 shadow-[0_5px_0_0_#000000] space-y-4">
        {/* Mode Toggle Switcher */}
        <div className="flex bg-[#F4F6F9] border-[2px] border-black rounded-2xl p-1 shadow-[0_1.5px_0_0_#000000]">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition ${
              mode === 'login' ? 'bg-[#0B3BF4] text-white shadow-[0_1.5px_0_0_#000000]' : 'text-gray-600 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition ${
              mode === 'register' ? 'bg-[#0B3BF4] text-white shadow-[0_1.5px_0_0_#000000]' : 'text-gray-600 hover:text-black'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-[1.5px] border-red-500 rounded-xl p-2.5 text-xs font-bold text-red-600">
            ⚠ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name Field (Only in Register mode) */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black text-black block">
                Your full name
              </label>
              <div className="relative flex items-center bg-white border-[2px] border-black rounded-2xl px-3 py-2.5 shadow-[0_1.5px_0_0_#000000] focus-within:ring-2 focus-within:ring-[#0B3BF4]">
                <User size={16} className="text-black shrink-0 mr-2" strokeWidth={2.2} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hadhy Rahman"
                  className="w-full text-xs font-bold text-black placeholder-gray-400 outline-none bg-transparent"
                />
              </div>
            </div>
          )}

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
                placeholder={mode === 'register' ? 'Choose a secure password' : 'Enter your password'}
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

          {/* Forgot Password Link (Only in Login mode) */}
          {mode === 'login' && (
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => alert('Demo recovery: You can sign in with any email or create a new account!')}
                className="text-xs font-black text-[#0B3BF4] hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B3BF4] hover:bg-blue-700 active:translate-y-0.5 border-[2.5px] border-black rounded-2xl py-3 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_3px_0_0_#000000] transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} strokeWidth={2.8} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Footer ── */}
      <div className="text-center space-y-1.5 pb-2">
        <p className="text-xs font-bold text-gray-700">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setErrorMsg('');
            }}
            className="font-black text-[#0B3BF4] underline cursor-pointer"
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
        <p className="text-[11px] font-semibold text-gray-500">
          Nearby adventures. Local bites. Hidden gems.
        </p>
      </div>
    </div>
  );
}
