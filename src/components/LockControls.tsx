"use client";

import React from "react";
import { Lock, Unlock, ShieldAlert, Clock, Bell, RotateCcw } from "lucide-react";
import { LockState } from "@/lib/store";
import { playLockSound, playBeepSound } from "@/lib/sound";

interface LockControlsProps {
  lock: LockState;
  onUpdate: (updates: Partial<LockState>) => void;
}

export const LockControls: React.FC<LockControlsProps> = ({ lock, onUpdate }) => {
  const handleToggle = () => {
    const nextLocked = !lock.locked;
    playLockSound(nextLocked);
    onUpdate({
      locked: nextLocked,
      angle: nextLocked ? 90 : 0,
    });
  };

  const handleAlarmToggle = () => {
    playBeepSound();
    onUpdate({ alarm: !lock.alarm });
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle Bar */}
      <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              lock.locked
                ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            }`}
          >
            {lock.locked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Akıllı Güvenlik Kilidi</h3>
            <p className="text-xs text-neutral-400">SG90 Servo Motor & Güvenlik Bariyeri</p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all ${
            lock.locked
              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
          }`}
        >
          {lock.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          <span>{lock.locked ? "KİLİTLİ" : "KİLİT AÇIK"}</span>
        </button>
      </div>

      {/* Servo Angle Slider */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-red-400" />
            <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
              Servo Açısı (0° - 180°)
            </span>
          </div>
          <span className="text-xl font-bold font-mono text-white">
            {lock.angle}°
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="180"
          value={lock.angle}
          onChange={(e) => {
            const angle = Number(e.target.value);
            onUpdate({ angle, locked: angle > 45 });
          }}
          className="w-full h-3 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-400 mb-4"
        />

        {/* Quick Angle Presets */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "0° (Açık)", angle: 0, locked: false },
            { label: "90° (Kilitli)", angle: 90, locked: true },
            { label: "180° (Maksimum)", angle: 180, locked: true },
          ].map((item) => (
            <button
              key={item.angle}
              onClick={() => {
                playLockSound(item.locked);
                onUpdate({ angle: item.angle, locked: item.locked });
              }}
              className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                lock.angle === item.angle
                  ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-sm"
                  : "bg-neutral-800/60 text-neutral-400 border-neutral-700/50 hover:bg-neutral-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Lock and Tamper Alarm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Auto Lock Timer */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-semibold text-neutral-300 uppercase">
              Otomatik Geri Kilitleme
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 5, 10, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => onUpdate({ autoLockSeconds: sec })}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  lock.autoLockSeconds === sec
                    ? "bg-neutral-700 text-white border-neutral-500"
                    : "bg-neutral-800/50 text-neutral-400 border-neutral-700/40"
                }`}
              >
                {sec === 0 ? "Kapalı" : `${sec}s`}
              </button>
            ))}
          </div>
        </div>

        {/* Security Buzzer Alarm */}
        <div className="glass-panel rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className={`w-6 h-6 ${lock.alarm ? "text-red-400 animate-bounce" : "text-neutral-500"}`} />
            <div>
              <span className="text-xs text-neutral-400 block">Buzzer Alarm / Siren</span>
              <span className="text-xs font-bold text-white">
                {lock.alarm ? "SİREN ÇALIYOR!" : "Alarm Pasif"}
              </span>
            </div>
          </div>
          <button
            onClick={handleAlarmToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              lock.alarm
                ? "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700"
            }`}
          >
            {lock.alarm ? "SUSTUR" : "TETİKLE"}
          </button>
        </div>
      </div>
    </div>
  );
};
