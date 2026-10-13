"use client";

import React from "react";
import { Cpu, Wifi, WifiOff, Clock, Terminal, RefreshCw } from "lucide-react";
import { DeviceTelemetry } from "@/lib/store";

interface EspStatusCardProps {
  telemetry: DeviceTelemetry;
  latencyMs: number;
  onRefresh: () => void;
  onOpenCode: () => void;
}

export const EspStatusCard: React.FC<EspStatusCardProps> = ({
  telemetry,
  latencyMs,
  onRefresh,
  onOpenCode,
}) => {
  const getSignalQuality = (rssi: number) => {
    if (rssi === 0) return { label: "Bilinmiyor", color: "text-neutral-500" };
    if (rssi >= -60) return { label: "Mükemmel", color: "text-emerald-400" };
    if (rssi >= -75) return { label: "İyi", color: "text-yellow-400" };
    return { label: "Zayıf", color: "text-red-400" };
  };

  const signal = getSignalQuality(telemetry.rssi);

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0 dk";
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours} sa ${mins % 60} dk`;
    return `${mins} dk`;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <Cpu className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            ESP32 / Deneyap Kart Durumu
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            title="Yenile"
            className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border flex items-center space-x-1.5 ${
              telemetry.online
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.online ? "bg-emerald-400 animate-pulse" : "bg-red-500"
              }`}
            />
            <span>{telemetry.online ? "ONLİNE (BAĞLI)" : "BEKLENİYOR"}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
        {/* IP Address */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-neutral-500 block mb-0.5">Cihaz IP</span>
          <span className="font-mono text-neutral-200 font-medium">
            {telemetry.ip || "192.168.1.X"}
          </span>
        </div>

        {/* Signal RSSI */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-neutral-500 flex items-center space-x-1 mb-0.5">
            {telemetry.rssi ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-neutral-500" />}
            <span>Wi-Fi Sinyali</span>
          </span>
          <span className={`font-mono font-medium ${signal.color}`}>
            {telemetry.rssi ? `${telemetry.rssi} dBm (${signal.label})` : "Bağlantı Yok"}
          </span>
        </div>

        {/* Latency */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-neutral-500 flex items-center space-x-1 mb-0.5">
            <Clock className="w-3 h-3 text-yellow-400" />
            <span>Bulut Gecikmesi</span>
          </span>
          <span className="font-mono text-yellow-400 font-medium">
            {latencyMs > 0 ? `${latencyMs} ms` : "---"}
          </span>
        </div>

        {/* Uptime */}
        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-neutral-500 block mb-0.5">Çalışma Süresi</span>
          <span className="font-mono text-neutral-200 font-medium">
            {formatUptime(telemetry.uptimeSeconds)}
          </span>
        </div>
      </div>

      <button
        onClick={onOpenCode}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 border border-neutral-600/50 text-neutral-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-sm"
      >
        <Terminal className="w-4 h-4 text-yellow-400" />
        <span>ESP32 / Deneyap C++ Kodunu ve Şemasını Görüntüle</span>
      </button>
    </div>
  );
};
