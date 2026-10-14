"use client";

import React from "react";
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

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-time Decision Engine */}
      <div
        className={`glass-panel rounded-3xl p-6 border transition-all duration-500 relative overflow-hidden ${
          isHot
            ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.25)] bg-gradient-to-br from-red-950/40 via-neutral-900 to-neutral-950"
            : "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.25)] bg-gradient-to-br from-cyan-950/40 via-neutral-900 to-neutral-950"
        }`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* Temperature & State Readout */}
          <div className="flex items-center space-x-5">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${
                isHot
                  ? "bg-gradient-to-tr from-red-600 to-amber-500 text-white animate-pulse"
                  : "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white"
              }`}
            >
              {isHot ? <Flame className="w-10 h-10" /> : <Snowflake className="w-10 h-10" />}
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-4xl font-extrabold font-mono tracking-tight text-white">
                  {thermostat.currentTemp.toFixed(1)}°C
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isHot
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  }`}
                >
                  {isHot ? "SICAK (>25°C) -> KIRMIZI LED" : "SERİN (<=25°C) -> MAVİ LED"}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Eşik Sıcaklığı: <strong className="text-yellow-400">{thermostat.thresholdTemp}°C</strong> |
                Sensör Modu: <strong className="text-white">{thermostat.sensorType}</strong> |
                Hedef Kart: <strong className="text-purple-300">Deneyap Kart 1A v2</strong>
              </p>
            </div>
          </div>

          {/* Dual LED Physical Simulation Indicator */}
          <div className="flex items-center space-x-6 bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800">
            {/* RED LED */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  thermostat.redLed
                    ? "bg-red-500 border-red-300 shadow-[0_0_30px_#ef4444] scale-110"
                    : "bg-red-950/40 border-neutral-800 opacity-40"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full ${
                    thermostat.redLed ? "bg-white animate-ping" : "bg-red-900"
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-mono font-bold ${
                  thermostat.redLed ? "text-red-400 font-extrabold" : "text-neutral-500"
                }`}
              >
                KIRMIZI LED (D4)
              </span>
              <span className="text-[10px] text-neutral-400">
                {thermostat.redLed ? "AKTİF (YANIK)" : "KAPALI"}
              </span>
            </div>

            <div className="h-10 w-px bg-neutral-800" />

            {/* BLUE LED */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  thermostat.blueLed
                    ? "bg-blue-500 border-cyan-300 shadow-[0_0_30px_#3b82f6] scale-110"
                    : "bg-blue-950/40 border-neutral-800 opacity-40"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full ${
                    thermostat.blueLed ? "bg-white animate-ping" : "bg-blue-900"
                  }`}
                />
              </div>
              <span
                className={`text-[11px] font-mono font-bold ${
                  thermostat.blueLed ? "text-cyan-400 font-extrabold" : "text-neutral-500"
                }`}
              >
                MAVİ LED (D5)
              </span>
              <span className="text-[10px] text-neutral-400">
                {thermostat.blueLed ? "AKTİF (YANIK)" : "KAPALI"}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div
          className={`absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isHot ? "bg-red-600" : "bg-cyan-600"
          }`}
        />
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Temperature Simulation Slider */}
          <div className="glass-panel rounded-2xl p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <Thermometer className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sm text-white">Canlı Oda Sıcaklığı Simülasyonu</h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-yellow-300">
                {thermostat.currentTemp.toFixed(1)} °C
              </span>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Gerçek sensör bağlıyken bu değer Deneyap Kart'tan otomatik gelir. Kart bağlı değilken
              aşağıdaki kaydırıcıyla test edip sistemin 25°C sınırında anında Kırmızı / Mavi LED
              geçişini inceleyebilirsiniz:
            </p>

            <input
              type="range"
              min="15"
              max="40"
              step="0.5"
              value={thermostat.currentTemp}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdate({
                  currentTemp: val,
                  redLed: val > thermostat.thresholdTemp,
                  blueLed: val <= thermostat.thresholdTemp,
                });
              }}
              className="w-full h-3 bg-gradient-to-r from-blue-500 via-cyan-400 via-amber-400 to-red-500 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />

            <div className="flex justify-between text-[11px] font-mono text-neutral-500 mt-2">
              <span>15°C (Buz Gibi)</span>
              <span className="text-yellow-400 font-bold">25°C (Kritik Eşik Noktası)</span>
              <span>40°C (Aşırı Sıcak)</span>
            </div>

            {/* Quick Temp Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[
                { label: "18°C (Serin)", val: 18.0 },
                { label: "24°C (Sınır Altı)", val: 24.0 },
                { label: "25.5°C (Sınır Üstü)", val: 25.5 },
                { label: "32°C (Sıcak)", val: 32.0 },
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() =>
                    onUpdate({
                      currentTemp: btn.val,
                      redLed: btn.val > thermostat.thresholdTemp,
                      blueLed: btn.val <= thermostat.thresholdTemp,
                    })
                  }
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    Math.abs(thermostat.currentTemp - btn.val) < 0.3
                      ? "bg-yellow-500 text-neutral-950 border-yellow-400 font-bold"
                      : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold & Sensor Type Settings */}
          <div className="glass-panel rounded-2xl p-6 border border-neutral-800 space-y-5">
            <div className="flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-sm text-white">Sistem Parametreleri & Eşik Ayarı</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Threshold Selector */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-300">Tetikleme Eşiği</span>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Varsayılan: 25.0°C (Proje Şartı)
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-3">
                  <button
                    onClick={() => {
                      const newThresh = Math.max(15, thermostat.thresholdTemp - 1);
                      onUpdate({
                        thresholdTemp: newThresh,
                        redLed: thermostat.currentTemp > newThresh,
                        blueLed: thermostat.currentTemp <= newThresh,
                      });
                    }}
                    className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-bold hover:bg-neutral-800 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-base text-yellow-400">
                    {thermostat.thresholdTemp}°C
                  </span>
                  <button
                    onClick={() => {
                      const newThresh = Math.min(35, thermostat.thresholdTemp + 1);
                      onUpdate({
                        thresholdTemp: newThresh,
                        redLed: thermostat.currentTemp > newThresh,
                        blueLed: thermostat.currentTemp <= newThresh,
                      });
                    }}
                    className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-bold hover:bg-neutral-800 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sensor Selector */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
                <span className="text-xs font-semibold text-neutral-300">Kullanılan Sensör</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">Breadboard Donanım Tipi</p>
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {(["DHT11", "NTC"] as const).map((sensor) => (
                    <button
                      key={sensor}
                      onClick={() => onUpdate({ sensorType: sensor })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        thermostat.sensorType === sensor
                          ? "bg-yellow-500 text-neutral-950 border-yellow-400"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {sensor === "DHT11" ? "DHT11 Dijital" : "NTC / LM35"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Deneyap 1A v2 Fix Explanation Card */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start space-x-3 text-xs">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-200">
                  Deneyap Kart 1A v2 Dahili LED Neden Sadece Sarı Yanıyordu? (ÇÖZÜMÜ)
                </span>
                <p className="text-neutral-400 mt-1 leading-relaxed">
                  Deneyap 1A v2 üzerindeki dahili RGB LED klasik 3 pinli LED değil, <strong>adreslenebilir WS2812B NeoPixel</strong> çipidir (Pin: <code className="text-purple-300 font-mono">RGBLED</code> / <code className="text-purple-300 font-mono">D9</code>). Standart <code className="text-neutral-300 font-mono">digitalWrite</code> sinyali gönderildiğinde veri protokolü bozulduğu için donanımsal olarak kehribar/sarı renkte kilitleniyordu.
                </p>
                <p className="text-emerald-400 font-mono mt-2 font-semibold">
                  Fix: neopixelWrite(RGBLED, 255, 0, 0); // Kırmızı
                  <br />
                  Fix: neopixelWrite(RGBLED, 0, 0, 255); // Mavi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Breadboard Connection Guide & Circuit Pinout (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-neutral-800">
            <div className="flex items-center space-x-2.5 mb-4">
              <Cpu className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-sm text-white">Breadboard Bağlantı Şeması</h3>
            </div>

            {/* Wiring Table */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-red-400 font-bold">🔴 Kırmızı LED (+)</span>
                  <p className="text-[10px] text-neutral-500">220Ω Direnç Serisi</p>
                </div>
                <span className="px-2 py-1 rounded bg-neutral-900 text-yellow-400 border border-neutral-700">
                  Deneyap D4 (GPIO 16)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">🔵 Mavi LED (+)</span>
                  <p className="text-[10px] text-neutral-500">220Ω Direnç Serisi</p>
                </div>
                <span className="px-2 py-1 rounded bg-neutral-900 text-yellow-400 border border-neutral-700">
                  Deneyap D5 (GPIO 17)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-300 font-bold">🌡️ DHT11 Sinyal</span>
                  <p className="text-[10px] text-neutral-500">Ortadaki DATA Bacağı</p>
                </div>
                <span className="px-2 py-1 rounded bg-neutral-900 text-yellow-400 border border-neutral-700">
                  Deneyap D2 (GPIO 4)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">✨ Dahili NeoPixel</span>
                  <p className="text-[10px] text-neutral-500">Kartın Üzerindeki LED</p>
                </div>
                <span className="px-2 py-1 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                  RGBLED (neopixelWrite)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 font-bold">⚡ Besleme & Toprak</span>
                  <p className="text-[10px] text-neutral-500">Sensör & LED Ortak Hattı</p>
                </div>
                <span className="px-2 py-1 rounded bg-neutral-900 text-neutral-300 border border-neutral-700">
                  3.3V & GND
                </span>
              </div>
            </div>

            {/* Quick Circuit ASCII Logic */}
            <div className="mt-4 p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono text-[11px] text-neutral-400 leading-relaxed overflow-x-auto">
              <span className="text-yellow-400 font-bold">// C++ ALGORİTMA MANTIĞI:</span>
              <br />
              {"float t = dht.readTemperature();"}
              <br />
              {"if (t > 25.0) {"}
              <br />
              {"  digitalWrite(D4, HIGH); // Kırmızı LED AÇIK"}
              <br />
              {"  digitalWrite(D5, LOW);  // Mavi LED KAPALI"}
              <br />
              {"  neopixelWrite(RGBLED, 255, 0, 0); // Dahili Kırmızı"}
              <br />
              {"} else {"}
              <br />
              {"  digitalWrite(D4, LOW);  // Kırmızı LED KAPALI"}
              <br />
              {"  digitalWrite(D5, HIGH); // Mavi LED AÇIK"}
              <br />
              {"  neopixelWrite(RGBLED, 0, 0, 255); // Dahili Mavi"}
              <br />
              {"}"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
