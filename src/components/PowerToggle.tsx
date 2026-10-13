"use client";

import React from "react";
import { Power } from "lucide-react";
import { playSwitchSound } from "@/lib/sound";

interface PowerToggleProps {
  power: boolean;
  onToggle: (newState: boolean) => void;
  disabled?: boolean;
}

export const PowerToggle: React.FC<PowerToggleProps> = ({
  power,
  onToggle,
  disabled,
}) => {
  const handleClick = () => {
    if (disabled) return;
    const nextState = !power;
    playSwitchSound(nextState);
    onToggle(nextState);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label={power ? "Lambayı Kapat" : "Lambayı Aç"}
        className={`relative group w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          power
            ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_0_50px_rgba(250,204,21,0.6)] border-4 border-yellow-200"
            : "bg-gradient-to-br from-neutral-800 to-neutral-900 border-4 border-neutral-700/60 shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:border-neutral-500"
        }`}
      >
        {/* Outer glowing pulsing ring when active */}
        {power && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-300 animate-ping opacity-30 pointer-events-none" />
        )}

        {/* Inner tactile button face */}
        <div
          className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
            power
              ? "bg-yellow-400/20 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              : "bg-neutral-950 text-neutral-500 group-hover:text-neutral-300 shadow-inner"
          }`}
        >
          <Power
            className={`w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 ${
              power ? "scale-110 text-white" : "group-hover:scale-105"
            }`}
          />
        </div>
      </button>

      <div className="text-center">
        <span
          className={`text-sm md:text-base font-extrabold uppercase tracking-widest ${
            power ? "text-yellow-400 text-glow" : "text-neutral-500"
          }`}
        >
          {power ? "GÜÇ AÇIK (ACTIVE)" : "GÜÇ KAPALI (STANDBY)"}
        </span>
        <p className="text-xs text-neutral-400 mt-0.5">
          {power ? "ESP32 Rölesi devrede" : "Dokunarak röleyi tetikle"}
        </p>
      </div>
    </div>
  );
};
