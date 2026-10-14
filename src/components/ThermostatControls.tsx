"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Thermometer,
  Flame,
  Snowflake,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Gauge,
  Sliders,
  TrendingUp,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { ThermostatState } from "@/lib/store";

interface ThermostatControlsProps {
  thermostat: ThermostatState;
  onUpdate: (updates: Partial<ThermostatState>) => void;
}

export const ThermostatControls: React.FC<ThermostatControlsProps> = ({
  thermostat,
  onUpdate,
}) => {
  const isHot = thermostat.currentTemp > thermostat.thresholdTemp;

  // Rolling history for live temperature SVG chart (up to 18 points)
  const [history, setHistory] = useState<number[]>([
    23.5, 23.8, 24.0, 24.1, 24.2, 24.0, 24.3, thermostat.currentTemp,
  ]);

  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev, thermostat.currentTemp];
      if (next.length > 20) return next.slice(next.length - 20);
      return next;
    });
  }, [thermostat.currentTemp]);

  const minTemp = useMemo(() => Math.min(...history), [history]);
  const maxTemp = useMemo(() => Math.max(...history), [history]);
  const avgTemp = useMemo(
    () => (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1),
    [history]
  );

  // SVG Chart path calculation
  const chartPoints = useMemo(() => {
    const width = 360;
    const height = 90;
    const padding = 10;
    const min = 15;
    const max = 40;

    const coords = history.map((val, idx) => {
      const x = padding + (idx / Math.max(1, history.length - 1)) * (width - padding * 2);
      const clamped = Math.min(max, Math.max(min, val));
      const y = height - padding - ((clamped - min) / (max - min)) * (height - padding * 2);
      return `${x},${y}`;
    });

    const thresholdY =
      height -
      padding -
      ((Math.min(max, Math.max(min, thermostat.thresholdTemp)) - min) / (max - min)) *
        (height - padding * 2);

    return {
      linePath: `M ${coords.join(" L ")}`,
      areaPath: `M ${coords[0]} L ${coords.join(" L ")} L ${coords[coords.length - 1].split(",")[0]},${height - padding} L ${coords[0].split(",")[0]},${height - padding} Z`,
      thresholdY,
      width,
      height,
    };
  }, [history, thermostat.thresholdTemp]);

  // Thermometer mercury height calculation (range 15°C to 40°C -> 0% to 100%)
  const mercuryPercent = Math.min(
    100,
    Math.max(0, ((thermostat.currentTemp - 15) / (40 - 15)) * 100)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO BANNER: DUAL-STATE CLIMATE RADAR */}
      <div
        className={`glass-panel rounded-3xl p-6 md:p-8 border transition-all duration-700 relative overflow-hidden ${
          isHot
            ? "border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.3)] bg-gradient-to-br from-red-950/50 via-neutral-900 to-neutral-950"
            : "border-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.3)] bg-gradient-to-br from-cyan-950/50 via-neutral-900 to-neutral-950"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* Left: Temperature readout & dynamic status */}
          <div className="flex items-center space-x-6">
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl relative ${
                isHot
                  ? "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white animate-pulse shadow-red-500/40"
                  : "bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 text-white shadow-cyan-500/40"
              }`}
            >
              {isHot ? <Flame className="w-12 h-12" /> : <Snowflake className="w-12 h-12" />}
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isHot ? "bg-red-400" : "bg-cyan-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-4 w-4 ${
                    isHot ? "bg-red-500" : "bg-cyan-500"
                  }`}
                />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <span className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
                  {thermostat.currentTemp.toFixed(1)}
                  <span className="text-2xl md:text-3xl font-sans text-neutral-400 font-normal ml-1">
                    °C
                  </span>
                </span>

                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border flex items-center space-x-1.5 shadow-sm ${
                    isHot
                      ? "bg-red-500/20 text-red-300 border-red-500/50"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isHot ? "bg-red-400 animate-ping" : "bg-cyan-400"
                    }`}
                  />
                  <span>
                    {isHot
                      ? `SICAK (> ${thermostat.thresholdTemp}°C) -> KIRMIZI LED`
                      : `SERİN (<= ${thermostat.thresholdTemp}°C) -> MAVİ LED`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono">
                <span>
                  Eşik: <strong className="text-yellow-400">{thermostat.thresholdTemp}°C</strong>
                </span>
                <span>•</span>
                <span>
                  Sensör: <strong className="text-white">{thermostat.sensorType}</strong>
                </span>
                <span>•</span>
                <span>
                  Kart: <strong className="text-purple-300">TÜBİTAK Deneyap Kart 1A v2</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Realistic 3D Breadboard Diodes & Onboard NeoPixel Preview */}
          <div className="flex items-center space-x-6 bg-neutral-950/80 p-5 rounded-3xl border border-neutral-800 shadow-xl backdrop-blur-md">
            {/* 1. RED LED SIMULATION */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    thermostat.redLed
                      ? "bg-red-500 border-red-200 shadow-[0_0_35px_#ef4444,0_0_70px_#dc2626] scale-110"
                      : "bg-red-950/30 border-neutral-800 opacity-40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full ${
                      thermostat.redLed ? "bg-white shadow-[0_0_10px_#fff]" : "bg-red-900/60"
                    }`}
                  />
                </div>
                {thermostat.redLed && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}
              </div>
              <div className="text-center">
                <span
                  className={`text-xs font-mono font-bold block ${
                    thermostat.redLed ? "text-red-400 font-extrabold" : "text-neutral-500"
                  }`}
                >
                  KIRMIZI LED (D4)
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {thermostat.redLed ? "HIGH (AÇIK)" : "LOW (KAPALI)"}
                </span>
              </div>
            </div>

            <div className="h-12 w-px bg-neutral-800" />

            {/* 2. BLUE LED SIMULATION */}
            <div className="flex flex-col items-center space-y-2">
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    thermostat.blueLed
                      ? "bg-blue-500 border-cyan-200 shadow-[0_0_35px_#06b6d4,0_0_70px_#3b82f6] scale-110"
                      : "bg-blue-950/30 border-neutral-800 opacity-40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full ${
                      thermostat.blueLed ? "bg-white shadow-[0_0_10px_#fff]" : "bg-blue-900/60"
                    }`}
                  />
                </div>
                {thermostat.blueLed && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                  </span>
                )}
              </div>
              <div className="text-center">
                <span
                  className={`text-xs font-mono font-bold block ${
                    thermostat.blueLed ? "text-cyan-400 font-extrabold" : "text-neutral-500"
                  }`}
                >
                  MAVİ LED (D5)
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {thermostat.blueLed ? "HIGH (AÇIK)" : "LOW (KAPALI)"}
                </span>
              </div>
            </div>

            <div className="h-12 w-px bg-neutral-800" />

            {/* 3. DENEYAP ONBOARD NEOPIXEL (RGBLED) */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-14 h-14 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center ${
                  isHot
                    ? "bg-red-600/30 border-red-400 shadow-[0_0_30px_#ef4444]"
                    : "bg-blue-600/30 border-blue-400 shadow-[0_0_30px_#3b82f6]"
                }`}
              >
                <Sparkles
                  className={`w-6 h-6 ${isHot ? "text-red-400 animate-pulse" : "text-blue-400"}`}
                />
              </div>
              <div className="text-center">
                <span className="text-xs font-mono font-bold text-purple-300 block">
                  Dahili NeoPixel
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {isHot ? "RGB(255,0,0)" : "RGB(0,0,255)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Ambient Light Bleed */}
        <div
          className={`absolute -right-24 -bottom-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700 ${
            isHot ? "bg-red-600" : "bg-cyan-600"
          }`}
        />
      </div>

      {/* 2. MAIN INTERACTIVE CONTROL MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Glass Mercury Thermometer & Live Sparkline Chart (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Glass Mercury Thermometer Widget */}
          <div className="glass-panel rounded-3xl p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sm text-white">Cıvalı Termometre Göstergesi</h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">15°C — 40°C</span>
            </div>

            <div className="flex items-center justify-center py-4 space-x-8">
              {/* Glass Thermometer Tube */}
              <div className="relative w-12 h-64 bg-neutral-900 rounded-full p-2 border-2 border-neutral-700 shadow-inner flex flex-col justify-end items-center">
                {/* Calibration Tick Marks */}
                <div className="absolute inset-y-4 -left-7 flex flex-col justify-between text-[10px] font-mono text-neutral-500 text-right w-6">
                  <span>40°</span>
                  <span>35°</span>
                  <span>30°</span>
                  <span className="text-yellow-400 font-bold">25°</span>
                  <span>20°</span>
                  <span>15°</span>
                </div>

                {/* 25°C Threshold Red Indicator Line */}
                <div
                  className="absolute w-16 h-0.5 bg-yellow-400 -left-2 z-20 pointer-events-none opacity-80"
                  style={{ bottom: "40%" }}
                  title="25°C Kritik Eşik"
                />

                {/* Liquid Mercury Column */}
                <div
                  className={`w-6 rounded-full transition-all duration-500 relative ${
                    isHot
                      ? "bg-gradient-to-t from-red-600 via-rose-500 to-amber-400 shadow-[0_0_20px_#ef4444]"
                      : "bg-gradient-to-t from-blue-600 via-cyan-500 to-teal-300 shadow-[0_0_20px_#06b6d4]"
                  }`}
                  style={{ height: `${Math.max(8, mercuryPercent)}%` }}
                >
                  <div className="w-full h-2 rounded-t-full bg-white/40" />
                </div>

                {/* Mercury Bottom Bulb */}
                <div
                  className={`absolute -bottom-4 w-14 h-14 rounded-full border-2 border-neutral-700 transition-all duration-500 flex items-center justify-center ${
                    isHot
                      ? "bg-red-600 shadow-[0_0_30px_#ef4444]"
                      : "bg-cyan-500 shadow-[0_0_30px_#06b6d4]"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white/30 animate-pulse" />
                </div>
              </div>

              {/* Status Explanation */}
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] uppercase font-mono font-bold">
                    Mevcut Durum
                  </span>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {isHot ? "🔥 Sıcaklık Eşiğin Üstünde" : "❄️ Oda Sıcaklığı / Serin"}
                  </p>
                  <p className="text-neutral-400 text-[11px] mt-1 leading-snug">
                    {isHot
                      ? "D4 pini tetiklendi, Kırmızı LED 5V/3.3V veriyor. Mavi LED kapandı."
                      : "D5 pini tetiklendi, Mavi LED devrede. Kırmızı LED sıfır voltajda."}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 font-mono text-[11px] text-neutral-300">
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Ölçülen:</span>
                    <span className="text-white font-bold">{thermostat.currentTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Hedef Eşik:</span>
                    <span className="text-yellow-400 font-bold">{thermostat.thresholdTemp}°C</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Fark (ΔT):</span>
                    <span className={isHot ? "text-red-400 font-bold" : "text-cyan-400 font-bold"}>
                      {(thermostat.currentTemp - thermostat.thresholdTemp > 0 ? "+" : "") +
                        (thermostat.currentTemp - thermostat.thresholdTemp).toFixed(1)}
                      °C
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time SVG Sparkline / History Trend Chart */}
          <div className="glass-panel rounded-3xl p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                  Canlı Sıcaklık Grafiği (Trend)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">Son 20 Ölçüm</span>
            </div>

            {/* SVG Wave */}
            <div className="w-full bg-neutral-950/80 rounded-2xl p-2 border border-neutral-800/80 relative overflow-hidden">
              <svg
                viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
                className="w-full h-24 overflow-visible"
              >
                <defs>
                  <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isHot ? "#ef4444" : "#06b6d4"} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={isHot ? "#ef4444" : "#06b6d4"} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* 25°C Threshold Line */}
                <line
                  x1="0"
                  y1={chartPoints.thresholdY}
                  x2={chartPoints.width}
                  y2={chartPoints.thresholdY}
                  stroke="#eab308"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />

                {/* Area Gradient */}
                <path d={chartPoints.areaPath} fill="url(#tempAreaGrad)" />

                {/* Line Path */}
                <path
                  d={chartPoints.linePath}
                  fill="none"
                  stroke={isHot ? "#ef4444" : "#06b6d4"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 px-2 pt-1 border-t border-neutral-800/60 mt-1">
                <span>
                  Min: <strong className="text-cyan-400">{minTemp.toFixed(1)}°C</strong>
                </span>
                <span>
                  Ort: <strong className="text-yellow-400">{avgTemp}°C</strong>
                </span>
                <span>
                  Max: <strong className="text-red-400">{maxTemp.toFixed(1)}°C</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Controls, Simulation Presets & Wiring (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Temperature Slider & Quick Presets */}
          <div className="glass-panel rounded-3xl p-6 border border-neutral-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sm text-white">
                  Oda Sıcaklığı Ayarı & Canlı Simülatör
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-700 text-sm font-mono font-bold text-yellow-400 shadow-sm">
                {thermostat.currentTemp.toFixed(1)} °C
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Kartınız veya sensörünüz bağlı değilken hocaya demo yapmak için bu kaydırıcıyı kullanın.
              25.0°C sınırını aştığınız an sistem otomatik olarak Kırmızı ve Mavi LED durumlarını
              yeniden hesaplar:
            </p>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min="15"
                max="40"
                step="0.1"
                value={thermostat.currentTemp}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdate({
                    currentTemp: val,
                    redLed: val > thermostat.thresholdTemp,
                    blueLed: val <= thermostat.thresholdTemp,
                  });
                }}
                className="w-full h-3.5 bg-gradient-to-r from-blue-600 via-cyan-400 via-amber-400 to-red-600 rounded-lg appearance-none cursor-pointer accent-yellow-400 shadow-inner"
              />

              <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                <span>15.0°C (Serin)</span>
                <span className="text-yellow-400 font-bold">25.0°C (Proje Eşiği)</span>
                <span>40.0°C (Aşırı Sıcak)</span>
              </div>
            </div>

            {/* 5 One-Click Scenario Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-mono font-semibold text-neutral-400 block mb-2">
                Tek Tıkla Test Senaryoları (Hoca Sunumu İçin):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "❄️ Kış (17°C)", temp: 17.0 },
                  { label: "🌤️ Oda (23.5°C)", temp: 23.5 },
                  { label: "⚡ Sınır (25.1°C)", temp: 25.1 },
                  { label: "🔥 Sıcak (29°C)", temp: 29.0 },
                  { label: "🌋 Alarm (36°C)", temp: 36.0 },
                ].map((item) => (
                  <button
                    key={item.temp}
                    onClick={() =>
                      onUpdate({
                        currentTemp: item.temp,
                        redLed: item.temp > thermostat.thresholdTemp,
                        blueLed: item.temp <= thermostat.thresholdTemp,
                      })
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      Math.abs(thermostat.currentTemp - item.temp) < 0.2
                        ? "bg-yellow-500 text-neutral-950 border-yellow-400 font-bold shadow-md scale-105"
                        : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Threshold Adjustment & Sensor Hardware Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Threshold Box */}
            <div className="glass-panel rounded-2xl p-5 border border-neutral-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-200">Tetikleme Eşik Değeri</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Proje şartnamesi: 25.0°C
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    const newT = Math.max(15, thermostat.thresholdTemp - 0.5);
                    onUpdate({
                      thresholdTemp: newT,
                      redLed: thermostat.currentTemp > newT,
                      blueLed: thermostat.currentTemp <= newT,
                    });
                  }}
                  className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-bold hover:bg-neutral-800 flex items-center justify-center text-base"
                >
                  -
                </button>
                <div className="flex-1 text-center font-mono font-extrabold text-xl text-yellow-400">
                  {thermostat.thresholdTemp.toFixed(1)}°C
                </div>
                <button
                  onClick={() => {
                    const newT = Math.min(35, thermostat.thresholdTemp + 0.5);
                    onUpdate({
                      thresholdTemp: newT,
                      redLed: thermostat.currentTemp > newT,
                      blueLed: thermostat.currentTemp <= newT,
                    });
                  }}
                  className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-bold hover:bg-neutral-800 flex items-center justify-center text-base"
                >
                  +
                </button>
              </div>
            </div>

            {/* Sensor Selection Box */}
            <div className="glass-panel rounded-2xl p-5 border border-neutral-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-200">Donanım Sensör Tipi</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Breadboard üzerindeki sensör
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {(["DHT11", "NTC"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdate({ sensorType: s })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      thermostat.sensorType === s
                        ? "bg-yellow-500 text-neutral-950 border-yellow-400 shadow-sm"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {s === "DHT11" ? "DHT11 (Dijital)" : "NTC / LM35"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deneyap 1A v2 Onboard NeoPixel Test & Fix Explanation */}
          <div className="glass-panel rounded-3xl p-6 border border-purple-500/30 bg-purple-950/20 space-y-4">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm text-purple-200">
                Deneyap Kart 1A v2 Dahili LED Düzeltmesi (WS2812B Fix)
              </h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Deneyap Kart 1A v2 üzerindeki dahili LED, klasik 3 pinli LED değil{" "}
              <strong>adreslenebilir WS2812B NeoPixel</strong> çipidir. Klasik{" "}
              <code className="text-yellow-400 font-mono">digitalWrite</code> komutları veri hattını
              bozduğu için donanım sarı renkte kilitleniyordu. Çözüm ESP32 çekirdeğinde yerleşik olan{" "}
              <code className="text-emerald-400 font-mono">neopixelWrite(RGBLED, r, g, b)</code>{" "}
              kullanımıdır.
            </p>

            {/* Quick Test Buttons for Onboard NeoPixel */}
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
              <button
                onClick={() =>
                  onUpdate({
                    currentTemp: 27.5,
                    redLed: true,
                    blueLed: false,
                  })
                }
                className="py-2 px-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-all text-center"
              >
                🔴 Kırmızı Yak (25°C Üstü)
              </button>

              <button
                onClick={() =>
                  onUpdate({
                    currentTemp: 22.0,
                    redLed: false,
                    blueLed: true,
                  })
                }
                className="py-2 px-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all text-center"
              >
                🔵 Mavi Yak (25°C Altı)
              </button>

              <button
                onClick={() =>
                  onUpdate({
                    currentTemp: 24.8,
                    redLed: false,
                    blueLed: true,
                  })
                }
                className="py-2 px-3 rounded-xl bg-neutral-900 text-neutral-300 border border-neutral-800 hover:text-white transition-all text-center"
              >
                🔄 Sıfırla (24.8°C)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BREADBOARD WIRING & PIN MATRIX GUIDE */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-neutral-800">
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              Breadboard Devre Kurulumu & Kablo Bağlantı Matrisi
            </h3>
            <p className="text-xs text-neutral-400">
              Bu projeyi breadboard üzerinde kurarken Deneyap Kart 1A v2 ve ESP32 için takip edilecek bağlantılar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* DHT11 Card */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-400 text-sm">1. DHT11 Sensör</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">
                  Sıcaklık
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans mb-3">
                3 bacaklı modülde orta bacak sinyaldir. 4 bacaklı ham sensörde 10K pull-up direnç kullanılır.
              </p>
            </div>
            <div className="space-y-1 text-[11px] border-t border-neutral-800 pt-2 text-neutral-300">
              <div>VCC -&gt; 3.3V</div>
              <div>GND -&gt; GND</div>
              <div className="text-yellow-400 font-bold">DATA -&gt; Deneyap D2 (ESP32 GPIO 4)</div>
            </div>
          </div>

          {/* Red LED Card */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-red-400 text-sm">2. Kırmızı LED (&gt;25°C)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300">
                  Dirençli
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans mb-3">
                Uzun bacak anot (+), kısa bacak katottur (-). Aşırı akımı önlemek için 220Ω seri direnç ekleyin.
              </p>
            </div>
            <div className="space-y-1 text-[11px] border-t border-neutral-800 pt-2 text-neutral-300">
              <div className="text-red-400 font-bold">Anot (+) -&gt; 220Ω Direnç -&gt; Deneyap D4</div>
              <div>Katot (-) -&gt; GND (Eksi Rayı)</div>
            </div>
          </div>

          {/* Blue LED Card */}
          <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-cyan-400 text-sm">3. Mavi LED (&lt;=25°C)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">
                  Dirençli
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans mb-3">
                Sıcaklık 25°C ve altına indiğinde otomatik yanar. Anot bacağına 220Ω direnç bağlanmalıdır.
              </p>
            </div>
            <div className="space-y-1 text-[11px] border-t border-neutral-800 pt-2 text-neutral-300">
              <div className="text-cyan-400 font-bold">Anot (+) -&gt; 220Ω Direnç -&gt; Deneyap D5</div>
              <div>Katot (-) -&gt; GND (Eksi Rayı)</div>
            </div>
          </div>
        </div>

        {/* Live Code Logic Box */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300">
          <div className="flex items-center justify-between text-yellow-400 font-bold mb-2">
            <span>// CANLI ÇALIŞAN C++ MANTIĞI (DENEYAP KART 1A v2):</span>
            <span className="text-[11px] text-neutral-500">Milisaniyede Karar Döngüsü</span>
          </div>
          <pre className="text-neutral-400 leading-relaxed overflow-x-auto">
{`float sicaklik = dht.readTemperature(); // Ölçülen: ${thermostat.currentTemp.toFixed(1)} °C
if (sicaklik > ${thermostat.thresholdTemp.toFixed(1)}) {
    digitalWrite(D4, HIGH); // KIRMIZI LED AÇIK
    digitalWrite(D5, LOW);  // MAVİ LED KAPALI
    neopixelWrite(RGBLED, 255, 0, 0); // Deneyap Dahili NeoPixel Kıpkırmızı
} else {
    digitalWrite(D4, LOW);  // KIRMIZI LED KAPALI
    digitalWrite(D5, HIGH); // MAVİ LED AÇIK
    neopixelWrite(RGBLED, 0, 0, 255); // Deneyap Dahili NeoPixel Masmavi
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
