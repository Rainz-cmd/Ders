"use client";

import React from "react";
import { Sparkles, Palette, Zap, Power, Flame, Waves } from "lucide-react";
import { RgbState } from "@/lib/store";
import { playSwitchSound } from "@/lib/sound";

interface RgbControlsProps {
  rgb: RgbState;
  onUpdate: (updates: Partial<RgbState>) => void;
}

export const RgbControls: React.FC<RgbControlsProps> = ({ rgb, onUpdate }) => {
  const handleToggle = () => {
    const nextPower = !rgb.power;
    playSwitchSound(nextPower);
    onUpdate({ power: nextPower });
  };

  const effects = [
    { id: "rainbow" as const, label: "Gökkuşağı", icon: Sparkles },
    { id: "cyberwave" as const, label: "Siber Dalga", icon: Waves },
    { id: "fireplace" as const, label: "Şömine", icon: Flame },
    { id: "solid" as const, label: "Sabit Renk", icon: Palette },
  ];

  const presets = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Visualizer: Realistic 8-LED NeoPixel Bar */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center">
        <div className="w-full max-w-md h-14 rounded-2xl bg-neutral-900 border-2 border-neutral-700/80 p-2 flex items-center justify-between shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          {rgb.power && (
            <div
              className="absolute inset-0 opacity-40 blur-xl pointer-events-none transition-all duration-500"
              style={{
                background:
                  rgb.effect === "rainbow"
                    ? "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)"
                    : rgb.effect === "fireplace"
                    ? "linear-gradient(90deg, #ef4444, #f97316, #eab308)"
                    : rgb.color,
              }}
            />
          )}

          {/* 8 NeoPixel LEDs */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border border-neutral-600 transition-all duration-300 relative"
              style={{
                backgroundColor: rgb.power
                  ? rgb.effect === "rainbow"
                    ? `hsl(${(i * 45 + Date.now() / 20) % 360}, 100%, 55%)`
                    : rgb.color
                  : "#1e293b",
                boxShadow: rgb.power
                  ? `0 0 16px ${rgb.color}, 0 0 25px rgba(255,255,255,0.4)`
                  : "none",
              }}
            >
              <div className="absolute inset-1 rounded-full bg-white/30" />
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
          WS2812B NEOPİXEL AMBİYANS IŞIĞI (GPIO 5)
        </div>
      </div>

      {/* Master Toggle */}
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              rgb.power
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                : "bg-neutral-800 text-neutral-500"
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">RGB Ambiyans & Masa LED&apos;i</h3>
            <p className="text-xs text-neutral-400">Adreslenebilir WS2812B / NeoPixel LED Bar</p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all ${
            rgb.power
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{rgb.power ? "AKTİF" : "KAPALI"}</span>
        </button>
      </div>

      {/* Effects Selector */}
      <div className="glass-panel rounded-2xl p-6">
        <span className="text-xs font-semibold text-neutral-300 uppercase block mb-3">
          Işık Efektleri
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {effects.map((item) => {
            const Icon = item.icon;
            const isActive = rgb.effect === item.id && rgb.power;
            return (
              <button
                key={item.id}
                disabled={!rgb.power}
                onClick={() => onUpdate({ effect: item.id })}
                className={`p-3 rounded-xl flex flex-col items-center justify-center space-y-1.5 border transition-all ${
                  isActive
                    ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                    : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white"
                } disabled:opacity-40`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Color Presets */}
        <div className="flex items-center space-x-2 pt-2 border-t border-neutral-800">
          <input
            type="color"
            value={rgb.color}
            disabled={!rgb.power}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
          />
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {presets.map((c) => (
              <button
                key={c}
                disabled={!rgb.power}
                onClick={() => onUpdate({ color: c, effect: "solid" })}
                className="w-7 h-7 rounded-lg border border-neutral-600 disabled:opacity-40"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
