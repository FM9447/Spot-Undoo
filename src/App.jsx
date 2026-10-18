import { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ExploreTab from './tabs/ExploreTab';
import ChatTab from './tabs/ChatTab';
import UploadTab from './tabs/UploadTab';
import LLMDebugTab from './tabs/LLMDebugTab';
import { getOllamaUrl } from './utils/apiConfig';
import Login from './pages/Login';
import { acquireGPS } from './utils/gps';

const DEFAULT_LOCATION = {
  lat: 10.7606,
  lon: 76.2711,
  label: 'Shoranur Jn Hub (Active)',
};

const DEFAULT_SETTINGS = {
  model: 'spot-undo-qwen',
  baseUrl: getOllamaUrl(),
};

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const initialLoggedIn = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('view') && new URLSearchParams(window.location.search).get('view') !== 'login'
      ? true
      : !!localStorage.getItem('jwt')
  );
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'acquiring' | 'ok' | 'error'
  const [appInitializing, setAppInitializing] = useState(true);

  // Initial startup screen with heartbeat logo animation
  useEffect(() => {
    const t = setTimeout(() => {
      setAppInitializing(false);
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const token = localStorage.getItem('jwt');
    if (viewParam === 'login') {
      setLoggedIn(false);
    } else if (viewParam) {
      setLoggedIn(true);
      setActiveTab(viewParam);
    } else {
      setLoggedIn(!!token);
    }
  }, []);

  // Auto-acquire GPS on mount — fast dual-strategy
  useEffect(() => {
    setGpsStatus('acquiring');
    acquireGPS({
      onSuccess: ({ lat, lon, label, cityKey }) => {
        setLocation({ lat, lon, label, cityKey });
        setGpsStatus('ok');
      },
      onError: () => setGpsStatus('error'),
    });
  }, []);

  const handleLogin = () => setLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setLoggedIn(false);
  };

  if (appInitializing) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col items-center justify-center p-6 bg-[radial-gradient(#CBD5E1_1.2px,transparent_1.2px)] [background-size:16px_16px]">
        <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute -inset-4 bg-purple-500/15 rounded-full blur-2xl animate-pulse-glow" />
          <div className="bg-white border-[3px] border-black rounded-[36px] px-8 py-6 shadow-[0_6px_0_0_#000000] relative">
            <img
              src="/logo.png"
              alt="Spot Undoo"
              className="h-20 sm:h-24 w-auto object-contain animate-heartbeat select-none"
            />
          </div>
          <div className="mt-8 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0B3BF4] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-bounce" />
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-widest text-gray-500">
            Spot Undoo
          </p>
        </div>
      </div>
    );
  }

  if (!loggedIn) {
    return <Login onLogin={handleLogin} onCancel={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] w-full max-w-md mx-auto px-2.5 sm:px-4 pt-2.5 pb-24 relative flex flex-col font-sans">
      {/* 1. Header */}
      <Header
        location={location}
        setLocation={setLocation}
        settings={settings}
        setSettings={setSettings}
        gpsStatus={gpsStatus}
        onRefreshGPS={() => {
          setGpsStatus('acquiring');
          acquireGPS({
            onSuccess: ({ lat, lon, label, cityKey }) => {
              setLocation({ lat, lon, label, cityKey });
              setGpsStatus('ok');
            },
            onError: () => setGpsStatus('error'),
          });
        }}
        onLogout={handleLogout}
      />

      {/* 2. Main Tab Body */}
      <main className="flex-1">
        {activeTab === 'explore' && (
          <ExploreTab location={location} setLocation={setLocation} />
        )}
        {activeTab === 'planner' && (
          <ChatTab location={location} setLocation={setLocation} settings={settings} />
        )}
        {activeTab === 'upload' && (
          <UploadTab location={location} settings={settings} />
        )}
        <div className={activeTab === 'debug' ? '' : 'hidden'}>
          <LLMDebugTab settings={settings} />
        </div>
      </main>

      {/* 3. Floating Bottom Nav */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
