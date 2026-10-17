import { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ExploreTab from './tabs/ExploreTab';
import ChatTab from './tabs/ChatTab';
import UploadTab from './tabs/UploadTab';
import LLMDebugTab from './tabs/LLMDebugTab';
import { getOllamaUrl } from './utils/apiConfig';
import Login from './pages/Login';

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
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    setLoggedIn(!!token);
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
      {/* 1. Header (Shared across screens) */}
      <Header
        location={location}
        setLocation={setLocation}
        settings={settings}
        setSettings={setSettings}
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

      {/* 3. Floating Bottom Navigation Dock */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded"
      >
        Logout
      </button>
    </div>
  );
}
