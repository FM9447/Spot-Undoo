import { useState, useEffect } from 'react';
import { Cpu, Globe, MapPin, Trash2, CheckCircle2, Loader2, Navigation, X, Settings, LogOut } from 'lucide-react';

export default function Header({ location, setLocation, settings, setSettings, gpsStatus = 'idle', onRefreshGPS, onLogout }) {
  const [showProfile, setShowProfile] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const syncUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || '{}'));
      } catch {}
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const updated = { ...currentUser, avatar: compressed };
        setCurrentUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const userAvatar = currentUser.avatar || '/profile.png';

  return (
    <>
      {/* ── Main Header Bar (Touches top, left, right) ── */}
      <header className="w-full bg-white border-b-[2.5px] border-black px-4 pt-3 pb-2.5 flex items-center justify-between shadow-[0_3px_0_0_#0B3BF4] mb-3 sticky top-0 z-30">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="spot-undoo"
            className="h-9 sm:h-10 w-auto object-contain select-none"
          />
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] font-black text-black leading-tight">
              {currentUser.name || 'Local Explorer'}
            </span>
            <span className="text-[9px] font-bold text-gray-500">
              {timeStr}
            </span>
          </div>

          {/* Profile picture — tap to open settings */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full border-[2.2px] border-black overflow-hidden shadow-[0_2px_0_0_#000000] hover:scale-105 active:scale-95 transition-transform bg-white relative shrink-0"
            title="Profile & Settings"
          >
            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

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
              <label className="relative w-14 h-14 rounded-full border-[2.5px] border-black overflow-hidden bg-white cursor-pointer group shrink-0" title="Change photo">
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white font-bold">Edit</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              <div className="flex-1 min-w-0">
                <div className="font-black text-base text-black truncate">
                  {currentUser.name || 'Local Explorer'}
                </div>
                <div className="text-xs text-gray-500 font-bold truncate">
                  {currentUser.email || 'Explorer · Spot-Undoo'}
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
                <Globe size={12} /> Ollama URL (Local or DigitalOcean)
              </label>
              <input
                value={settings.baseUrl}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full bg-white border-[2px] border-black rounded-xl px-3 py-2.5 text-xs font-bold text-black outline-none shadow-[0_2px_0_0_#000000]"
              />
            </div>

            {/* ElevenLabs API Key */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                🎙️ ElevenLabs Voice Key (Optional)
              </label>
              <input
                type="password"
                defaultValue={localStorage.getItem('spot_undoo_elevenlabs_key') || ''}
                onChange={(e) => localStorage.setItem('spot_undoo_elevenlabs_key', e.target.value.trim())}
                placeholder="xi-api-key for Audio Guides"
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
