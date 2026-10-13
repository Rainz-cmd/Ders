"use client";

import React from "react";

interface LampVisualizerProps {
  power: boolean;
  brightness: number;
  color: string;
  mode: string;
}

export const LampVisualizer: React.FC<LampVisualizerProps> = ({
  power,
  brightness,
  color,
  mode,
}) => {
  const opacityRatio = power ? brightness / 100 : 0;
  const glowSpread = power ? Math.max(10, Math.round(brightness * 1.5)) : 0;

  // Determine dynamic animation class
  const getAnimationClass = () => {
    if (!power) return "";
    if (mode === "breathe") return "animate-pulse";
    if (mode === "strobe") return "animate-ping";
    return "";
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 select-none">
      {/* Background radial light spill across the room */}
      <div
        className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full pointer-events-none transition-all duration-700 ease-out -z-10"
        style={{
          backgroundColor: color,
          opacity: opacityRatio * 0.35,
          filter: `blur(${Math.max(40, glowSpread)}px)`,
          transform: `scale(${power ? 1 + brightness / 250 : 0.6})`,
        }}
      />

      {/* Ceiling hanging wire */}
      <div className="w-1.5 h-16 bg-gradient-to-b from-gray-700 via-gray-600 to-gray-800 rounded-sm shadow-md" />

      {/* Lamp Socket / Fitting */}
      <div className="relative z-10 w-16 h-8 bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-900 rounded-t-lg border-t border-neutral-500 shadow-lg flex flex-col items-center justify-center">
        <div className="w-12 h-1 bg-yellow-600/40 rounded-full mb-1" />
        <div className="w-14 h-1 bg-neutral-900 rounded-full" />
      </div>

      {/* Light Bulb Body */}
      <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
        <svg
          viewBox="0 0 200 240"
          className={`w-48 h-56 transition-all duration-500 ${getAnimationClass()}`}
          style={{
            filter: power
              ? `drop-shadow(0 0 ${glowSpread}px ${color}) drop-shadow(0 0 15px rgba(255,255,255,0.4))`
              : "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
          }}
        >
          {/* Defs for gradients */}
          <defs>
            <radialGradient id="bulbGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={power ? color : "#374151"} stopOpacity={power ? opacityRatio : 0.2} />
              <stop offset="70%" stopColor={power ? color : "#1f2937"} stopOpacity={power ? opacityRatio * 0.6 : 0.05} />
              <stop offset="100%" stopColor="#111827" stopOpacity="0.05" />
            </radialGradient>
            <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={power ? "0.4" : "0.15"} />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Bulb Outer Glass Silhouette */}
          <path
            d="M 60 40 
               C 60 20, 140 20, 140 40 
               C 140 70, 180 85, 180 130 
               C 180 180, 145 210, 125 215 
               L 75 215 
               C 55 210, 20 180, 20 130 
               C 20 85, 60 70, 60 40 Z"
            fill="url(#bulbGlow)"
            stroke={power ? color : "#4b5563"}
            strokeWidth={power ? "3" : "1.5"}
            className="transition-colors duration-500"
          />

          {/* Internal Filament Support Rods */}
          <line x1="85" y1="215" x2="85" y2="130" stroke={power ? "#fbbf24" : "#4b5563"} strokeWidth="2" opacity="0.6" />
          <line x1="115" y1="215" x2="115" y2="130" stroke={power ? "#fbbf24" : "#4b5563"} strokeWidth="2" opacity="0.6" />

          {/* Glowing Filament Coil */}
          <path
            d="M 85 130 Q 100 110, 115 130 Q 100 95, 85 130"
            fill="none"
            stroke={power ? "#ffffff" : "#374151"}
            strokeWidth={power ? "3.5" : "1.5"}
            strokeLinecap="round"
            className="transition-all duration-300"
            style={{
              filter: power ? `drop-shadow(0 0 8px #ffffff) drop-shadow(0 0 16px ${color})` : "none",
            }}
          />

          {/* Glass Highlight Reflection Curves */}
          <path
            d="M 38 120 C 38 90, 65 60, 80 50"
            fill="none"
            stroke="url(#glassReflection)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>

        {/* Real-time Status Badge below bulb */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-md flex items-center space-x-1.5 transition-all duration-300"
             style={{
               backgroundColor: power ? `${color}25` : "rgba(31, 41, 55, 0.8)",
               borderColor: power ? color : "rgba(75, 85, 99, 0.5)",
               color: power ? "#ffffff" : "#9ca3af",
             }}>
          <span
            className={`w-2 h-2 rounded-full ${
              power ? "animate-pulse" : "bg-neutral-600"
            }`}
            style={{ backgroundColor: power ? color : undefined }}
          />
          <span>{power ? `${brightness}% AÇIK` : "KAPALI"}</span>
        </div>
      </div>
    </div>
  );
};
