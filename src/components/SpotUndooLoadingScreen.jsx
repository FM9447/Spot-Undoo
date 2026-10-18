import { useState, useEffect } from 'react';

export default function SpotUndooLoadingScreen({
  title = "Good spots are on the way.",
  subtitle = "Finding little detours near you...",
  hubName = null,
  progressStage = null,
  stageText = null,
}) {
  const [internalStep, setInternalStep] = useState(1);

  // If external progressStage is provided, use it; otherwise step smoothly 1 through 6
  useEffect(() => {
    if (progressStage !== null && progressStage !== undefined) return;
    const timer = setInterval(() => {
      setInternalStep((prev) => (prev >= 6 ? 1 : prev + 1));
    }, 450);
    return () => clearInterval(timer);
  }, [progressStage]);

  const currentStep = progressStage !== null && progressStage !== undefined ? progressStage : internalStep;

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9]/96 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="flex flex-col items-center w-full max-w-xs text-center space-y-6">
        {/* Spot-Undoo Logo without background box */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-6 bg-blue-500/10 rounded-full blur-2xl animate-pulse-glow" />
          <img
            src="/logo.png"
            alt="Spot-Undoo"
            className="w-48 sm:w-56 h-auto object-contain select-none animate-heartbeat relative"
          />
        </div>

        {/* 6-Segmented Pill Progress Capsule: First 3 Blue, Other 3 Orange */}
        <div className="w-64 bg-white border-[2.5px] border-black rounded-full p-1.5 flex items-center gap-1.5 shadow-[0_3px_0_0_#000000]">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = idx < currentStep;
            const isLeading = idx === currentStep - 1;

            // FIRST THREE BLUE (#0B3BF4), OTHER THREE ORANGE (#F59E0B)
            let fillColor = '#E2E8F0'; // Default gray when empty
            if (isFilled) {
              fillColor = idx < 3 ? '#0B3BF4' : '#F59E0B';
            }

            return (
              <div
                key={idx}
                style={{ backgroundColor: fillColor, height: '18px' }}
                className={`rounded-full flex-1 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)] ${
                  isLeading ? 'scale-105 ring-1 ring-black/30' : ''
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
            {stageText ? stageText : hubName ? `Finding little detours near ${hubName}...` : subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
