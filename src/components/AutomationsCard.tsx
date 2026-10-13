"use client";

import React from "react";
import { Cpu, Zap, Moon, CheckCircle2 } from "lucide-react";
import { AutomationsState, AllDevicesState } from "@/lib/store";

interface AutomationsCardProps {
  automations: AutomationsState;
  onUpdate: (updates: Partial<AllDevicesState>) => void;
}

export const AutomationsCard: React.FC<AutomationsCardProps> = ({
  automations,
  onUpdate,
}) => {
  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Akıllı Otomasyon Kuralları (IFTTT)
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Rule 1: Temp Auto Fan */}
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-white block">Sıcaklık Kontrollü Havalandırma</span>
              <span className="text-[11px] text-neutral-400">Oda sıcaklığı &gt; 26°C olduğunda fanı otomatik çalıştır</span>
            </div>
          </div>
          <button
            onClick={() =>
              onUpdate({
                automations: { ...automations, tempAutoFan: !automations.tempAutoFan },
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              automations.tempAutoFan
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                : "bg-neutral-800 text-neutral-500 border-neutral-700"
            }`}
          >
            {automations.tempAutoFan ? "DEVREDE" : "PASİF"}
          </button>
        </div>

        {/* Rule 2: Soil Auto Pump */}
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white block">Toprak Nemi & Otomatik Sulama</span>
              <span className="text-[11px] text-neutral-400">Toprak nemi &lt; %35 olduğunda mini su pompasını aç</span>
            </div>
          </div>
          <button
            onClick={() =>
              onUpdate({
                automations: { ...automations, soilAutoPump: !automations.soilAutoPump },
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              automations.soilAutoPump
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400"
                : "bg-neutral-800 text-neutral-500 border-neutral-700"
            }`}
          >
            {automations.soilAutoPump ? "DEVREDE" : "PASİF"}
          </button>
        </div>

        {/* Rule 3: Night Mode Scenario */}
        <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Moon className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-white block">Gece Emniyet & Uyku Senaryosu</span>
              <span className="text-[11px] text-neutral-400">Lambayı %20 loş yap, kapıyı kilitle, emniyeti al</span>
            </div>
          </div>
          <button
            onClick={() =>
              onUpdate({
                automations: { ...automations, nightMode: !automations.nightMode },
                lamp: {
                  power: true,
                  brightness: 20,
                  color: "#ffb703",
                  mode: "solid",
                  speed: 5,
                  autoOffTime: null,
                  lastUpdated: Date.now(),
                },
                lock: {
                  locked: true,
                  angle: 90,
                  autoLockSeconds: 10,
                  alarm: false,
                  lastUpdated: Date.now(),
                },
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              automations.nightMode
                ? "bg-purple-500/20 text-purple-300 border-purple-400"
                : "bg-neutral-800 text-neutral-500 border-neutral-700"
            }`}
          >
            {automations.nightMode ? "AKTİF" : "TETİKLE"}
          </button>
        </div>
      </div>
    </div>
  );
};
