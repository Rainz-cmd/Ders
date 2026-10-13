"use client";

import React, { useState } from "react";
import { Sparkles, Palette, Zap, Power, Flame, Waves, Radio, ShieldAlert } from "lucide-react";
import { RgbState } from "@/lib/store";
import { playSwitchSound } from "@/lib/sound";

interface RgbControlsProps {
  rgb: RgbState;
  onUpdate: (updates: Partial<RgbState>) => void;
}

export const RgbControls: React.FC<RgbControlsProps> = ({ rgb, onUpdate }) => {
  const [ledCount, setLedCount] = useState<number>(12);
  const [isDeneyapOnboard, setIsDeneyapOnboard] = useState<boolean>(false);

  const handleToggle = () => {
    const nextPower = !rgb.power;
    playSwitchSound(nextPower);
    onUpdate({ power: nextPower });
  };

  const effects = [
    { id: "rainbow" as const, label: "Gökkuşağı", icon: Sparkles },
    { id: "cyberwave" as const, label: "Siber Dalga", icon: Waves },
    { id: "fireplace" as const, label: "Şömine Ateşi", icon: Flame },
    { id: "police" as const, label: "Polis Çakarı", icon: ShieldAlert },
    { id: "solid" as const, label: "Sabit Renk", icon: Palette },
  ];

  const presets = [
    { name: "Sıcak Amber", hex: "#ffaa00" },
    { name: "Siber Mor", hex: "#8b5cf6" },
    { name: "Neon Pembe", hex: "#ec4899" },
    { name: "Okyanus Mavi", hex: "#06b6d4" },
    { name: "Zümrüt Yeşil", hex: "#10b981" },
    { name: "Kırmızı Alarm", hex: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* Visualizer: Realistic Multi-LED Ring & Strip Simulation */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col items-center relative overflow-hidden">
        {/* Ambient room bounce glow */}
        {rgb.power && (
          <div
            className="absolute inset-0 opacity-45 blur-2xl pointer-events-none transition-all duration-700"
            style={{
              background:
                rgb.effect === "rainbow"
                  ? "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)"
                  : rgb.effect === "fireplace"
                  ? "linear-gradient(90deg, #ef4444, #f97316, #eab308)"
                  : rgb.effect === "police"
                  ? "linear-gradient(90deg, #ef4444, #3b82f6)"
                  : rgb.color,
            }}
          />
        )}

        {/* LED Strip Enclosure */}
        <div className="w-full max-w-lg p-3 rounded-2xl bg-neutral-950/90 border-2 border-neutral-700/80 shadow-2xl flex items-center justify-between gap-1.5 relative z-10 overflow-x-auto">
          {[...Array(ledCount)].map((_, i) => {
            let ledColor = rgb.color;
            if (rgb.effect === "rainbow") {
              ledColor = `hsl(${(i * (360 / ledCount) + Date.now() / 20) % 360}, 100%, 55%)`;
            } else if (rgb.effect === "fireplace") {
              ledColor = i % 2 === 0 ? "#f97316" : "#ef4444";
            } else if (rgb.effect === "police") {
              ledColor = i < ledCount / 2 ? "#ef4444" : "#3b82f6";
            }

            return (
              <div
                key={i}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-600/80 shrink-0 transition-all duration-300 relative flex items-center justify-center"
                style={{
                  backgroundColor: rgb.power ? ledColor : "#1e293b",
                  boxShadow: rgb.power
                    ? `0 0 16px ${ledColor}, 0 0 25px rgba(255,255,255,0.4)`
                    : "none",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-inner" />
              </div>
            );
          })}
        </div>

        {/* Board & Count Info */}
        <div className="mt-4 flex flex-wrap items-center justify-between w-full max-w-lg text-xs text-neutral-400">
          <span className="font-mono font-bold text-purple-300">
            {isDeneyapOnboard
              ? "DENEYAP KART DAHİLİ RGB LED (LEDR, LEDG, LEDB)"
              : `WS2812B ADRESLENEBİLİR LED BAR (${ledCount} LED)`}
          </span>
          <div className="flex items-center space-x-1 font-mono">
            <span>Adet:</span>
            {[8, 12, 16, 24].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setLedCount(cnt)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  ledCount === cnt ? "bg-purple-500 text-white font-bold" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Master Switch & Mode Selector */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <h3 className="text-base font-bold text-white">Adreslenebilir RGB Ambiyans LED</h3>
            <p className="text-xs text-neutral-400">WS2812B NeoPixel Şerit & Deneyap Dahili RGB LED</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Deneyap Onboard Mode Toggle */}
          <button
            onClick={() => setIsDeneyapOnboard(!isDeneyapOnboard)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isDeneyapOnboard
                ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm"
                : "bg-neutral-800 text-neutral-400 border-neutral-700"
            }`}
          >
            {isDeneyapOnboard ? "Deneyap Dahili LED Aktif" : "Harici WS2812B Şerit"}
          </button>

          <button
            onClick={handleToggle}
            className={`px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all ${
              rgb.power
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                : "bg-neutral-800 text-neutral-400 border border-neutral-700"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{rgb.power ? "AKTİF" : "KAPALI"}</span>
          </button>
        </div>
      </div>

      {/* Effects Selector */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Animasyon & Işık Modları
          </span>
          <span className="text-xs font-mono text-purple-400 uppercase font-bold">
            {rgb.effect}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {effects.map((item) => {
            const Icon = item.icon;
            const isActive = rgb.effect === item.id && rgb.power;
            return (
              <button
                key={item.id}
                disabled={!rgb.power}
                onClick={() => onUpdate({ effect: item.id as any })}
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
        <div className="flex items-center space-x-3 pt-3 border-t border-neutral-800">
          <input
            type="color"
            value={rgb.color}
            disabled={!rgb.power}
            onChange={(e) => onUpdate({ color: e.target.value, effect: "solid" })}
            className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 shrink-0"
          />
          <div className="flex-1 flex gap-2 overflow-x-auto">
            {presets.map((c) => (
              <button
                key={c.hex}
                disabled={!rgb.power}
                onClick={() => onUpdate({ color: c.hex, effect: "solid" })}
                title={c.name}
                className={`w-8 h-8 rounded-xl border-2 transition-transform hover:scale-110 shrink-0 ${
                  rgb.color.toLowerCase() === c.hex.toLowerCase() && rgb.power
                    ? "border-white shadow-md scale-105"
                    : "border-transparent opacity-80"
                } disabled:opacity-30`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
