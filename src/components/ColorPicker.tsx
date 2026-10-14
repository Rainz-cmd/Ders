"use client";

import React from "react";
import { Palette, Sparkles, Cpu, Check } from "lucide-react";

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
  // Deneyap Kart 1A v2 Dahili WS2812B NeoPixel ve Harici RGB LED Destekli Renk Paleti
  const presetColors = [
    { name: "Deneyap Kırmızı", hex: "#ff0000", r: 255, g: 0, b: 0 },
    { name: "Deneyap Yeşil", hex: "#00ff00", r: 0, g: 255, b: 0 },
    { name: "Deneyap Mavi", hex: "#0000ff", r: 0, g: 0, b: 255 },
    { name: "Güneş Sarısı", hex: "#ffff00", r: 255, g: 255, b: 0 },
    { name: "Turkuaz / Cyan", hex: "#00ffff", r: 0, g: 255, b: 255 },
    { name: "Siber Magenta", hex: "#ff00ff", r: 255, g: 0, b: 255 },
    { name: "Saf Kristal Beyaz", hex: "#ffffff", r: 255, g: 255, b: 255 },
    { name: "Sıcak Gün Işığı", hex: "#ffb703", r: 255, g: 183, b: 3 },
    { name: "Ateş Turuncusu", hex: "#ff5500", r: 255, g: 85, b: 0 },
    { name: "Neon Mor", hex: "#8a2be2", r: 138, g: 43, b: 226 },
  ];

  // Hex to RGB parser helper
  const hexToRgb = (hex: string) => {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(cleanHex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const currentRgb = hexToRgb(color);

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Deneyap RGB & Ambiyans Rengi
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className="w-4 h-4 rounded-full border border-white/40 shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: color, color }}
          />
          <span className="text-xs font-mono font-bold text-neutral-300 uppercase">
            {color}
          </span>
        </div>
      </div>

      {/* Preset Swatches */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
        {presetColors.map((item) => {
          const isSelected = color.toLowerCase() === item.hex.toLowerCase();
          return (
            <button
              key={item.hex}
              disabled={!power}
              onClick={() => onChange(item.hex)}
              title={`${item.name} (${item.hex})`}
              className={`w-full aspect-square rounded-xl transition-all duration-200 flex items-center justify-center border-2 relative group ${
                isSelected && power
                  ? "scale-110 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)] z-10"
                  : "border-transparent hover:scale-105 opacity-80 hover:opacity-100"
              } disabled:opacity-30 disabled:pointer-events-none`}
              style={{ backgroundColor: item.hex }}
            >
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 ${
                    item.hex === "#ffffff" || item.hex === "#ffff00" || item.hex === "#00ffff"
                      ? "text-black"
                      : "text-white"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Color Input & Deneyap NeoPixel Live Command Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Custom Color Picker Input */}
        <div className="flex items-center space-x-3 bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
          <input
            type="color"
            value={color}
            disabled={!power}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 p-0 disabled:opacity-40"
          />
          <div>
            <span className="text-xs font-semibold text-neutral-200 block">Özel Renk Seç</span>
            <span className="text-[10px] text-neutral-400 font-mono">
              R:{currentRgb.r} G:{currentRgb.g} B:{currentRgb.b}
            </span>
          </div>
        </div>

        {/* Deneyap 1A v2 Onboard NeoPixel Command Indicator */}
        <div className="flex items-center space-x-2.5 bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/30 font-mono text-[11px]">
          <Cpu className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <div className="overflow-hidden">
            <span className="text-[10px] text-purple-300 block font-sans font-bold">
              Deneyap 1A v2 Dahili LED Kodu:
            </span>
            <code className="text-emerald-400 truncate block">
              neopixelWrite(RGBLED, {power ? currentRgb.r : 0}, {power ? currentRgb.g : 0}, {power ? currentRgb.b : 0});
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
