"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Volume2,
  VolumeX,
  Code2,
  Timer,
  Zap,
  Activity,
  Github,
  Globe,
} from "lucide-react";
import { LampVisualizer } from "@/components/LampVisualizer";
import { PowerToggle } from "@/components/PowerToggle";
import { BrightnessSlider } from "@/components/BrightnessSlider";
import { ColorPicker } from "@/components/ColorPicker";
import { ModeSelector } from "@/components/ModeSelector";
import { EspStatusCard } from "@/components/EspStatusCard";
import { EventLogs, LogEntry } from "@/components/EventLogs";
import { TimerModal } from "@/components/TimerModal";
import { EspCodeModal } from "@/components/EspCodeModal";
import { LampState, DeviceTelemetry } from "@/lib/store";

export default function HomePage() {
  const [lamp, setLamp] = useState<LampState>({
    power: false,
    brightness: 100,
    color: "#ffb703",
    mode: "solid",
    speed: 5,
    autoOffTime: null,
    lastUpdated: Date.now(),
  });

  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    online: false,
    lastSeen: 0,
    ip: "192.168.1.X",
    rssi: 0,
    deviceType: "ESP32 / Deneyap",
    uptimeSeconds: 0,
  });

  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [vercelUrl, setVercelUrl] = useState<string>("");

  const isUpdatingRef = useRef(false);

  // Helper to add log entries
  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const newEntry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        message,
        type,
      };
      setLogs((prev) => [newEntry, ...prev.slice(0, 49)]);
    },
    []
  );

  // Detect current host for Vercel URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      setVercelUrl(window.location.origin);
    }
  }, []);

  // Fetch current state from API
  const syncState = useCallback(async () => {
    if (isUpdatingRef.current) return;
    try {
      const start = performance.now();
      const [lampRes, teleRes] = await Promise.all([
        fetch("/api/lamp", { cache: "no-store" }),
        fetch("/api/heartbeat", { cache: "no-store" }),
      ]);

      const roundTrip = Math.round(performance.now() - start);
      setLatencyMs(roundTrip);

      if (lampRes.ok) {
        const lampData = (await lampRes.json()) as LampState;
        setLamp((prev) => {
          // If power state changed remotely, log it
          if (prev.power !== lampData.power) {
            addLog(
              `Lamba durumu uzaktan güncellendi: ${lampData.power ? "AÇIK" : "KAPALI"}`,
              lampData.power ? "success" : "warn"
            );
          }
          return lampData;
        });
      }

      if (teleRes.ok) {
        const teleData = (await teleRes.json()) as DeviceTelemetry;
        setTelemetry(teleData);
      }
    } catch {
      // Offline / network failure handling
    }
  }, [addLog]);

  // Initial load and background polling interval
  useEffect(() => {
    syncState();
    addLog("Web kontrol paneli başlatıldı. Vercel Serverless hazır.", "info");

    const interval = setInterval(() => {
      syncState();
    }, 2500);

    return () => clearInterval(interval);
  }, [syncState, addLog]);

  // Push updates to API
  const pushUpdate = async (updates: Partial<LampState>) => {
    isUpdatingRef.current = true;
    const nextState = { ...lamp, ...updates, lastUpdated: Date.now() };
    setLamp(nextState);

    try {
      const res = await fetch("/api/lamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.state) setLamp(data.state);
      }
    } catch (err) {
      addLog("Sunucuya istek gönderilirken hata oluştu!", "error");
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 300);
    }
  };

  // Toggle Power
  const handlePowerToggle = (newPower: boolean) => {
    pushUpdate({ power: newPower });
    addLog(
      `Lamba ${newPower ? "AÇILDI" : "KAPATILDI"} (Röle tetiklendi)`,
      newPower ? "success" : "warn"
    );

    if (newPower) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#facc15", "#eab308", "#fbbf24"],
      });
    }
  };

  // Brightness Change
  const handleBrightnessChange = (brightness: number) => {
    pushUpdate({ brightness });
    addLog(`Parlaklık %${brightness} olarak ayarlandı.`, "info");
  };

  // Color Change
  const handleColorChange = (color: string) => {
    pushUpdate({ color });
    addLog(`Renk değiştirildi: ${color.toUpperCase()}`, "info");
  };

  // Mode Change
  const handleModeChange = (mode: "solid" | "breathe" | "strobe" | "rainbow") => {
    pushUpdate({ mode });
    addLog(`Işık efekti seçildi: ${mode.toUpperCase()}`, "info");
  };

  // Speed Change
  const handleSpeedChange = (speed: number) => {
    pushUpdate({ speed });
  };

  // Timer Set
  const handleSetTimer = (targetTimestamp: number | null) => {
    pushUpdate({ autoOffTime: targetTimestamp });
    if (targetTimestamp) {
      const diffMins = Math.round((targetTimestamp - Date.now()) / 60000);
      addLog(`Otomatik kapanma ${diffMins} dakika sonraya ayarlandı.`, "warn");
    } else {
      addLog("Otomatik kapanma zamanlayıcısı iptal edildi.", "info");
    }
  };

  return (
    <main className="min-h-screen text-white pb-16 selection:bg-yellow-500/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-neutral-950 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-yellow-300 via-amber-200 to-white bg-clip-text text-transparent">
                  ESP32 KONTROL
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  DERS PROJESİ
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                ESP32 & Deneyap Kart Bulut Otomasyonu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? "bg-neutral-800/80 border-neutral-700 text-yellow-400"
                  : "bg-neutral-900 border-neutral-800 text-neutral-500"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Timer Button */}
            <button
              onClick={() => setShowTimerModal(true)}
              title="Zamanlayıcı"
              className={`p-2 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-semibold ${
                lamp.autoOffTime
                  ? "bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                  : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white"
              }`}
            >
              <Timer className="w-4 h-4" />
              <span className="hidden sm:inline">Zamanlayıcı</span>
            </button>

            {/* Code / Wiring Button */}
            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>ESP32 Kodu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Banner with status and Vercel link */}
        <div className="mb-8 p-4 rounded-2xl glass-panel border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-neutral-300">
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  telemetry.online ? "bg-emerald-400 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-semibold">
                ESP32 Durumu:{" "}
                <span className={telemetry.online ? "text-emerald-400" : "text-red-400"}>
                  {telemetry.online ? "Kart Bağlı & Dinliyor" : "Bağlantı Bekleniyor (Offline)"}
                </span>
              </span>
            </div>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400 hidden md:inline">
              REST Endpoint: <code className="text-yellow-400 font-mono">/api/lamp</code>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <a
              href="https://github.com/Rainz-cmd/Ders"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>GitHub: Rainz-cmd/Ders</span>
            </a>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Lamp & Primary Toggle (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
              {/* Lamp Visualizer with real-time glow and animations */}
              <LampVisualizer
                power={lamp.power}
                brightness={lamp.brightness}
                color={lamp.color}
                mode={lamp.mode}
              />

              {/* Master Power Toggle Button */}
              <div className="mt-8 mb-4 w-full flex justify-center">
                <PowerToggle power={lamp.power} onToggle={handlePowerToggle} />
              </div>
            </div>

            {/* Quick Action Cards (Timer status & presets) */}
            <div className="glass-panel rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-yellow-400" />
                <span className="text-neutral-300">
                  {lamp.autoOffTime
                    ? "Otomatik Kapanma Devrede"
                    : "Zamanlayıcı Kapalı"}
                </span>
              </div>
              <button
                onClick={() => setShowTimerModal(true)}
                className="text-yellow-400 hover:underline font-semibold"
              >
                {lamp.autoOffTime ? "Düzenle" : "Zamanlayıcı Kur"}
              </button>
            </div>
          </div>

          {/* Right Column: Controls, Telemetry & Logs (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Brightness & Dimmer */}
            <BrightnessSlider
              brightness={lamp.brightness}
              power={lamp.power}
              onChange={handleBrightnessChange}
            />

            {/* Color & Ambient Lighting */}
            <ColorPicker
              color={lamp.color}
              power={lamp.power}
              onChange={handleColorChange}
            />

            {/* Modes (Solid, Breathe, Strobe, Party) */}
            <ModeSelector
              mode={lamp.mode}
              speed={lamp.speed}
              power={lamp.power}
              onModeChange={handleModeChange}
              onSpeedChange={handleSpeedChange}
            />

            {/* ESP32 Hardware Status Card */}
            <EspStatusCard
              telemetry={telemetry}
              latencyMs={latencyMs}
              onRefresh={syncState}
              onOpenCode={() => setShowCodeModal(true)}
            />

            {/* Activity Logs */}
            <EventLogs logs={logs} onClear={() => setLogs([])} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTimerModal && (
        <TimerModal
          autoOffTime={lamp.autoOffTime}
          onSetTimer={handleSetTimer}
          onClose={() => setShowTimerModal(false)}
        />
      )}

      {showCodeModal && (
        <EspCodeModal
          onClose={() => setShowCodeModal(false)}
          vercelUrl={vercelUrl}
        />
      )}
    </main>
  );
}
