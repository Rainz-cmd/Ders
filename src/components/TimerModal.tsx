"use client";

import React, { useEffect, useState } from "react";
import { Timer, X } from "lucide-react";

interface TimerModalProps {
  autoOffTime: number | null;
  onSetTimer: (timestamp: number | null) => void;
  onClose: () => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  autoOffTime,
  onSetTimer,
  onClose,
}) => {
  const [remainingText, setRemainingText] = useState<string>("");

  useEffect(() => {
    if (!autoOffTime) {
      setRemainingText("");
      return;
    }

    const updateTimer = () => {
      const diff = autoOffTime - Date.now();
      if (diff <= 0) {
        setRemainingText("Süre doldu");
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setRemainingText(`${mins} dk ${secs} sn kaldı`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [autoOffTime]);

  const setMinutes = (mins: number) => {
    const target = Date.now() + mins * 60 * 1000;
    onSetTimer(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-neutral-700/60 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Otomatik Kapanma Zamanlayıcısı</h3>
            <p className="text-xs text-neutral-400">Belirlenen süre sonunda röle kesilir</p>
          </div>
        </div>

        {remainingText && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center">
            <span className="text-xs text-neutral-300">Aktif Zamanlayıcı: </span>
            <span className="text-sm font-bold font-mono text-yellow-400">{remainingText}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[1, 5, 15, 30, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                setMinutes(mins);
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-neutral-800/70 hover:bg-yellow-500/20 hover:border-yellow-500/50 hover:text-yellow-300 border border-neutral-700/60 text-neutral-300 text-xs font-semibold transition-all duration-200"
            >
              {mins} Dakika
            </button>
          ))}
        </div>

        {autoOffTime && (
          <button
            onClick={() => {
              onSetTimer(null);
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-colors"
          >
            Zamanlayıcıyı İptal Et
          </button>
        )}
      </div>
    </div>
  );
};
