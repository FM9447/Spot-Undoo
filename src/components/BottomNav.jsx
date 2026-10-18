import { Compass, Sparkles, MapPin, Terminal } from 'lucide-react';

const TABS = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'planner', label: 'Planner', icon: Sparkles },
  { id: 'upload', label: 'Add Spot', icon: MapPin },
  { id: 'debug', label: 'LLM Debug', icon: Terminal },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.25rem)] max-w-md bg-white border-[2.5px] border-black rounded-full px-2 py-2 flex items-center justify-around shadow-[0_4px_0_0_#000000] z-50">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex flex-col items-center justify-center relative transition-transform active:scale-95 group focus:outline-none"
          >
            {isActive ? (
              <div className="flex flex-col items-center -mt-6">
                <div className="w-12 h-12 rounded-full bg-[#0B3BF4] border-[2.5px] border-black flex items-center justify-center text-white shadow-[0_3px_0_0_#000000] transition-all">
                  <Icon size={22} strokeWidth={2.4} />
                </div>
                <span className="text-[10px] font-black text-[#0B3BF4] mt-1 tracking-tight">
                  {label}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-1">
                <Icon size={20} strokeWidth={2.2} className="text-black group-hover:text-gray-700" />
                <span className="text-[10px] font-black text-black mt-0.5 tracking-tight">
                  {label}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </nav>
  );
}
