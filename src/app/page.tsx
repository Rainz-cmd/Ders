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
  Sparkles,
  Droplets,
  Usb,
  Play,
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
import { RgbControls } from "@/components/RgbControls";
import { IrrigationControls } from "@/components/IrrigationControls";
import { TelemetryGauges } from "@/components/TelemetryGauges";
import { AutomationsCard } from "@/components/AutomationsCard";
import { GuideSection } from "@/components/GuideSection";
import { EspStatusCard } from "@/components/EspStatusCard";
import { EventLogs, LogEntry } from "@/components/EventLogs";
import { TimerModal } from "@/components/TimerModal";
import { EspCodeModal } from "@/components/EspCodeModal";
import { UsbSerialModal } from "@/components/UsbSerialModal";
import { DemoModal } from "@/components/DemoModal";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { AllDevicesState, LampState, FanState, LockState, RgbState, IrrigationState } from "@/lib/store";

export default function HomePage() {
  const [activeDevice, setActiveDevice] = useState<"lamp" | "fan" | "lock" | "rgb" | "irrigation" | "guide">("lamp");

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
    rgb: {
      power: false,
      color: "#8b5cf6",
      brightness: 80,
      effect: "rainbow",
      speed: 5,
      lastUpdated: Date.now(),
    },
    irrigation: {
      pump: false,
      soilMoisture: 42,
      autoWatering: true,
      threshold: 35,
      waterTankLevel: 85,
      lastUpdated: Date.now(),
    },
    automations: {
      tempAutoFan: true,
      soilAutoPump: true,
      nightMode: false,
    },
    telemetry: {
      online: false,
      lastSeen: 0,
      ip: "192.168.1.X",
      rssi: 0,
      deviceType: "ESP32 / Deneyap (5 Cihaz)",
      uptimeSeconds: 0,
    },
  });

  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [showUsbModal, setShowUsbModal] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [vercelUrl, setVercelUrl] = useState<string>("");

  const isUpdatingRef = useRef(false);

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
            addLog(`Kilit: ${data.lock.locked ? "KİLİTLENDİ" : "AÇILDI"}`, data.lock.locked ? "warn" : "success");
          }
          if (prev.irrigation.pump !== data.irrigation.pump) {
            addLog(`Su Pompası: ${data.irrigation.pump ? "AKTİF" : "KAPALI"}`, data.irrigation.pump ? "success" : "warn");
          }
          return data;
        });
      }
    } catch {}
  }, [addLog]);

  useEffect(() => {
    syncDevices();
    addLog("Platform aktif. 5 Cihaz, Web Serial USB ve Ses Motoru hazır.", "info");

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      syncDevices();
    }, 2000);

    return () => clearInterval(interval);
  }, [syncDevices, addLog]);

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
      addLog("Bulut sunucusuna ulaşılamadı!", "error");
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 250);
    }
  };

  return (
    <main className="min-h-screen text-white pb-20 selection:bg-yellow-500/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-neutral-950 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight bg-gradient-to-r from-yellow-300 via-amber-200 to-white bg-clip-text text-transparent">
                  ESP32 IOT 5X SUITE
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  DERS PROJESİ
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Lamba + Fan + Kilit + RGB + Sulama + USB Serial
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Voice Assistant */}
            <VoiceAssistant onUpdate={pushUpdate} onLog={addLog} />

            {/* Hoca Demo Modu */}
            <button
              onClick={() => setShowDemoModal(true)}
              className="px-3 py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Hoca Demo Modu</span>
            </button>

            {/* USB Serial Button */}
            <button
              onClick={() => setShowUsbModal(true)}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Usb className="w-4 h-4" />
              <span className="hidden sm:inline">USB Bağlan</span>
            </button>

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

            {/* Arduino Code */}
            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-yellow-500/20 transition-all cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden md:inline">Arduino Kodu</span>
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
                  {state.telemetry.online ? "Bulut Bağlantısı Aktif" : "Bulut Bekleniyor / USB Modu"}
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

        {/* 5-Device Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8 p-1.5 bg-neutral-950/70 rounded-2xl border border-neutral-800">
          {[
            {
              id: "lamp" as const,
              label: "1. Lamba & Röle",
              icon: Lightbulb,
              badge: state.lamp.power ? "AÇIK" : "KAPALI",
              badgeColor: state.lamp.power ? "bg-yellow-500/20 text-yellow-300" : "bg-neutral-800 text-neutral-500",
            },
            {
              id: "fan" as const,
              label: "2. Fan & Soğutma",
              icon: FanIcon,
              badge: state.fan.power ? `%${state.fan.speed}` : "KAPALI",
              badgeColor: state.fan.power ? "bg-cyan-500/20 text-cyan-300" : "bg-neutral-800 text-neutral-500",
            },
            {
              id: "lock" as const,
              label: "3. Kapı Kilidi (Servo)",
              icon: LockIcon,
              badge: state.lock.locked ? "KİLİTLİ" : "AÇIK",
              badgeColor: state.lock.locked ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300",
            },
            {
              id: "rgb" as const,
              label: "4. RGB NeoPixel",
              icon: Sparkles,
              badge: state.rgb.power ? "AKTİF" : "KAPALI",
              badgeColor: state.rgb.power ? "bg-purple-500/20 text-purple-300" : "bg-neutral-800 text-neutral-500",
            },
            {
              id: "irrigation" as const,
              label: "5. Akıllı Sulama",
              icon: Droplets,
              badge: state.irrigation.pump ? "POMPALIYOR" : `Nem: %${state.irrigation.soilMoisture}`,
              badgeColor: state.irrigation.pump ? "bg-blue-500/20 text-blue-300" : "bg-neutral-800 text-neutral-400",
            },
            {
              id: "guide" as const,
              label: "📖 Kurulum Rehberi",
              icon: BookOpen,
              badge: "DETAYLI",
              badgeColor: "bg-emerald-500/20 text-emerald-300",
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeDevice === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveDevice(item.id)}
                className={`flex-1 min-w-[170px] p-3 rounded-xl border flex items-center justify-between transition-all ${
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

        {/* Tab 1: LAMP */}
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
                  <PowerToggle
                    power={state.lamp.power}
                    onToggle={(newPower) => {
                      pushUpdate({ lamp: { ...state.lamp, power: newPower } });
                      addLog(`Lamba ${newPower ? "AÇILDI" : "KAPATILDI"}`, newPower ? "success" : "warn");
                    }}
                  />
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
                onChange={(brightness) => pushUpdate({ lamp: { ...state.lamp, brightness } })}
              />
              <ColorPicker
                color={state.lamp.color}
                power={state.lamp.power}
                onChange={(color) => pushUpdate({ lamp: { ...state.lamp, color } })}
              />
              <ModeSelector
                mode={state.lamp.mode}
                speed={state.lamp.speed}
                power={state.lamp.power}
                onModeChange={(mode) => pushUpdate({ lamp: { ...state.lamp, mode } })}
                onSpeedChange={(speed) => pushUpdate({ lamp: { ...state.lamp, speed } })}
              />
              <TelemetryGauges state={state} latencyMs={latencyMs} />
              <AutomationsCard automations={state.automations} onUpdate={pushUpdate} />
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

        {/* Tab 2: FAN */}
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
              <FanControls
                fan={state.fan}
                onUpdate={(fanUpdates) => pushUpdate({ fan: { ...state.fan, ...fanUpdates } })}
              />
              <TelemetryGauges state={state} latencyMs={latencyMs} />
              <AutomationsCard automations={state.automations} onUpdate={pushUpdate} />
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

        {/* Tab 3: LOCK */}
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
              <LockControls
                lock={state.lock}
                onUpdate={(lockUpdates) => pushUpdate({ lock: { ...state.lock, ...lockUpdates } })}
              />
              <TelemetryGauges state={state} latencyMs={latencyMs} />
              <AutomationsCard automations={state.automations} onUpdate={pushUpdate} />
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

        {/* Tab 4: RGB NEOPIXEL */}
        {activeDevice === "rgb" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12 space-y-6">
              <RgbControls
                rgb={state.rgb}
                onUpdate={(rgbUpdates) => pushUpdate({ rgb: { ...state.rgb, ...rgbUpdates } })}
              />
              <TelemetryGauges state={state} latencyMs={latencyMs} />
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

        {/* Tab 5: IRRIGATION */}
        {activeDevice === "irrigation" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-12 space-y-6">
              <IrrigationControls
                irrigation={state.irrigation}
                onUpdate={(irrigationUpdates) =>
                  pushUpdate({ irrigation: { ...state.irrigation, ...irrigationUpdates } })
                }
              />
              <TelemetryGauges state={state} latencyMs={latencyMs} />
              <AutomationsCard automations={state.automations} onUpdate={pushUpdate} />
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

        {/* Tab 6: GUIDE */}
        {activeDevice === "guide" && <GuideSection />}
      </div>

      {/* Modals */}
      {showTimerModal && (
        <TimerModal
          autoOffTime={state.lamp.autoOffTime}
          onSetTimer={(timestamp) =>
            pushUpdate({ lamp: { ...state.lamp, autoOffTime: timestamp } })
          }
          onClose={() => setShowTimerModal(false)}
        />
      )}

      {showCodeModal && (
        <EspCodeModal onClose={() => setShowCodeModal(false)} vercelUrl={vercelUrl} />
      )}

      {showUsbModal && <UsbSerialModal onClose={() => setShowUsbModal(false)} />}

      {showDemoModal && (
        <DemoModal onUpdate={pushUpdate} onClose={() => setShowDemoModal(false)} />
      )}
    </main>
  );
}
