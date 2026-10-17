import { useState, useEffect } from 'react';
import { Cpu, Globe, MapPin, Trash2, CheckCircle2, Loader2, Navigation, X, Settings, LogOut } from 'lucide-react';

export default function Header({ location, setLocation, settings, setSettings, gpsStatus = 'idle', onRefreshGPS, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${h}:${m} ${now.getHours() >= 12 ? 'PM' : 'AM'}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleClear = () => {
    localStorage.removeItem('userSpots');
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <>
      {/* ── Main Header Bar ── */}
      <header className="w-full bg-white border-[2.5px] border-black rounded-2xl px-4 py-3 flex items-center justify-between shadow-[0_4px_0_0_#0B3BF4] mb-3">
        {/* Left: Logo */}
        <img
          src="/logo.png"
          alt="spot-undoo"
          className="h-10 w-auto object-contain"
        />

        {/* Right: GPS status dot + Profile */}
        <div className="flex items-center gap-2">
          {/* GPS indicator */}
          {gpsStatus === 'acquiring' && (
            <Loader2 size={14} className="text-amber-500 animate-spin" />
          )}
          {gpsStatus === 'ok' && (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          )}
          {gpsStatus === 'error' && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          )}

          {/* Profile picture — tap to open settings */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-11 h-11 rounded-full border-[2.5px] border-black overflow-hidden shadow-[0_2px_0_0_#000000] hover:scale-105 transition-transform active:scale-95"
            title="Profile & Settings"
          >
            <img src="/profile.png" alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      {/* ── GPS toasts (below header) ── */}
      {gpsStatus === 'acquiring' && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-300 rounded-full px-3 py-1 mb-2 w-fit mx-auto">
          <Loader2 size={11} className="animate-spin" /> Locating you…
        </div>
      )}
      {gpsStatus === 'ok' && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-full px-3 py-1 mb-2 w-fit mx-auto">
          <CheckCircle2 size={11} /> 📍 {location?.label}
        </div>
      )}
      {gpsStatus === 'error' && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-300 rounded-full px-3 py-1 mb-2 w-fit mx-auto">
          ⚠ GPS unavailable
        </div>
      )}

      {/* ── Profile / Settings Bottom Sheet ── */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-0"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfile(false); }}
        >
          <div className="w-full max-w-[420px] bg-white border-[2.5px] border-black rounded-t-3xl p-5 shadow-[0_-4px_0_0_#000000] space-y-4 pb-8">
            {/* Handle */}
            <div className="w-10 h-1 bg-black rounded-full mx-auto mb-2" />

            {/* Profile card */}
            <div className="flex items-center gap-3 bg-[#F4F6F9] border-[2px] border-black rounded-2xl p-3">
              <img src="/profile.png" alt="Profile" className="w-14 h-14 rounded-full border-[2.5px] border-black object-cover" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-base text-black truncate">
                  {JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Hadhy'}
                </div>
                <div className="text-xs text-gray-500 font-bold truncate">
                  {JSON.parse(localStorage.getItem('currentUser') || '{}').email || 'Explorer · Spot-Undoo'}
                </div>
                <div className="text-[11px] text-emerald-600 font-bold mt-0.5">{timeStr}</div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('jwt');
                  localStorage.removeItem('currentUser');
                  window.location.reload();
                }}
                className="bg-red-500 hover:bg-red-600 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl border-[1.5px] border-black shadow-[0_1.5px_0_0_#000000]"
                title="Log Out"
              >
                Sign out
              </button>
            </div>

            {/* GPS section */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <MapPin size={12} /> Location
              </label>
              <button
                onClick={() => { onRefreshGPS?.(); setShowProfile(false); }}
                disabled={gpsStatus === 'acquiring'}
                className="w-full bg-emerald-50 border-[2px] border-emerald-600 rounded-xl py-2.5 px-3 text-xs font-bold text-left flex items-center justify-between hover:bg-emerald-100 disabled:opacity-50"
              >
                <span>
                  {gpsStatus === 'acquiring' ? '⏳ Locating…' : '📍 Auto-detect my location'}
                </span>
                {gpsStatus === 'acquiring'
                  ? <Loader2 size={12} className="animate-spin text-amber-500" />
                  : <Navigation size={12} className="text-emerald-700" />
                }
              </button>
              <button
                onClick={() => { setLocation({ lat: 10.7606, lon: 76.2711, label: 'Shoranur Jn Hub (Active)' }); setShowProfile(false); }}
                className="w-full bg-[#F4F6F9] border-[2px] border-black rounded-xl py-2.5 px-3 text-xs font-bold text-left flex items-center justify-between hover:bg-gray-100"
              >
                <span>Reset to Shoranur Hub</span>
                <span className="text-[10px] text-emerald-700 font-black">10.7606, 76.2711</span>
              </button>
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <Cpu size={12} /> AI Model
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white border-[2px] border-black rounded-xl px-3 py-2.5 text-xs font-bold text-black outline-none shadow-[0_2px_0_0_#000000]"
              >
                <option value="spot-undo-qwen">spot-undo-qwen (Fine-Tuned Qwen)</option>
                <option value="qwen2.5:3b">qwen2.5:3b (Ultra Fast 3B)</option>
                <option value="qwen3:4b">qwen3:4b (High Performance)</option>
              </select>
            </div>

            {/* Ollama URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <Globe size={12} /> Ollama URL
              </label>
              <input
                value={settings.baseUrl}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full bg-white border-[2px] border-black rounded-xl px-3 py-2.5 text-xs font-bold text-black outline-none shadow-[0_2px_0_0_#000000]"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t-[1.5px] border-gray-200">
              <div className="flex items-center gap-3">
                <button onClick={handleClear} className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1 hover:underline">
                  <Trash2 size={12} /> Clear Spots
                </button>
                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      onLogout();
                    }}
                    className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:underline"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                )}
              </div>
              {cleared && <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={11} /> Cleared!</span>}
              <button
                onClick={() => setShowProfile(false)}
                className="bg-[#0B3BF4] text-white border-[2px] border-black rounded-xl px-5 py-2 text-xs font-black shadow-[0_2px_0_0_#000000]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
