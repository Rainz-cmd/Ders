"use client";

import React, { useState, useEffect } from "react";
import { Play, CheckCircle2, X, Sparkles } from "lucide-react";
import { AllDevicesState } from "@/lib/store";
import { playSwitchSound, playFanSound, playLockSound, playBeepSound } from "@/lib/sound";

interface DemoModalProps {
  onUpdate: (updates: Partial<AllDevicesState>) => void;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ onUpdate, onClose }) => {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const steps = [
    { title: "1. Adım: Akıllı Lamba & Oda Aydınlatması", desc: "Lamba açılıyor, sıcak sarı filament parlıyor...", duration: 2500 },
    { title: "2. Adım: Fan & Havalandırma Motoru", desc: "DC Fan %85 hızda çalışıyor, hava akımı başladı...", duration: 2500 },
    { title: "3. Adım: SG90 Servo Kapı Kilidi", desc: "Kilit 0 dereceye döndü, kapı emniyeti açıldı...", duration: 2500 },
    { title: "4. Adım: WS2812B NeoPixel RGB Ambiyans", desc: "Masaüstü RGB şerit gökkuşağı efektine geçti...", duration: 2500 },
    { title: "5. Adım: Akıllı Sulama & Pompa Sistemi", desc: "Toprak nemi okundu, mini su pompası tetiklendi...", duration: 2500 },
  ];

  const startDemo = () => {
    setIsRunning(true);
    setStep(0);
  };

  useEffect(() => {
    if (!isRunning) return;

    if (step === 0) {
      playSwitchSound(true);
      onUpdate({ lamp: { power: true, brightness: 100, color: "#ffb703", mode: "solid", speed: 5, autoOffTime: null, lastUpdated: Date.now() } });
    } else if (step === 1) {
      playFanSound(85);
      onUpdate({ fan: { power: true, speed: 85, mode: "manual", targetTemp: 26, currentTemp: 24, oscillation: true, lastUpdated: Date.now() } });
    } else if (step === 2) {
      playLockSound(false);
      onUpdate({ lock: { locked: false, angle: 0, autoLockSeconds: 10, alarm: false, lastUpdated: Date.now() } });
    } else if (step === 3) {
      onUpdate({ rgb: { power: true, color: "#8b5cf6", brightness: 100, effect: "rainbow", speed: 8, lastUpdated: Date.now() } });
    } else if (step === 4) {
      playSwitchSound(true);
      onUpdate({ irrigation: { pump: true, soilMoisture: 55, autoWatering: true, threshold: 35, waterTankLevel: 80, lastUpdated: Date.now() } });
    }

    if (step < steps.length) {
      const timer = setTimeout(() => {
        setStep((prev) => prev + 1);
      }, steps[step]?.duration || 2500);
      return () => clearTimeout(timer);
    } else {
      setIsRunning(false);
      playBeepSound();
    }
  }, [isRunning, step, onUpdate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-neutral-700/80 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl bg-yellow-500/20 text-yellow-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">🎬 Hoca Sunum & Otomatik Demo Modu</h3>
            <p className="text-xs text-neutral-400">Tüm 5 cihazı sırayla otomatik test eden 12 saniyelik canlı akış</p>
          </div>
        </div>

        <div className="space-y-2.5 my-6">
          {steps.map((s, idx) => {
            const isCompleted = step > idx;
            const isCurrent = step === idx && isRunning;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-yellow-500/20 border-yellow-400 text-yellow-200 shadow-md"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{s.title}</span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />}
                </div>
                <p className="text-[11px] mt-1 text-neutral-400">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {!isRunning ? (
          <button
            onClick={startDemo}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-neutral-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-yellow-500/20 hover:scale-[1.01] transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{step >= steps.length ? "Demoyu Tekrar Başlat" : "Otomatik Demoyu Başlat"}</span>
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl bg-neutral-800 text-yellow-400 font-bold text-xs text-center border border-neutral-700 animate-pulse">
            Canlı Demo Yürütülüyor... ({step + 1} / {steps.length})
          </div>
        )}
      </div>
    </div>
  );
};
