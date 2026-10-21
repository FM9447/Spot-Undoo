import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Compass, Sparkles, MapPin, Terminal, Palette, ChevronDown, Check } from 'lucide-react';
import SettingsModal from './SettingsModal';

const THEMES = [
  { id: 'brutalist', name: 'Neo-Brutalist', label: 'Brutalist', icon: '🟡' },
  { id: 'glass', name: 'Glass Luxe', label: 'Glass', icon: '🪞' },
  { id: 'organic', name: 'Kerala Organic', label: 'Organic', icon: '🌿' },
  { id: 'cyber', name: 'Midnight Cyber', label: 'Cyber', icon: '🌌' },
];

const DESKTOP_NAV_ITEMS = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'planner', label: 'Plan', icon: Sparkles },
  { id: 'upload', label: 'Add Spot', icon: MapPin },
  { id: 'debug', label: 'LLM Debug', icon: Terminal },
];

export default function Header({
  activeTab = 'explore',
  setActiveTab = () => {},
  location,
  setLocation,
  settings,
  setSettings,
  theme = 'brutalist',
  setTheme = () => {},
  gpsStatus = 'idle',
  onRefreshGPS,
  onLogout
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
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
      <header className="w-full bg-white border-b-[3px] border-black rounded-b-[26px] px-4 sm:px-8 pt-3.5 pb-3 flex items-center justify-between shadow-[0_4px_0_0_#000000] mb-4 sticky top-0 z-30">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('explore')}>
          <img
            src="/logo.png"
            alt="spot-undoo"
            className="h-10 sm:h-12 w-auto object-contain select-none"
          />
        </div>

        {/* Center: Desktop Navigation Bar (Visible on md+ screens) */}
        <nav className="hidden md:flex items-center gap-2 bg-[#F4F6F9] border-[2px] border-black rounded-full p-1 shadow-[0_2px_0_0_#000000]">
          {DESKTOP_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B3BF4] text-white shadow-[0_2px_0_0_#000000] scale-100'
                    : 'text-black hover:bg-white hover:text-black'
                }`}
              >
                <Icon size={14} strokeWidth={2.4} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Theme Selector & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Style Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border-[2px] border-black bg-white hover:bg-gray-100 text-xs font-black text-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer"
              title="Change Design Style"
            >
              <Palette size={13} className="text-[#0B3BF4] shrink-0" />
              <span className="hidden sm:inline">{THEMES.find((t) => t.id === theme)?.icon}</span>
              <span className="text-[11px] sm:text-xs">{THEMES.find((t) => t.id === theme)?.label || 'Style'}</span>
              <ChevronDown size={11} className="shrink-0 text-gray-500" />
            </button>

            {showThemeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border-[2.5px] border-black rounded-2xl shadow-[0_4px_0_0_#000000] p-1.5 z-50 flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    Select Design Style
                  </div>
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id);
                        setShowThemeDropdown(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                        theme === t.id
                          ? 'bg-[#0B3BF4] text-white shadow-[0_1.5px_0_0_#000000]'
                          : 'text-black hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </span>
                      {theme === t.id && <Check size={13} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[2.5px] sm:border-[3px] border-black overflow-hidden shadow-[0_2px_0_0_#000000] hover:scale-105 active:scale-95 transition-transform bg-white relative shrink-0"
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
        theme={theme}
        setTheme={setTheme}
        onLogout={onLogout}
        onClearSpots={() => {
          localStorage.removeItem('userSpots');
          window.location.reload();
        }}
      />
    </>
  );
}
