"use client";

import React, { useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { AllDevicesState } from "@/lib/store";
import { playBeepSound, playSwitchSound, playLockSound, playFanSound } from "@/lib/sound";

interface VoiceAssistantProps {
  onUpdate: (updates: Partial<AllDevicesState>) => void;
  onLog: (msg: string, type?: "info" | "success" | "warn" | "error") => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onUpdate, onLog }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>("");

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanıma desteklemiyor. Lütfen Chrome veya Edge kullanın.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      playBeepSound();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setLastCommand(transcript);
      processCommand(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processCommand = (cmd: string) => {
    onLog(`Sesli Komut Algılandı: "${cmd}"`, "info");

    if (cmd.includes("lamba") || cmd.includes("ışık") || cmd.includes("lambayı")) {
      if (cmd.includes("aç") || cmd.includes("yak") || cmd.includes("başlat")) {
        playSwitchSound(true);
        onUpdate({ lamp: { power: true, brightness: 100, color: "#ffb703", mode: "solid", speed: 5, autoOffTime: null, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Lamba AÇILDI", "success");
      } else if (cmd.includes("kapat") || cmd.includes("söndür")) {
        playSwitchSound(false);
        onUpdate({ lamp: { power: false, brightness: 100, color: "#ffb703", mode: "solid", speed: 5, autoOffTime: null, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Lamba KAPATILDI", "warn");
      }
    } else if (cmd.includes("fan") || cmd.includes("havalandırma")) {
      if (cmd.includes("aç") || cmd.includes("çalıştır") || cmd.includes("başlat")) {
        playFanSound(80);
        onUpdate({ fan: { power: true, speed: 80, mode: "manual", targetTemp: 26, currentTemp: 24, oscillation: false, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Fan %80 çalıştırıldı", "success");
      } else if (cmd.includes("kapat") || cmd.includes("durdur")) {
        playFanSound(0);
        onUpdate({ fan: { power: false, speed: 0, mode: "manual", targetTemp: 26, currentTemp: 24, oscillation: false, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Fan DURDURULDU", "warn");
      }
    } else if (cmd.includes("kilit") || cmd.includes("kapı")) {
      if (cmd.includes("aç")) {
        playLockSound(false);
        onUpdate({ lock: { locked: false, angle: 0, autoLockSeconds: 10, alarm: false, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Kapı Kilidi AÇILDI", "success");
      } else if (cmd.includes("kilitle") || cmd.includes("kapat")) {
        playLockSound(true);
        onUpdate({ lock: { locked: true, angle: 90, autoLockSeconds: 10, alarm: false, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Kapı KİLİTLENDİ", "warn");
      }
    } else if (cmd.includes("sula") || cmd.includes("pompa") || cmd.includes("sulama")) {
      if (cmd.includes("aç") || cmd.includes("başlat") || cmd.includes("çalıştır")) {
        playSwitchSound(true);
        onUpdate({ irrigation: { pump: true, soilMoisture: 42, autoWatering: true, threshold: 35, waterTankLevel: 80, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Sulama Pompası AÇILDI", "success");
      } else if (cmd.includes("kapat") || cmd.includes("durdur")) {
        playSwitchSound(false);
        onUpdate({ irrigation: { pump: false, soilMoisture: 42, autoWatering: true, threshold: 35, waterTankLevel: 80, lastUpdated: Date.now() } });
        onLog("Sesli Komut: Sulama Pompası DURDURULDU", "warn");
      }
    } else if (cmd.includes("gece modu")) {
      playSwitchSound(true);
      onUpdate({
        automations: { tempAutoFan: true, soilAutoPump: true, nightMode: true },
        lamp: { power: true, brightness: 20, color: "#ffb703", mode: "solid", speed: 5, autoOffTime: null, lastUpdated: Date.now() },
        lock: { locked: true, angle: 90, autoLockSeconds: 10, alarm: false, lastUpdated: Date.now() },
      });
      onLog("Sesli Komut: Gece Modu Aktifleştirildi", "success");
    } else {
      onLog(`Bilinmeyen komut: "${cmd}" ("lambayı aç", "fanı çalıştır", "kilidi aç" vb. deyin)`, "warn");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={startListening}
        title="Türkçe Sesli Komut Ver"
        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
          isListening
            ? "bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            : "bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-300 hover:text-white"
        }`}
      >
        {isListening ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-yellow-400" />}
        <span className="hidden md:inline">{isListening ? "Dinleniyor..." : "Sesli Komut"}</span>
      </button>

      {lastCommand && (
        <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900/60 px-2 py-1 rounded border border-neutral-800 hidden lg:inline">
          &quot;{lastCommand}&quot;
        </span>
      )}
    </div>
  );
};
