import { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import SettingsModal from './SettingsModal';

export default function Header({ location, setLocation, settings, setSettings, gpsStatus = 'idle', onRefreshGPS, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem('currentUser') || '{}'));
      } catch {}
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const userAvatar = currentUser.avatar || '/profile.png';

  return (
    <>
      {/* ── Main Header Bar (Touches top, left, right with rounded-b bottom radius) ── */}
      <header className="w-full bg-white border-b-[3px] border-black rounded-b-[26px] px-4 pt-3.5 pb-3 flex items-center justify-between shadow-[0_4px_0_0_#000000] mb-3 sticky top-0 z-30">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="spot-undoo"
            className="h-10 sm:h-12 w-auto object-contain select-none"
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
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 rounded-full border-[3px] border-black overflow-hidden shadow-[0_2px_0_0_#000000] hover:scale-105 active:scale-95 transition-transform bg-white relative shrink-0"
            title="Profile & Settings"
          >
            <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      {/* ── Profile & App Settings Modal ── */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
        onUpdateUser={(updated) => setCurrentUser(updated)}
        settings={settings}
        setSettings={setSettings}
        onLogout={onLogout}
        onClearSpots={() => {
          localStorage.removeItem('userSpots');
          window.location.reload();
        }}
      />
    </>
  );
}
