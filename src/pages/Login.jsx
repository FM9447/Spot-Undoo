import { useState, useRef } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Camera, Image as ImageIcon } from 'lucide-react';
import { getBackendUrl } from '../utils/apiConfig';
import { uploadImageToFirebase } from '../utils/firebaseStorage';
import { signInWithGoogle, signInAnonymously } from '../utils/firebaseAuth';

const AVATAR_PRESETS = [
  { id: 'nomad', label: '🎒 Nomad', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nomad' },
  { id: 'kerala', label: '🌴 Kerala', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kerala' },
  { id: 'chai', label: '☕ Chai', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chai' },
  { id: 'explorer', label: '🧭 Scout', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Explorer' },
];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0].url);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const backendUrl = getBackendUrl();

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (onLogin) onLogin();
    } catch (err) {
      console.warn('Google sign in error:', err);
      setErrorMsg(err.message || 'Google sign-in was cancelled or failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setErrorMsg('');
    setAnonLoading(true);
    try {
      await signInAnonymously();
      if (onLogin) onLogin();
    } catch (err) {
      console.warn('Anonymous sign in error:', err);
      // Fallback to local guest if network fails
      const guestUser = {
        name: 'Anonymous Tester',
        email: `anon_${Date.now().toString(36)}@spotundoo.test`,
        avatar: '/profile.png',
        isAnonymous: true,
      };
      localStorage.setItem('currentUser', JSON.stringify(guestUser));
      localStorage.setItem('jwt', 'guest_bypass_' + Date.now());
      if (onLogin) onLogin();
    } finally {
      setAnonLoading(false);
    }
  };

  const handleCustomAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setAvatar(compressed);

        // Upload to Firebase Cloud Storage
        try {
          const firebaseUrl = await uploadImageToFirebase(compressed, 'avatars');
          if (firebaseUrl) setAvatar(firebaseUrl);
        } catch (err) {
          console.warn('Firebase avatar upload warning:', err);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === 'register') {
        let finalAvatar = avatar;
        if (avatar && avatar.startsWith('data:')) {
          finalAvatar = await uploadImageToFirebase(avatar, 'avatars');
        }

        const res = await fetch(`${backendUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: cleanEmail,
            password,
            avatar: finalAvatar,
          }),
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
      // Local fallback for offline/demo access or when backend isn't reached
      const isOfflineOrHtml =
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('Unexpected token') ||
        err.message.includes('not valid JSON') ||
        err.message.includes('doctype');

      if (isOfflineOrHtml) {
        const fallbackUser = {
          name: name.trim() || 'Local Explorer',
          email: cleanEmail || 'explorer@spotundoo.local',
          avatar: avatar || AVATAR_PRESETS[0].url,
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
    <div className="min-h-screen w-full max-w-md mx-auto px-2.5 sm:px-4 py-4 sm:py-6 flex flex-col justify-between font-sans overflow-x-hidden">
      {/* ── Top Hero Card ── */}
      <div className="space-y-3">
        {/* Top Header Pill Row */}
        <div className="flex items-center justify-between pt-1">
          <img
            src="/logo.png"
            alt="spot-undoo"
            className="h-14 sm:h-16 w-auto object-contain"
          />
          <div className="flex items-center gap-1.5">
            <a
              href="/spot-undoo.apk"
              download="SpotUndoo.apk"
              className="bg-[#10B981] hover:bg-[#059669] text-white border-[2px] border-black rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[0_2px_0_0_#000000] transition active:translate-y-0.5"
            >
              📲 Get APK
            </a>
            <span className="bg-white border-[2px] border-black rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[0_2px_0_0_#000000]">
              {mode === 'login' ? 'GO LOCAL!' : 'JOIN'}
            </span>
          </div>
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
        <div className="pt-3 pb-1">
          <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight leading-tight">
            {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
          </h1>
          <p className="text-sm font-semibold text-gray-700 mt-1 leading-snug">
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
          {/* Profile Picture / Avatar Picker (Only in Register mode) */}
          {mode === 'register' && (
            <div className="space-y-2 pb-1 bg-[#F4F6F9] border-[2px] border-black rounded-2xl p-3 shadow-[0_1.5px_0_0_#000000]">
              <label className="text-[11px] font-black uppercase tracking-wider text-black block">
                Profile Avatar
              </label>
              <div className="flex items-center gap-3">
                {/* Current Avatar Circle with Upload Trigger */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-14 h-14 rounded-full border-[2.5px] border-black bg-white overflow-hidden shadow-[0_2px_0_0_#000000] cursor-pointer group shrink-0"
                  title="Click to upload custom photo"
                >
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatar(preset.url)}
                        className={`px-2 py-1 rounded-xl text-[10px] font-black border transition ${
                          avatar === preset.url
                            ? 'bg-[#0B3BF4] text-white border-black shadow-[0_1.5px_0_0_#000000]'
                            : 'bg-white text-gray-700 border-black/30 hover:border-black'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-1 rounded-xl text-[10px] font-black bg-amber-400 text-black border border-black shadow-[0_1.5px_0_0_#000000] flex items-center gap-1 hover:bg-amber-300"
                    >
                      <Camera size={11} /> Upload
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCustomAvatar}
                  />
                  <p className="text-[10px] text-gray-500 font-semibold mt-1">
                    Select a vibe or tap to upload photo
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-[2px] border-black"></div>
            <span className="flex-shrink mx-2 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-[#F4F6F9] px-2 py-0.5 rounded-full border border-black/30">
              OR QUICK ACCESS
            </span>
            <div className="flex-grow border-t-[2px] border-black"></div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 active:translate-y-0.5 border-[2.5px] border-black rounded-2xl py-2.5 text-black font-black text-xs flex items-center justify-center gap-2.5 shadow-[0_2.5px_0_0_#000000] transition cursor-pointer disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <Loader2 size={16} className="animate-spin text-black" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Anonymous Test Mode Button (Hidden - only visible when ?agent_test=true for agent testing) */}
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('agent_test') === 'true' && (
            <button
              type="button"
              disabled={anonLoading}
              onClick={handleAnonymousSignIn}
              className="w-full bg-[#FEF08A] hover:bg-yellow-200 active:translate-y-0.5 border-[2.5px] border-black rounded-2xl py-2.5 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_2.5px_0_0_#000000] transition cursor-pointer disabled:opacity-60"
            >
              {anonLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-black" />
                  <span>Entering Test Mode...</span>
                </>
              ) : (
                <span>⚡ Agent Test Access Mode</span>
              )}
            </button>
          )}
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
