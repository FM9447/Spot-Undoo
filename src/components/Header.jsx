import { useState, useEffect } from 'react';
import { Settings, X, Cpu, Globe, MapPin, Trash2, CheckCircle2 } from 'lucide-react';

export default function Header({ location, setLocation, settings, setSettings }) {
  const [timeStr, setTimeStr] = useState('14:15 PM');
  const [showSettings, setShowSettings] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setTimeStr(`${hours}:${mins} PM`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClear = () => {
    localStorage.removeItem('userSpots');
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <>
      <header className="w-full bg-white border-[2.5px] border-black rounded-full px-3 py-1.5 flex items-center justify-between shadow-[0_3px_0_0_#000000] mb-3">
        {/* Left: Avatar + Name + Live Time */}
        <div className="flex items-center gap-2.5">
          <img
            src="/profile.png"
            alt="User profile"
            className="w-9 h-9 rounded-full border-[2px] border-black object-cover"
          />
          <div className="flex flex-col">
            <span className="font-black text-xs text-black leading-tight">Hadhy</span>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>{timeStr}</span>
            </div>
          </div>
        </div>

        {/* Center Brand Logo (Transparent spot-undoo) */}
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="spot-undoo"
            className="h-8 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform"
          />
        </div>

        {/* Right: Settings Gear */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-full border-[2px] border-black bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-[0_2px_0_0_#000000] active:translate-y-0.5"
          title="App Settings"
        >
          <Settings size={16} strokeWidth={2.2} className="text-black" />
        </button>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border-[2.5px] border-black rounded-3xl p-5 shadow-[0_6px_0_0_#000000] space-y-4">
            <div className="flex items-center justify-between border-b-[2px] border-black pb-3">
              <div className="flex items-center gap-2">
                <Settings size={18} strokeWidth={2.5} />
                <h3 className="font-black text-sm text-black">Settings & Connection</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full border-[2px] border-black flex items-center justify-center hover:bg-gray-100 font-black text-xs"
              >
                ✕
              </button>
            </div>

            {/* Model switch */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <Cpu size={12} /> Model Selection
              </label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full bg-white border-[2px] border-black rounded-xl px-3 py-2 text-xs font-bold text-black outline-none shadow-[0_2px_0_0_#000000]"
              >
                <option value="spot-undo-qwen">spot-undo-qwen (Fine-Tuned Qwen Edge)</option>
                <option value="qwen2.5:3b">qwen2.5:3b (Ultra Fast 3B Edge)</option>
                <option value="qwen3:4b">qwen3:4b (High Performance Edge)</option>
              </select>
            </div>

            {/* Ollama URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <Globe size={12} /> Ollama Base URL
              </label>
              <input
                value={settings.baseUrl}
                onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full bg-white border-[2px] border-black rounded-xl px-3 py-2 text-xs font-bold text-black outline-none shadow-[0_2px_0_0_#000000]"
              />
            </div>

            {/* GPS reset */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1">
                <MapPin size={12} /> Location Hub
              </label>
              <button
                onClick={() => {
                  setLocation({ lat: 10.7606, lon: 76.2711, label: 'Shoranur Jn Hub (Active)' });
                  setShowSettings(false);
                }}
                className="w-full bg-[#F4F6F9] border-[2px] border-black rounded-xl py-2 px-3 text-xs font-bold text-left flex items-center justify-between hover:bg-emerald-50"
              >
                <span>Reset to Shoranur Hub</span>
                <span className="text-[10px] text-emerald-700 font-black">10.7606, 76.2711</span>
              </button>
            </div>

            {/* Clear cache */}
            <div className="pt-2 border-t-[1.5px] border-gray-200 flex items-center justify-between">
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear Local Spots
              </button>
              {cleared && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Cleared!
                </span>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="bg-[#0B3BF4] text-white border-[2px] border-black rounded-xl px-4 py-1.5 text-xs font-black shadow-[0_2px_0_0_#000000]"
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
