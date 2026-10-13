"use client";

import React from "react";
import { Sparkles, Activity, Zap, Rainbow } from "lucide-react";

interface ModeSelectorProps {
  mode: "solid" | "breathe" | "strobe" | "rainbow";
  speed: number;
  power: boolean;
  onModeChange: (newMode: "solid" | "breathe" | "strobe" | "rainbow") => void;
  onSpeedChange: (speed: number) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  speed,
  power,
  onModeChange,
  onSpeedChange,
}) => {
  const modes = [
    { id: "solid" as const, label: "Sabit", icon: Sparkles },
    { id: "breathe" as const, label: "Nefes", icon: Activity },
    { id: "strobe" as const, label: "Flaş", icon: Zap },
    { id: "rainbow" as const, label: "RGB", icon: Rainbow },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Işık Modları
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {modes.map((item) => {
          const Icon = item.icon;
          const isActive = mode === item.id && power;
          return (
            <button
              key={item.id}
              disabled={!power}
              onClick={() => onModeChange(item.id)}
              className={`p-3 rounded-xl flex flex-col items-center justify-center space-y-1.5 border transition-all duration-200 ${
                isActive
                  ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.25)]"
                  : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Speed Slider for animated modes */}
      {mode !== "solid" && (
        <div className="mt-3 pt-3 border-t border-neutral-800/60">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Efekt Hızı</span>
            <span className="font-mono text-yellow-400">{speed}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            disabled={!power}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
          />
        </div>
      )}
    </div>
  );
};
