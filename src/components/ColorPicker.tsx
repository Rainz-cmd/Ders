"use client";

import React from "react";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  power: boolean;
  onChange: (hex: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  power,
  onChange,
}) => {
  const presetColors = [
    { name: "Sıcak Sarı", hex: "#ffb703" },
    { name: "Gün Işığı", hex: "#fff3b0" },
    { name: "Neon Mavi", hex: "#00b4d8" },
    { name: "Siber Mor", hex: "#7209b7" },
    { name: "Kırmızı Alarm", hex: "#e63946" },
    { name: "Zümrüt Yeşil", hex: "#2a9d8f" },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Renk & Ambiyans
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-mono text-neutral-400 uppercase">
            {color}
          </span>
        </div>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-6 gap-2 mb-4">
        {presetColors.map((item) => (
          <button
            key={item.hex}
            disabled={!power}
            onClick={() => onChange(item.hex)}
            title={item.name}
            className={`w-full aspect-square rounded-xl transition-all duration-200 flex items-center justify-center border-2 ${
              color.toLowerCase() === item.hex.toLowerCase() && power
                ? "scale-110 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
            } disabled:opacity-30 disabled:pointer-events-none`}
            style={{ backgroundColor: item.hex }}
          />
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center space-x-3 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
        <input
          type="color"
          value={color}
          disabled={!power}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 disabled:opacity-40"
        />
        <span className="text-xs text-neutral-400">
          Özel Renk Seç (WS2812B / RGB LED)
        </span>
      </div>
    </div>
  );
};
