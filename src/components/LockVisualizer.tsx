"use client";

import React from "react";
import { Lock, Unlock, ShieldAlert, ShieldCheck } from "lucide-react";

interface LockVisualizerProps {
  locked: boolean;
  angle: number;
  alarm: boolean;
}

export const LockVisualizer: React.FC<LockVisualizerProps> = ({
  locked,
  angle,
  alarm,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-8 select-none">
      {/* Background Security Glow */}
      <div
        className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full pointer-events-none transition-all duration-700 ease-out -z-10"
        style={{
          background: locked
            ? alarm
              ? "radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Heavy Mechanical Padlock SVG Body */}
      <div className="relative transition-transform duration-500 hover:scale-105">
        <svg
          viewBox="0 0 200 240"
          className="w-48 h-56 transition-all duration-500"
          style={{
            filter: locked
              ? "drop-shadow(0 0 25px rgba(239, 68, 68, 0.35))"
              : "drop-shadow(0 0 25px rgba(34, 197, 94, 0.4))",
          }}
        >
          {/* Shackle (Metal U-Bar) - Slides and opens when unlocked */}
          <path
            d={
              locked
                ? "M 60 120 L 60 70 A 40 40 0 0 1 140 70 L 140 120"
                : "M 60 90 L 60 40 A 40 40 0 0 1 140 40 L 140 70"
            }
            fill="none"
            stroke={locked ? "#cbd5e1" : "#86efac"}
            strokeWidth="18"
            strokeLinecap="round"
            className="transition-all duration-500"
          />

          {/* Solid Heavy Lock Body */}
          <rect
            x="35"
            y="110"
            width="130"
            height="110"
            rx="20"
            fill="url(#lockBodyGrad)"
            stroke={locked ? (alarm ? "#ef4444" : "#64748b") : "#22c55e"}
            strokeWidth="4"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="lockBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
          </defs>

          {/* Keyhole / Servo Core */}
          <circle cx="100" cy="155" r="14" fill="#020617" stroke="#475569" strokeWidth="2" />
          <path d="M 94 155 L 106 155 L 103 185 L 97 185 Z" fill="#020617" />

          {/* Servo Motor Rotation Indicator Arm */}
          <line
            x1="100"
            y1="155"
            x2={100 + Math.cos(((angle - 90) * Math.PI) / 180) * 20}
            y2={155 + Math.sin(((angle - 90) * Math.PI) / 180) * 20}
            stroke={locked ? "#ef4444" : "#22c55e"}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Status LED on lock */}
          <circle
            cx="145"
            cy="130"
            r="5"
            fill={locked ? "#ef4444" : "#22c55e"}
            className={locked && alarm ? "animate-ping" : ""}
          />
        </svg>

        {/* Real-time Status Badge */}
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-md flex items-center space-x-1.5 transition-all duration-300"
          style={{
            backgroundColor: locked ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
            borderColor: locked ? "#ef4444" : "#22c55e",
            color: locked ? "#fca5a5" : "#86efac",
          }}
        >
          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{locked ? `KİLİTLİ (${angle}°)` : "KİLİT AÇIK (0°)"}</span>
        </div>
      </div>
    </div>
  );
};
