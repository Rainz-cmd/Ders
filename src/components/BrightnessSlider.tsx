"use client";

import React from "react";
import { Sun, SunDim, SunMedium } from "lucide-react";

interface BrightnessSliderProps {
  brightness: number;
  power: boolean;
  onChange: (value: number) => void;
}

export const BrightnessSlider: React.FC<BrightnessSliderProps> = ({
  brightness,
  power,
  onChange,
}) => {
  const presets = [25, 50, 75, 100];

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {brightness > 60 ? (
            <Sun className="w-5 h-5 text-yellow-400 animate-spin-slow" />
          ) : brightness > 25 ? (
            <SunMedium className="w-5 h-5 text-amber-400" />
          ) : (
            <SunDim className="w-5 h-5 text-neutral-400" />
          )}
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Parlaklık / PWM
          </span>
        </div>
        <span className="text-xl font-bold font-mono text-yellow-400">
          {power ? `${brightness}%` : "0%"}
        </span>
      </div>

      {/* Range Input with custom background track */}
      <div className="relative flex items-center mb-5">
        <input
          type="range"
          min="1"
          max="100"
          value={brightness}
          disabled={!power}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed accent-yellow-400 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          style={{
            background: `linear-gradient(to right, #eab308 0%, #facc15 ${brightness}%, #262626 ${brightness}%, #262626 100%)`,
          }}
        />
      </div>

      {/* Preset Quick Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map((val) => (
          <button
            key={val}
            disabled={!power}
            onClick={() => onChange(val)}
            className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 border ${
              brightness === val && power
                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm"
                : "bg-neutral-800/60 text-neutral-400 border-neutral-700/50 hover:bg-neutral-700/60 hover:text-neutral-200"
            } disabled:opacity-40 disabled:pointer-events-none`}
          >
            {val}%
          </button>
        ))}
      </div>
    </div>
  );
};
