import { useState, useEffect } from 'react';

export default function SpotUndooLoadingScreen({
  title = "Good spots are on the way.",
  subtitle = "Finding little detours near you...",
  hubName = null,
}) {
  const [pulseIndex, setPulseIndex] = useState(3);

  // Smooth animated progression across the 6 segments
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev >= 6 ? 1 : prev + 1));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC]/96 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 bg-[radial-gradient(#CBD5E1_1.2px,transparent_1.2px)] [background-size:18px_18px]">
      <div className="flex flex-col items-center w-full max-w-xs text-center space-y-6">
        {/* Brand Card with Spot-Undoo Logo */}
        <div className="w-full bg-white border-[3px] border-black rounded-[32px] p-7 shadow-[0_6px_0_0_#000000] flex items-center justify-center">
          <img
            src="/spot-undoo-logo.png"
            alt="Spot-Undoo"
            className="w-56 h-auto object-contain select-none"
          />
        </div>

        {/* 6-Segmented Pill Progress Capsule */}
        <div className="w-60 bg-white border-[2.5px] border-black rounded-full p-1.5 flex items-center gap-1.5 shadow-[0_3px_0_0_#000000]">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = idx < pulseIndex;
            let barColor = 'bg-[#F1F5F9]';
            if (isFilled) {
              barColor = idx === 3 ? 'bg-[#F59E0B]' : 'bg-[#0B3BF4]';
            }
            return (
              <div
                key={idx}
                className={`h-4.5 rounded-full flex-1 transition-colors duration-250 ${barColor}`}
              />
            );
          })}
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-1">
          <h3 className="font-black text-xl text-black tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-xs font-semibold text-gray-500">
            {hubName ? `Finding little detours near ${hubName}...` : subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
