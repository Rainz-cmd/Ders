"use client";

import React from "react";
import { Thermometer, Droplets, Wifi, Activity, Database } from "lucide-react";
import { AllDevicesState } from "@/lib/store";

interface TelemetryGaugesProps {
  state: AllDevicesState;
  latencyMs: number;
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ state, latencyMs }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Canlı Sensör & Telemetri Göstergeleri
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          REALTIME
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Gauge 1: Temperature */}
        <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Sıcaklık (DHT11)</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-xl font-bold font-mono text-cyan-400">
            {state.fan.currentTemp}°C
          </span>
          <span className="text-[10px] text-neutral-500 mt-1">Eşik: {state.fan.targetTemp}°C</span>
        </div>

        {/* Gauge 2: Soil Moisture */}
        <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Toprak Nemi</span>
            <Droplets className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-xl font-bold font-mono text-emerald-400">
            %{state.irrigation.soilMoisture}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1">Eşik: %{state.irrigation.threshold}</span>
        </div>

        {/* Gauge 3: Wi-Fi RSSI */}
        <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Wi-Fi Gücü</span>
            <Wifi className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="text-xl font-bold font-mono text-yellow-400">
            {state.telemetry.rssi ? `${state.telemetry.rssi} dBm` : "- dBm"}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1">ESP32 2.4GHz</span>
        </div>

        {/* Gauge 4: Latency */}
        <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Bulut Gecikmesi</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold font-mono text-purple-400">
            {latencyMs > 0 ? `${latencyMs} ms` : "---"}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1">Vercel Edge</span>
        </div>
      </div>
    </div>
  );
};
