import { useState } from 'react';
import {
  X,
  User,
  Camera,
  MapPin,
  Sliders,
  Layers,
  Bell,
  Trash2,
  LogOut,
  CheckCircle2,
  Loader2,
  Sparkles,
  Palette,
} from 'lucide-react';
import { uploadImageToFirebase } from '../utils/firebaseStorage';

const APP_THEMES = [
  { id: 'brutalist', name: 'Neo-Brutalist', desc: 'Bold 2.5px strokes, hard shadows & pop contrast', icon: '🟡', bg: 'bg-[#FFE500]' },
  { id: 'glass', name: 'Glass Luxe', desc: 'Apple iOS frosted glass, soft blur & ambient lighting', icon: '🪞', bg: 'bg-indigo-100' },
  { id: 'organic', name: 'Kerala Organic', desc: 'Warm linen paper, forest green & terracotta clay', icon: '🌿', bg: 'bg-emerald-100' },
  { id: 'cyber', name: 'Midnight Cyber', desc: 'Obsidian titanium, electric cyan & neon emerald', icon: '🌌', bg: 'bg-slate-900 text-white' },
];

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  settings,
  setSettings,
  theme = 'brutalist',
  setTheme = () => {},
  onLogout,
  onClearSpots,
}) {
  if (!isOpen) return null;

  const [name, setName] = useState(currentUser?.name || 'Local Explorer');
  const [bio, setBio] = useState(currentUser?.bio || 'Hidden Gem Hunter 🌿');
  const [homeCity, setHomeCity] = useState(currentUser?.homeCity || 'Kochi');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '/profile.png');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Avada Map Style Preference
  const [mapStyle, setMapStyle] = useState(
    () => localStorage.getItem('avada_map_style') || 'standard'
  );

  // Notification Preferences
  const [notifyCityChange, setNotifyCityChange] = useState(
    () => localStorage.getItem('notify_city_change') !== 'false'
  );
  const [notifyFoodSpots, setNotifyFoodSpots] = useState(
    () => localStorage.getItem('notify_food_spots') !== 'false'
  );

  // Handle Avatar Change with Firebase Storage
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setAvatarSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = 240;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 240, 240);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);

          // Local preview first
          setAvatar(compressed);

          // Upload to Firebase Cloud Storage
          const firebaseUrl = await uploadImageToFirebase(compressed, 'avatars');
          const finalUrl = firebaseUrl || compressed;
          setAvatar(finalUrl);

          const updatedUser = { ...currentUser, avatar: finalUrl };
          onUpdateUser?.(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          setAvatarSuccess(true);
          setTimeout(() => setAvatarSuccess(false), 2500);
        } catch (err) {
          console.error('Firebase avatar upload error:', err);
        } finally {
          setUploadingAvatar(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Save All Settings
  const handleSave = () => {
    const updated = {
      ...currentUser,
      name: name.trim() || 'Local Explorer',
      bio: bio.trim(),
      homeCity,
      avatar,
    };
    onUpdateUser?.(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));

    // Save Map & Notification settings
    localStorage.setItem('avada_map_style', mapStyle);
    localStorage.setItem('notify_city_change', String(notifyCityChange));
    localStorage.setItem('notify_food_spots', String(notifyFoodSpots));

    // Trigger map update event
    window.dispatchEvent(new CustomEvent('avada_map_style_changed', { detail: mapStyle }));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[460px] bg-white border-[3px] border-black rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-y-auto shadow-[0_8px_0_0_#000000] p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-[2.5px] border-black">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="text-base font-black uppercase tracking-wider text-black">
              Profile & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border-[2px] border-black bg-white hover:bg-gray-100 flex items-center justify-center font-black active:scale-95 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── ACTIVE ACCOUNT & LOGOUT HERO CARD ── */}
        <div className="bg-white border-[2.5px] border-black rounded-2xl p-3 shadow-[0_3px_0_0_#000000] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full border-[2px] border-black overflow-hidden bg-[#FEF08A] shrink-0 shadow-[0_1.5px_0_0_#000000]">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-black truncate max-w-[140px]">{name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full border border-black font-black bg-emerald-100 text-emerald-800">
                  {currentUser?.isAnonymous ? 'Guest' : (currentUser?.email ? 'Member' : 'Active')}
                </span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 truncate max-w-[160px]">{currentUser?.email || 'explorer@spotundoo.com'}</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white border-[2px] border-black rounded-xl px-3 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000000] flex items-center gap-1.5 shrink-0 active:scale-95 transition cursor-pointer"
              title="Log Out of Spot Undoo"
            >
              <LogOut size={13} strokeWidth={2.6} />
              <span>Log Out</span>
            </button>
          )}
        </div>

        {/* ── PROFILE SECTION ── */}
        <div className="bg-[#FEF08A] border-[2.5px] border-black rounded-2xl p-4 shadow-[0_3px_0_0_#000000] space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <User size={13} strokeWidth={3} />
            <span>Profile Details</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-[3px] border-black overflow-hidden bg-white shadow-[0_2px_0_0_#000000]">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <label
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white border-[2px] border-black flex items-center justify-center cursor-pointer shadow-[0_1px_0_0_#000000] hover:bg-yellow-200 transition"
                title="Upload Photo to Firebase"
              >
                {uploadingAvatar ? (
                  <Loader2 size={12} className="animate-spin text-[#0B3BF4]" />
                ) : (
                  <Camera size={12} className="text-black" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </label>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-700">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-white border-[2px] border-black rounded-xl px-2.5 py-1.5 text-xs font-black text-black outline-none"
              />
            </div>
          </div>

          {avatarSuccess && (
            <div className="text-[10px] text-emerald-800 font-black flex items-center gap-1 bg-emerald-100 border border-emerald-500 rounded-lg p-1.5">
              <CheckCircle2 size={12} />
              <span>Avatar uploaded & saved to Firebase Storage!</span>
            </div>
          )}

          {/* Bio */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-700">Explorer Vibe / Bio</label>
            <input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Chai lover, solo traveler"
              className="w-full bg-white border-[2px] border-black rounded-xl px-2.5 py-1.5 text-xs font-bold text-black outline-none"
            />
          </div>

          {/* Home City */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-700">Home Region</label>
            <select
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              className="w-full bg-white border-[2px] border-black rounded-xl px-2.5 py-1.5 text-xs font-black text-black outline-none"
            >
              <option value="Kochi">Kochi (Cochin)</option>
              <option value="Shoranur">Shoranur Jn</option>
              <option value="Kozhikode">Kozhikode (Calicut)</option>
              <option value="Thiruvananthapuram">Thiruvananthapuram (Trivandrum)</option>
              <option value="Palakkad">Palakkad</option>
              <option value="Wayanad">Wayanad</option>
              <option value="Munnar">Munnar</option>
              <option value="Varkala">Varkala</option>
            </select>
          </div>
        </div>

        {/* ── APP DESIGN AESTHETIC / THEME ── */}
        <div className="bg-[#FEF3C7] border-[2.5px] border-black rounded-2xl p-4 shadow-[0_3px_0_0_#000000] space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-black flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Palette size={14} strokeWidth={2.6} className="text-amber-800" />
              <span>App Design Aesthetic</span>
            </span>
            <span className="bg-amber-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black">
              Live Switcher
            </span>
          </div>

          <p className="text-[11px] text-gray-800 font-bold leading-snug">
            Choose your interface visual styling beyond neo-brutalism:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {APP_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`text-left p-2.5 rounded-xl border-[2px] border-black transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white shadow-[0_3px_0_0_#000000] scale-[1.02]'
                      : 'bg-[#FFFDF5] hover:bg-white shadow-[0_1px_0_0_#000000]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-black flex items-center gap-1">
                      <span>{t.icon}</span>
                      <span>{t.name}</span>
                    </span>
                    {isSelected && (
                      <span className="bg-[#0B3BF4] text-white rounded-full p-0.5">
                        <CheckCircle2 size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-600 font-bold mt-1 line-clamp-1">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── AVADA OPENSTREETMAP STYLE ── */}
        <div className="bg-[#E0F2FE] border-[2.5px] border-black rounded-2xl p-4 shadow-[0_3px_0_0_#000000] space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-black flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers size={13} strokeWidth={3} className="text-blue-700" />
              <span>Avada OpenStreetMap Theme</span>
            </span>
            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
              Zero API Key
            </span>
          </div>

          <p className="text-[11px] text-gray-700 font-bold leading-snug">
            Choose your cartographic tile rendering style inspired by Avada Builder OpenStreetMap:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'standard', name: 'Standard', desc: 'Official OSM', icon: '🗺️' },
              { id: 'humanitarian', name: 'Pastel Soft', desc: 'Avada HOT', icon: '🌿' },
              { id: 'topo', name: 'Topographic', desc: 'Contours & Hills', icon: '⛰️' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setMapStyle(st.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-[2px] border-black transition text-center ${
                  mapStyle === st.id
                    ? 'bg-[#0B3BF4] text-white shadow-[0_2px_0_0_#000000]'
                    : 'bg-white text-black hover:bg-blue-50'
                }`}
              >
                <span className="text-lg mb-0.5">{st.icon}</span>
                <span className="text-[10px] font-black">{st.name}</span>
                <span className={`text-[8px] font-bold ${mapStyle === st.id ? 'text-blue-200' : 'text-gray-500'}`}>
                  {st.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── NOTIFICATIONS & PROXIMITY ── */}
        <div className="bg-[#F0FDF4] border-[2.5px] border-black rounded-2xl p-4 shadow-[0_3px_0_0_#000000] space-y-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <Bell size={13} strokeWidth={3} className="text-emerald-700" />
            <span>Travel Notifications</span>
          </div>

          <label className="flex items-center justify-between text-xs font-bold text-black cursor-pointer">
            <span>City Change Toast & Hotspot Count</span>
            <input
              type="checkbox"
              checked={notifyCityChange}
              onChange={(e) => setNotifyCityChange(e.target.checked)}
              className="w-4 h-4 accent-[#0B3BF4] rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs font-bold text-black cursor-pointer">
            <span>Nearby Food Spot & Proximity Alerts</span>
            <input
              type="checkbox"
              checked={notifyFoodSpots}
              onChange={(e) => setNotifyFoodSpots(e.target.checked)}
              className="w-4 h-4 accent-[#0B3BF4] rounded"
            />
          </label>
        </div>

        {/* ── AI ENGINE CONFIGURATION ── */}
        {settings && setSettings && (
          <div className="bg-[#F4F6F9] border-[2.5px] border-black rounded-2xl p-4 shadow-[0_3px_0_0_#000000] space-y-2.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Sliders size={13} strokeWidth={3} />
              <span>AI Engine (Local / Ollama)</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-700">Model</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white border-[2px] border-black rounded-xl px-2.5 py-1.5 text-xs font-black text-black outline-none"
              >
                <option value="spot-undo-qwen">spot-undo-qwen (Fine-Tuned Qwen)</option>
                <option value="qwen2.5:3b">qwen2.5:3b (Ultra Fast 3B)</option>
                <option value="qwen3:4b">qwen3:4b (High Performance)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-700">Ollama Base URL</label>
              <input
                value={settings.baseUrl}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full bg-white border-[2px] border-black rounded-xl px-2.5 py-1.5 text-xs font-bold text-black outline-none"
              />
            </div>
          </div>
        )}

        {/* ── ACTIONS & FOOTER ── */}
        <div className="pt-2 border-t-[2.5px] border-black flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Clear all community and cached spots?')) {
                  onClearSpots?.();
                }
              }}
              className="text-xs font-black text-gray-500 hover:text-black flex items-center gap-1"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
            {onLogout && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="text-xs font-black text-rose-600 hover:text-rose-700 flex items-center gap-1 active:scale-95 transition cursor-pointer"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            className="bg-[#0B3BF4] text-white border-[2.5px] border-black rounded-xl px-5 py-2.5 text-xs font-black shadow-[0_3px_0_0_#000000] active:translate-y-0.5 transition flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        {/* ── CUSTOM NEO-BRUTALIST LOGOUT POPUP ── */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-white border-[3px] border-black rounded-[28px] p-5 shadow-[0_8px_0_0_#000000] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 border-[2px] border-black flex items-center justify-center text-rose-600 shadow-[0_2px_0_0_#000000] shrink-0">
                  <LogOut size={22} strokeWidth={2.6} />
                </div>
                <div>
                  <h3 className="text-base font-black text-black leading-tight">Log Out Session?</h3>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">Return to the sign-in screen</p>
                </div>
              </div>

              <div className="bg-[#F4F6F9] border-[2px] border-black rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full border border-black overflow-hidden bg-white shrink-0">
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-black truncate">{name}</div>
                  <div className="text-[10px] font-bold text-gray-500 truncate">{currentUser?.email || 'explorer@spotundoo.com'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-white hover:bg-gray-100 border-[2px] border-black rounded-xl py-2.5 text-xs font-black text-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    if (onLogout) onLogout();
                    onClose();
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white border-[2px] border-black rounded-xl py-2.5 text-xs font-black shadow-[0_2px_0_0_#000000] active:translate-y-0.5 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut size={13} strokeWidth={2.6} />
                  <span>Yes, Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
