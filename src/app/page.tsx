"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Code2,
  Timer,
  Zap,
  Activity,
  Github,
  Fan as FanIcon,
  Lightbulb,
  Lock as LockIcon,
  BookOpen,
} from "lucide-react";
import { LampVisualizer } from "@/components/LampVisualizer";
import { PowerToggle } from "@/components/PowerToggle";
import { BrightnessSlider } from "@/components/BrightnessSlider";
import { ColorPicker } from "@/components/ColorPicker";
import { ModeSelector } from "@/components/ModeSelector";
import { FanVisualizer } from "@/components/FanVisualizer";
import { FanControls } from "@/components/FanControls";
import { LockVisualizer } from "@/components/LockVisualizer";
import { LockControls } from "@/components/LockControls";
import { GuideSection } from "@/components/GuideSection";
import { EspStatusCard } from "@/components/EspStatusCard";
import { EventLogs, LogEntry } from "@/components/EventLogs";
import { TimerModal } from "@/components/TimerModal";
import { EspCodeModal } from "@/components/EspCodeModal";
import { AllDevicesState, LampState, FanState, LockState, DeviceTelemetry } from "@/lib/store";

export default function HomePage() {
  const [activeDevice, setActiveDevice] = useState<"lamp" | "fan" | "lock" | "guide">("lamp");

  const [state, setState] = useState<AllDevicesState>({
    lamp: {
      power: false,
      brightness: 100,
      color: "#ffb703",
      mode: "solid",
      speed: 5,
      autoOffTime: null,
      lastUpdated: Date.now(),
    },
    fan: {
      power: false,
      speed: 50,
      mode: "manual",
      targetTemp: 26,
      currentTemp: 24,
      oscillation: false,
      lastUpdated: Date.now(),
    },
    lock: {
      locked: true,
      angle: 90,
      autoLockSeconds: 10,
      alarm: false,
      lastUpdated: Date.now(),
    },
    telemetry: {
      online: false,
      lastSeen: 0,
      ip: "192.168.1.X",
      rssi: 0,
      deviceType: "ESP32 / Deneyap",
      uptimeSeconds: 0,
    },
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVercelUrl(window.location.origin);
    }
  }, []);

  // Optimized Unified Device Synchronization
  const syncDevices = useCallback(async () => {
    if (isUpdatingRef.current) return;
    try {
      const start = performance.now();
      const res = await fetch("/api/devices", { cache: "no-store" });
      const roundTrip = Math.round(performance.now() - start);
      setLatencyMs(roundTrip);

      if (res.ok) {
        const data = (await res.json()) as AllDevicesState;
        setState((prev) => {
          if (prev.lamp.power !== data.lamp.power) {
            addLog(`Lamba: ${data.lamp.power ? "AÇIK" : "KAPALI"}`, data.lamp.power ? "success" : "warn");
          }
          if (prev.fan.power !== data.fan.power) {
            addLog(`Fan: ${data.fan.power ? "ÇALIŞIYOR" : "DURDU"}`, data.fan.power ? "success" : "warn");
          }
          if (prev.lock.locked !== data.lock.locked) {
            addLog(`Kapı Kilidi: ${data.lock.locked ? "KİLİTLENDİ" : "AÇILDI"}`, data.lock.locked ? "warn" : "success");
          }
          return data;
        });
      }
    } catch {}
  }, [addLog]);

  // Background polling with tab-visibility optimization
  useEffect(() => {
    syncDevices();
    addLog("Sistem aktif. 3 Cihaz ve Donanım Telemetrisi hazır.", "info");

    const interval = setInterval(() => {
      // Don't poll aggressively if user switched tab
      if (typeof document !== "undefined" && document.hidden) return;
      syncDevices();
    }, 2000);

    return () => clearInterval(interval);
  }, [syncDevices, addLog]);

  // Unified Push Update
  const pushUpdate = async (updates: Partial<AllDevicesState>) => {
    isUpdatingRef.current = true;
    setState((prev) => ({ ...prev, ...updates }));

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.state) setState(data.state);
      }
    } catch {
      addLog("Buluta bağlanırken hata oluştu!", "error");
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 250);
    }
  };

  // Lamp handlers
  const handleLampUpdate = (lampUpdates: Partial<LampState>) => {
    pushUpdate({ lamp: { ...state.lamp, ...lampUpdates } });
  };

  const handleLampPowerToggle = (newPower: boolean) => {
    handleLampUpdate({ power: newPower });
    addLog(`Lamba ${newPower ? "AÇILDI" : "KAPATILDI"}`, newPower ? "success" : "warn");
    if (newPower) {
      import("canvas-confetti")
        .then((module) => {
          module.default({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#facc15", "#eab308", "#fbbf24"],
          });
        })
        .catch(() => {});
    }
  };

  // Fan handlers
  const handleFanUpdate = (fanUpdates: Partial<FanState>) => {
    pushUpdate({ fan: { ...state.fan, ...fanUpdates } });
  };

  // Lock handlers
  const handleLockUpdate = (lockUpdates: Partial<LockState>) => {
    pushUpdate({ lock: { ...state.lock, ...lockUpdates } });
  };

  return (
    <main className="min-h-screen text-white pb-20 selection:bg-yellow-500/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-neutral-950 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-yellow-300 via-amber-200 to-white bg-clip-text text-transparent">
                  ESP32 IOT OTOMASYON
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  DERS PROJESİ
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Lamba + Fan + Akıllı Kilit Bulut Paneli
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
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

            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>Arduino Kodu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Hardware Status Banner */}
        <div className="mb-6 p-4 rounded-2xl glass-panel border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-neutral-300">
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  state.telemetry.online ? "bg-emerald-400 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-semibold">
                ESP32 / Deneyap:{" "}
                <span className={state.telemetry.online ? "text-emerald-400" : "text-red-400"}>
                  {state.telemetry.online ? "Bağlı & Aktif" : "Bağlantı Bekleniyor (Offline)"}
                </span>
              </span>
            </div>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400 hidden md:inline">
              REST: <code className="text-yellow-400 font-mono">/api/devices</code>
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
              <span>Rainz-cmd/Ders</span>
            </a>
          </div>
        </div>

        {/* Device Switcher Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8 p-1.5 bg-neutral-950/70 rounded-2xl border border-neutral-800">
          {[
            {
              id: "lamp" as const,
              label: "1. Akıllı Lamba & Röle",
              icon: Lightbulb,
              badge: state.lamp.power ? "AÇIK" : "KAPALI",
              badgeColor: state.lamp.power ? "bg-yellow-500/20 text-yellow-300" : "bg-neutral-800 text-neutral-500",
            },
            {
              id: "fan" as const,
              label: "2. Akıllı Fan / Havalandırma",
              icon: FanIcon,
              badge: state.fan.power ? `%${state.fan.speed}` : "KAPALI",
              badgeColor: state.fan.power ? "bg-cyan-500/20 text-cyan-300" : "bg-neutral-800 text-neutral-500",
            },
            {
              id: "lock" as const,
              label: "3. Güvenlik Kilidi (Servo)",
              icon: LockIcon,
              badge: state.lock.locked ? "KİLİTLİ" : "AÇIK",
              badgeColor: state.lock.locked ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300",
            },
            {
              id: "guide" as const,
              label: "📖 Nasıl Yapılır? (Rehber)",
              icon: BookOpen,
              badge: "DETAYLI",
              badgeColor: "bg-purple-500/20 text-purple-300",
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeDevice === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveDevice(item.id)}
                className={`flex-1 min-w-[200px] p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isActive
                    ? "bg-neutral-800 border-neutral-600 shadow-md scale-[1.01]"
                    : "bg-neutral-900/50 border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs font-bold text-white">{item.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: LAMP DASHBOARD */}
        {activeDevice === "lamp" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-3xl p-6 flex flex-col items-center">
                <LampVisualizer
                  power={state.lamp.power}
                  brightness={state.lamp.brightness}
                  color={state.lamp.color}
                  mode={state.lamp.mode}
                />
                <div className="mt-8 mb-4 w-full flex justify-center">
                  <PowerToggle power={state.lamp.power} onToggle={handleLampPowerToggle} />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-yellow-400" />
                  <span className="text-neutral-300">
                    {state.lamp.autoOffTime ? "Otomatik Kapanma Devrede" : "Zamanlayıcı Kapalı"}
                  </span>
                </div>
                <button
                  onClick={() => setShowTimerModal(true)}
                  className="text-yellow-400 hover:underline font-semibold"
                >
                  {state.lamp.autoOffTime ? "Düzenle" : "Zamanlayıcı Kur"}
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <BrightnessSlider
                brightness={state.lamp.brightness}
                power={state.lamp.power}
                onChange={(brightness) => handleLampUpdate({ brightness })}
              />
              <ColorPicker
                color={state.lamp.color}
                power={state.lamp.power}
                onChange={(color) => handleLampUpdate({ color })}
              />
              <ModeSelector
                mode={state.lamp.mode}
                speed={state.lamp.speed}
                power={state.lamp.power}
                onModeChange={(mode) => handleLampUpdate({ mode })}
                onSpeedChange={(speed) => handleLampUpdate({ speed })}
              />
              <EspStatusCard
                telemetry={state.telemetry}
                latencyMs={latencyMs}
                onRefresh={syncDevices}
                onOpenCode={() => setShowCodeModal(true)}
              />
              <EventLogs logs={logs} onClear={() => setLogs([])} />
            </div>
          </div>
        )}

        {/* Tab 2: FAN DASHBOARD */}
        {activeDevice === "fan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-3xl p-6 flex flex-col items-center">
                <FanVisualizer
                  power={state.fan.power}
                  speed={state.fan.speed}
                  mode={state.fan.mode}
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <FanControls fan={state.fan} onUpdate={handleFanUpdate} />
              <EspStatusCard
                telemetry={state.telemetry}
                latencyMs={latencyMs}
                onRefresh={syncDevices}
                onOpenCode={() => setShowCodeModal(true)}
              />
              <EventLogs logs={logs} onClear={() => setLogs([])} />
            </div>
          </div>
        )}

        {/* Tab 3: LOCK DASHBOARD */}
        {activeDevice === "lock" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-panel rounded-3xl p-6 flex flex-col items-center">
                <LockVisualizer
                  locked={state.lock.locked}
                  angle={state.lock.angle}
                  alarm={state.lock.alarm}
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <LockControls lock={state.lock} onUpdate={handleLockUpdate} />
              <EspStatusCard
                telemetry={state.telemetry}
                latencyMs={latencyMs}
                onRefresh={syncDevices}
                onOpenCode={() => setShowCodeModal(true)}
              />
              <EventLogs logs={logs} onClear={() => setLogs([])} />
            </div>
          </div>
        )}

        {/* Tab 4: GUIDE / TUTORIAL */}
        {activeDevice === "guide" && <GuideSection />}
      </div>

      {/* Modals */}
      {showTimerModal && (
        <TimerModal
          autoOffTime={state.lamp.autoOffTime}
          onSetTimer={(timestamp) => handleLampUpdate({ autoOffTime: timestamp })}
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
