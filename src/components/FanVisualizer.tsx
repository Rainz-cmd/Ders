"use client";

import React from "react";
import { Fan as FanIcon } from "lucide-react";

interface FanVisualizerProps {
  power: boolean;
  speed: number;
  mode: string;
}

export const FanVisualizer: React.FC<FanVisualizerProps> = ({
  power,
  speed,
  mode,
}) => {
  // Calculate spin animation duration: faster speed = lower duration
  const spinDuration = power && speed > 0 ? `${Math.max(0.15, 2.5 - (speed / 100) * 2.3)}s` : "0s";
  const calculatedRPM = power ? Math.round((speed / 100) * 2400) : 0;

  return (
    <div className="relative flex flex-col items-center justify-center p-8 select-none">
      {/* Airflow glow backdrop */}
      <div
        className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full pointer-events-none transition-all duration-700 ease-out -z-10"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.05) 60%, transparent 80%)",
          opacity: power ? speed / 100 : 0.1,
          filter: "blur(30px)",
          transform: `scale(${power ? 1 + speed / 200 : 0.8})`,
        }}
      />

      {/* Fan Outer Housing / Grill */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-cyan-500/40 bg-neutral-900/80 shadow-[0_0_35px_rgba(6,182,212,0.2)] flex items-center justify-center p-2">
        {/* Metal Grill Protective Rings */}
        <div className="absolute inset-2 rounded-full border border-neutral-700/60 pointer-events-none" />
        <div className="absolute inset-6 rounded-full border border-neutral-700/40 pointer-events-none" />
        <div className="absolute inset-10 rounded-full border border-neutral-700/30 pointer-events-none" />

        {/* Center Motor Hub */}
        <div className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-neutral-800 to-neutral-700 border-2 border-cyan-400 z-10 flex items-center justify-center shadow-lg">
          <FanIcon className={`w-5 h-5 ${power ? "text-cyan-300" : "text-neutral-500"}`} />
        </div>

        {/* Rotating 3 Blades */}
        <div
          className="w-full h-full relative"
          style={{
            animation: power && speed > 0 ? `spin ${spinDuration} linear infinite` : "none",
          }}
        >
          {/* Blade 1 (0 deg) */}
          <div className="absolute top-1/2 left-1/2 w-8 h-20 -translate-x-1/2 origin-bottom bg-gradient-to-t from-cyan-600/70 to-cyan-400 rounded-t-full shadow-md opacity-90 -translate-y-full" />
          {/* Blade 2 (120 deg) */}
          <div
            className="absolute top-1/2 left-1/2 w-8 h-20 -translate-x-1/2 origin-bottom bg-gradient-to-t from-cyan-600/70 to-cyan-400 rounded-t-full shadow-md opacity-90 -translate-y-full"
            style={{ transform: "translate(-50%, -100%) rotate(120deg)" }}
          />
          {/* Blade 3 (240 deg) */}
          <div
            className="absolute top-1/2 left-1/2 w-8 h-20 -translate-x-1/2 origin-bottom bg-gradient-to-t from-cyan-600/70 to-cyan-400 rounded-t-full shadow-md opacity-90 -translate-y-full"
            style={{ transform: "translate(-50%, -100%) rotate(240deg)" }}
          />
        </div>
      </div>

      {/* Fan Stand Neck & Base */}
      <div className="w-4 h-10 bg-gradient-to-b from-neutral-700 to-neutral-800 shadow-inner" />
      <div className="w-24 h-4 rounded-full bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-900 border-t border-neutral-600 shadow-lg flex items-center justify-center">
        <div className="w-8 h-1 bg-cyan-400/50 rounded-full" />
      </div>

      {/* Real-time Status Badge below Fan */}
      <div
        className="mt-4 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-md flex items-center space-x-2 transition-all duration-300"
        style={{
          backgroundColor: power ? "rgba(6, 182, 212, 0.15)" : "rgba(31, 41, 55, 0.8)",
          borderColor: power ? "#06b6d4" : "rgba(75, 85, 99, 0.5)",
          color: power ? "#38bdf8" : "#9ca3af",
        }}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            power ? "bg-cyan-400 animate-pulse" : "bg-neutral-600"
          }`}
        />
        <span>
          {power ? `${calculatedRPM} RPM (%${speed})` : "FAN DURDU"}
        </span>
      </div>
    </div>
  );
};
