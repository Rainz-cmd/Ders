"use client";

import React from "react";
import { Droplets, Power, Gauge, Waves, Sprout } from "lucide-react";
import { IrrigationState } from "@/lib/store";
import { playSwitchSound } from "@/lib/sound";

interface IrrigationControlsProps {
  irrigation: IrrigationState;
  onUpdate: (updates: Partial<IrrigationState>) => void;
}

export const IrrigationControls: React.FC<IrrigationControlsProps> = ({
  irrigation,
  onUpdate,
}) => {
  const handleToggle = () => {
    const nextPump = !irrigation.pump;
    playSwitchSound(nextPump);
    onUpdate({ pump: nextPump });
  };

  return (
    <div className="space-y-6">
      {/* Visualizer: Plant Soil & Moisture Gauge */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center justify-around gap-6">
        {/* Soil Moisture Meter */}
        <div className="flex flex-col items-center">
          <div className="relative w-36 h-36 rounded-full border-4 border-blue-500/30 flex items-center justify-center p-3">
            <div
              className="absolute inset-2 rounded-full border-4 border-emerald-400 transition-all duration-700"
              style={{
                clipPath: `polygon(0 ${100 - irrigation.soilMoisture}%, 100% ${100 - irrigation.soilMoisture}%, 100% 100%, 0 100%)`,
                backgroundColor: "rgba(16, 185, 129, 0.15)",
              }}
            />
            <div className="flex flex-col items-center z-10">
              <Sprout className="w-8 h-8 text-emerald-400 mb-1" />
              <span className="text-2xl font-extrabold font-mono text-white">
                %{irrigation.soilMoisture}
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">
                Toprak Nemi
              </span>
            </div>
          </div>
          <span className="mt-2 text-xs font-mono text-neutral-400">
            {irrigation.soilMoisture < irrigation.threshold ? "⚠️ Toprak Kuru (Sulama Gerekli)" : "✅ Nem Seviyesi İdeal"}
          </span>
        </div>

        {/* Water Tank */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-36 rounded-2xl border-2 border-blue-400/50 bg-neutral-900/90 relative overflow-hidden flex flex-col justify-end p-1 shadow-inner">
            <div
              className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-xl transition-all duration-500 relative"
              style={{ height: `${irrigation.waterTankLevel}%` }}
            >
              {irrigation.pump && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
            </div>
            <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs text-white drop-shadow">
              %{irrigation.waterTankLevel} Su
            </span>
          </div>
          <span className="mt-2 text-xs text-neutral-400 font-semibold uppercase">
            Su Deposu Seviyesi
          </span>
        </div>
      </div>

      {/* Master Pump Switch */}
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              irrigation.pump
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse"
                : "bg-neutral-800 text-neutral-500"
            }`}
          >
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Akıllı Sulama Pompası</h3>
            <p className="text-xs text-neutral-400">5V Mini Daldırma Su Pompası (GPIO 23)</p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all ${
            irrigation.pump
              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
              : "bg-neutral-800 text-neutral-400 border border-neutral-700"
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{irrigation.pump ? "SU POMPALIYOR" : "POMPA KAPALI"}</span>
        </button>
      </div>

      {/* Auto-Watering Threshold Settings */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
              Otomatik Sulama Eşik Değeri
            </span>
          </div>
          <span className="text-base font-bold font-mono text-blue-400">
            Nem &lt; %{irrigation.threshold}
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="70"
          value={irrigation.threshold}
          onChange={(e) => onUpdate({ threshold: Number(e.target.value) })}
          className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-400 mb-4"
        />

        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <span className="text-xs text-neutral-400">
            Toprak nemi eşiğin altına indiğinde pompayı otomatik devreye sok.
          </span>
          <button
            onClick={() => onUpdate({ autoWatering: !irrigation.autoWatering })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              irrigation.autoWatering
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-neutral-800 text-neutral-500 border-neutral-700"
            }`}
          >
            {irrigation.autoWatering ? "OTOMATİK AKTİF" : "MANUEL"}
          </button>
        </div>
      </div>
    </div>
  );
};
