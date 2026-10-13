"use client";

import React from "react";
import { Fan, Wind, Gauge, Thermometer, Power } from "lucide-react";
import { FanState } from "@/lib/store";
import { playFanSound } from "@/lib/sound";

interface FanControlsProps {
  fan: FanState;
  onUpdate: (updates: Partial<FanState>) => void;
}

export const FanControls: React.FC<FanControlsProps> = ({ fan, onUpdate }) => {
  const handleToggle = () => {
    const nextPower = !fan.power;
    playFanSound(nextPower ? fan.speed : 0);
    onUpdate({ power: nextPower });
  };

  const handleSpeedChange = (speed: number) => {
    playFanSound(speed);
    onUpdate({ speed });
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle Bar */}
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              fan.power
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                : "bg-neutral-800 text-neutral-500 border border-neutral-700"
            }`}
          >
            <Fan className={`w-6 h-6 ${fan.power ? "animate-spin" : ""}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Akıllı Fan / Havalandırma</h3>
            <p className="text-xs text-neutral-400">PWM Motor Sürücü & Röle Kontrolü</p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all ${
            fan.power
              ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30"
              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{fan.power ? "ÇALIŞIYOR" : "KAPALI"}</span>
        </button>
      </div>

      {/* Speed Slider */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
              Fan Hızı / PWM Gücü
            </span>
          </div>
          <span className="text-xl font-bold font-mono text-cyan-400">
            {fan.power ? `%${fan.speed}` : "%0"}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="100"
          value={fan.speed}
          disabled={!fan.power}
          onChange={(e) => handleSpeedChange(Number(e.target.value))}
          className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40 accent-cyan-400 mb-4"
          style={{
            background: `linear-gradient(to right, #06b6d4 0%, #38bdf8 ${fan.speed}%, #262626 ${fan.speed}%, #262626 100%)`,
          }}
        />

        {/* Speed Presets */}
        <div className="grid grid-cols-4 gap-2">
          {[25, 50, 75, 100].map((val) => (
            <button
              key={val}
              disabled={!fan.power}
              onClick={() => handleSpeedChange(val)}
              className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                fan.speed === val && fan.power
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                  : "bg-neutral-800/60 text-neutral-400 border-neutral-700/50 hover:bg-neutral-700/60 hover:text-neutral-200"
              } disabled:opacity-40`}
            >
              %{val}
            </button>
          ))}
        </div>
      </div>

      {/* Mode & Temperature Threshold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Modes */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-neutral-300 uppercase">Çalışma Modu</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "manual" as const, label: "Manuel" },
              { id: "auto" as const, label: "Oto Klima" },
              { id: "eco" as const, label: "Eko" },
            ].map((m) => (
              <button
                key={m.id}
                disabled={!fan.power}
                onClick={() => onUpdate({ mode: m.id })}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  fan.mode === m.id && fan.power
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm"
                    : "bg-neutral-800/60 text-neutral-400 border-neutral-700/60"
                } disabled:opacity-40`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature Reading */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Thermometer className="w-6 h-6 text-cyan-400" />
            <div>
              <span className="text-xs text-neutral-400 block">Ortam Sensörü (DHT11)</span>
              <span className="text-base font-bold font-mono text-white">
                {fan.currentTemp}°C / Hedef: {fan.targetTemp}°C
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            AUTO TRIGGER
          </span>
        </div>
      </div>
    </div>
  );
};
