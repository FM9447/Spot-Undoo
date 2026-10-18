import { useState, useEffect } from 'react';

export default function SpotUndooLoadingScreen({
  title = "Good spots are on the way.",
  subtitle = "Finding little detours near you...",
  hubName = null,
}) {
  const [activeStep, setActiveStep] = useState(1);

  // Smoothly step 1 -> 2 -> 3 -> 4 -> 5 -> 6 and repeat
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 6 ? 1 : prev + 1));
    }, 400);
    return () => clearInterval(timer);
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
        <div className="w-64 bg-white border-[2.5px] border-black rounded-full p-1.5 flex items-center gap-1.5 shadow-[0_3px_0_0_#000000]">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = idx < activeStep;
            const isLeading = idx === activeStep - 1;

            let bgColor = '#E2E8F0'; // Default empty segment color
            if (isFilled) {
              bgColor = idx === 3 ? '#F59E0B' : '#0B3BF4'; // Segment 3 is amber, others electric blue
            }

            return (
              <div
                key={idx}
                style={{ backgroundColor: bgColor, height: '18px' }}
                className={`rounded-full flex-1 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)] ${
                  isLeading ? 'scale-105 ring-1 ring-black/20' : ''
                }`}
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
