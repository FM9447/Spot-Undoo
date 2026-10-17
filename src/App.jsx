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
    return <Login onLogin={handleLogin} onCancel={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] max-w-[420px] mx-auto px-3.5 pt-3 pb-24 relative flex flex-col font-sans">
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
          <UploadTab settings={settings} />
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
