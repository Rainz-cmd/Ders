"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Usb,
  X,
  Terminal,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Activity,
  Cpu,
} from "lucide-react";
import { webSerial, UsbChipInfo } from "@/lib/webSerial";

interface UsbSerialModalProps {
  onClose: () => void;
}

export const UsbSerialModal: React.FC<UsbSerialModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"monitor" | "plotter">("monitor");
  const [connected, setConnected] = useState(false);
  const [chipInfo, setChipInfo] = useState<UsbChipInfo | null>(null);
  const [logs, setLogs] = useState<{ time: string; text: string; type: "esp" | "pc" | "sys" }[]>([]);
  const [plotData, setPlotData] = useState<number[]>([20, 22, 24, 25, 26, 25, 24, 23]);
  const [inputCmd, setInputCmd] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [baudRate, setBaudRate] = useState(115200);
  const [lineEnding, setLineEnding] = useState<"\r\n" | "\n" | "\r" | "">("\n");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSupported(webSerial.isSupported());

    webSerial.setCallbacks(
      (dataLine) => {
        const timeStr = new Date().toTimeString().split(" ")[0];
        setLogs((prev) => [
          ...prev.slice(-199),
          { time: timeStr, text: dataLine, type: "esp" },
        ]);

        // Parse numerical values for Serial Plotter
        const match = dataLine.match(/[-+]?[0-9]*\.?[0-9]+/);
        if (match) {
          const num = parseFloat(match[0]);
          if (!isNaN(num) && num >= -100 && num <= 5000) {
            setPlotData((prev) => [...prev.slice(-30), num]);
          }
        }
      },
      (isConnected, chip, err) => {
        setConnected(isConnected);
        if (chip) setChipInfo(chip);
        const timeStr = new Date().toTimeString().split(" ")[0];
        if (err) {
          setLogs((prev) => [...prev, { time: timeStr, text: `[HATA] ${err}`, type: "sys" }]);
        } else if (isConnected) {
          setLogs((prev) => [
            ...prev,
            { time: timeStr, text: `[BAĞLANDI] ${chip?.name || "Seri Port"} (${baudRate} Baud)`, type: "sys" },
          ]);
        } else {
          setLogs((prev) => [...prev, { time: timeStr, text: "[BAĞLANTI KESİLDİ]", type: "sys" }]);
          setChipInfo(null);
        }
      }
    );
  }, [baudRate]);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleConnect = async () => {
    await webSerial.connect(baudRate);
  };

  const handleDisconnect = async () => {
    await webSerial.disconnect();
    setConnected(false);
  };

  const handleResetBoard = async () => {
    const ok = await webSerial.resetBoard();
    const timeStr = new Date().toTimeString().split(" ")[0];
    if (ok) {
      setLogs((prev) => [
        ...prev,
        { time: timeStr, text: "[RESET] DTR/RTS darbesi gonderildi, ESP32 resetleniyor...", type: "sys" },
      ]);
    }
  };

  const sendCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    const ok = await webSerial.sendCommand(cmd, lineEnding);
    const timeStr = new Date().toTimeString().split(" ")[0];
    if (ok) {
      setLogs((prev) => [...prev, { time: timeStr, text: `> ${cmd}`, type: "pc" }]);
      setCmdHistory((prev) => [...prev, cmd]);
      setHistoryIndex(-1);
      setInputCmd("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = historyIndex + 1 < cmdHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputCmd(cmdHistory[cmdHistory.length - 1 - nextIdx] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputCmd(cmdHistory[cmdHistory.length - 1 - nextIdx] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputCmd("");
      }
    }
  };

  const filteredLogs = logs.filter((l) =>
    filterText ? l.text.toLowerCase().includes(filterText.toLowerCase()) : true
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 border border-neutral-700/80 shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${connected ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"}`}>
              <Usb className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Arduino Tarzı USB Seri Monitör & Çizici</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  WEB SERIAL API
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {chipInfo ? `${chipInfo.name} — ${chipInfo.description}` : "ESP32 / Deneyap Kart Doğrudan COM Port Bağlantısı"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Connection Bar */}
        <div className="my-3 p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status & Chip */}
          <div className="flex items-center space-x-2">
            {connected ? (
              <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>BAĞLI</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-neutral-500 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>BAĞLI DEĞİL</span>
              </span>
            )}
            {chipInfo && (
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px] border border-neutral-700">
                {chipInfo.name}
              </span>
            )}
          </div>

          {/* Settings: Baud Rate & Line Ending */}
          <div className="flex items-center space-x-2">
            <select
              value={baudRate}
              disabled={connected}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-200 font-mono focus:outline-none"
            >
              {[9600, 19200, 38400, 57600, 115200, 230400, 921600].map((b) => (
                <option key={b} value={b}>
                  {b} baud
                </option>
              ))}
            </select>

            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as any)}
              className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1 text-neutral-300 text-[11px] focus:outline-none"
            >
              <option value="\n">Yeni Satır (NL - \n)</option>
              <option value="\r\n">NL & CR (\r\n)</option>
              <option value="\r">Satır Başı (CR)</option>
              <option value="">Satır Sonu Yok</option>
            </select>

            {connected && (
              <button
                onClick={handleResetBoard}
                title="DTR/RTS darbesi ile ESP32 kartını resetler"
                className="px-2.5 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 font-bold flex items-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Kartı</span>
              </button>
            )}

            {!connected ? (
              <button
                onClick={handleConnect}
                disabled={!isSupported}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 text-white font-bold flex items-center space-x-1.5 shadow-md"
              >
                <Usb className="w-4 h-4" />
                <span>Port Seç & Bağlan</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold"
              >
                Bağlantıyı Kes
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector: Serial Monitor vs Serial Plotter */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("monitor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === "monitor"
                  ? "bg-neutral-800 text-yellow-400 border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Seri Monitör</span>
            </button>
            <button
              onClick={() => setActiveTab("plotter")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                activeTab === "plotter"
                  ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Seri Çizici (Canlı Grafik)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-yellow-400 rounded"
              />
              <span>Otomatik Kaydır</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showTimestamps}
                onChange={(e) => setShowTimestamps(e.target.checked)}
                className="accent-yellow-400 rounded"
              />
              <span>Zaman Damgası</span>
            </label>
            <button onClick={() => setLogs([])} className="hover:text-red-400 p-0.5" title="Temizle">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Terminal Display */}
        {activeTab === "monitor" && (
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto bg-neutral-950 rounded-xl p-3 border border-neutral-800 font-mono text-xs space-y-1 min-h-[220px] select-text"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-neutral-600 italic py-12 text-center">
                {connected
                  ? "ESP32'den gelen veriler bekleniyor (Serial.println)..."
                  : "ESP32'yi USB ile takıp 'Port Seç & Bağlan' butonuna basın..."}
              </div>
            ) : (
              filteredLogs.map((item, idx) => (
                <div key={idx} className="leading-relaxed flex items-start space-x-2">
                  {showTimestamps && <span className="text-neutral-600 shrink-0">[{item.time}]</span>}
                  <span
                    className={
                      item.type === "sys"
                        ? "text-yellow-400 font-semibold"
                        : item.type === "pc"
                        ? "text-cyan-400 font-semibold"
                        : "text-neutral-200"
                    }
                  >
                    {item.text}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Serial Plotter (SVG Graph) */}
        {activeTab === "plotter" && (
          <div className="flex-1 bg-neutral-950 rounded-xl p-4 border border-neutral-800 min-h-[220px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span className="font-mono font-bold text-cyan-400">Canlı Değer Grafiği (Sensör / Telemetri)</span>
              <span className="font-mono text-emerald-400 font-bold">
                Son Değer: {plotData[plotData.length - 1] ?? 0}
              </span>
            </div>

            <div className="h-44 w-full flex items-end justify-between space-x-1 pt-4">
              {plotData.map((val, i) => {
                const max = Math.max(...plotData, 100);
                const heightPercent = Math.min(100, Math.max(5, (val / max) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all duration-200 group-hover:from-yellow-500 group-hover:to-amber-400"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] font-mono text-neutral-500 mt-1 hidden group-hover:block">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendCommand(inputCmd);
          }}
          className="mt-3 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputCmd}
            disabled={!connected}
            onChange={(e) => setInputCmd(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? "Komut gir (örn: CMD:LAMP:1, CMD:FAN:85, CMD:LOCK:1)" : "Önce USB ile bağlanın"}
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 font-mono disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!connected}
            className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Gönder</span>
          </button>
        </form>
      </div>
    </div>
  );
};
