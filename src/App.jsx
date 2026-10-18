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
  const [showLoading, setShowLoading] = useState(true);
  const [fadeLoading, setFadeLoading] = useState(false);

  // Initial startup screen with smooth ending transition
  useEffect(() => {
    const t1 = setTimeout(() => {
      setFadeLoading(true);
    }, 1200);
    const t2 = setTimeout(() => {
      setShowLoading(false);
    }, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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

  if (!loggedIn) {
    return (
      <>
        <Login onLogin={handleLogin} onCancel={() => {}} />
        {showLoading && (
          <div
            style={{ zIndex: 99999 }}
            className={`fixed inset-0 z-[99999] bg-[#F4F6F9] flex flex-col items-center justify-center p-6 transition-all duration-700 ease-out ${
              fadeLoading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
            }`}
          >
            <div className={`relative flex flex-col items-center transition-all duration-700 ${
              fadeLoading ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
            }`}>
              <div className="absolute -inset-6 bg-blue-500/10 rounded-full blur-2xl animate-pulse-glow" />
              <img
                src="/logo.png"
                alt="Spot Undoo"
                className="w-48 sm:w-56 h-auto object-contain animate-heartbeat select-none relative"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full sm:max-w-md sm:mx-auto relative flex flex-col font-sans overflow-x-hidden">
      {/* 1. Header (Touches top, left, right full-width) */}
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
      <main className="flex-1 w-full px-2.5 sm:px-4 pb-24 overflow-x-hidden">
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

      {/* Loading Overlay with Smooth Fade-Out */}
      {showLoading && (
        <div
          style={{ zIndex: 99999 }}
          className={`fixed inset-0 z-[99999] bg-[#F4F6F9] flex flex-col items-center justify-center p-6 transition-all duration-700 ease-out ${
            fadeLoading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
          }`}
        >
          <div className={`relative flex flex-col items-center transition-all duration-700 ${
            fadeLoading ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
          }`}>
            <div className="absolute -inset-6 bg-blue-500/10 rounded-full blur-2xl animate-pulse-glow" />
            <img
              src="/logo.png"
              alt="Spot Undoo"
              className="w-48 sm:w-56 h-auto object-contain animate-heartbeat select-none relative"
            />
          </div>
        </div>
      )}
    </div>
  );
}
