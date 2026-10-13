"use client";

import React, { useState, useEffect, useRef } from "react";
import { Usb, X, Terminal, Send, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { webSerial } from "@/lib/webSerial";

interface UsbSerialModalProps {
  onClose: () => void;
}

export const UsbSerialModal: React.FC<UsbSerialModalProps> = ({ onClose }) => {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [inputCmd, setInputCmd] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSupported(webSerial.isSupported());

    webSerial.setCallbacks(
      (dataLine) => {
        setLogs((prev) => [...prev.slice(-99), `[ESP32] ${dataLine}`]);
      },
      (isConnected, err) => {
        setConnected(isConnected);
        if (err) {
          setLogs((prev) => [...prev, `[HATA] ${err}`]);
        } else if (isConnected) {
          setLogs((prev) => [...prev, "[BAĞLANTI] ESP32 USB Seri Portuna 115200 Baud ile bağlandı!"]);
        } else {
          setLogs((prev) => [...prev, "[BAĞLANTI] USB bağlantısı kesildi."]);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleConnect = async () => {
    await webSerial.connect(115200);
  };

  const handleDisconnect = async () => {
    await webSerial.disconnect();
    setConnected(false);
  };

  const sendCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    const ok = await webSerial.sendCommand(cmd);
    if (ok) {
      setLogs((prev) => [...prev, `[PC > ESP] ${cmd}`]);
      setInputCmd("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-neutral-700/80 shadow-2xl relative flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${connected ? "bg-emerald-500/20 text-emerald-400" : "bg-cyan-500/20 text-cyan-400"}`}>
              <Usb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">USB Doğrudan Bağlantı & Seri Terminal</h3>
              <p className="text-xs text-neutral-400">Web Serial API üzerinden ESP32 ile 115200 Baud hızında haberleşme</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Connect Bar */}
        <div className="my-4 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            {connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-neutral-500" />
            )}
            <span className="font-semibold text-neutral-200">
              Durum:{" "}
              <span className={connected ? "text-emerald-400 font-bold" : "text-neutral-400"}>
                {connected ? "USB Portuna Bağlı (115200 Baud)" : "Cihaz Seçilmedi"}
              </span>
            </span>
          </div>

          <div>
            {!connected ? (
              <button
                onClick={handleConnect}
                disabled={!isSupported}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md disabled:opacity-50"
              >
                <Usb className="w-4 h-4" />
                <span>USB Portunu Seç & Bağlan</span>
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs"
              >
                Bağlantıyı Kes
              </button>
            )}
          </div>
        </div>

        {!isSupported && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-300">
            ⚠️ Tarayıcınız Web Serial API desteklemiyor. Lütfen <strong>Google Chrome</strong> veya <strong>Microsoft Edge</strong> kullanın.
          </div>
        )}

        {/* Quick Test Commands */}
        {connected && (
          <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
            <span className="text-[11px] text-neutral-500 self-center mr-1">Hızlı Komut:</span>
            <button onClick={() => sendCommand("CMD:LAMP:1")} className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-yellow-300 border border-neutral-700">Lamba Aç</button>
            <button onClick={() => sendCommand("CMD:LAMP:0")} className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700">Lamba Kapat</button>
            <button onClick={() => sendCommand("CMD:FAN:100")} className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700">Fan %100</button>
            <button onClick={() => sendCommand("CMD:LOCK:1")} className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-red-300 border border-neutral-700">Kilitle</button>
            <button onClick={() => sendCommand("CMD:LOCK:0")} className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-neutral-700">Kilit Aç</button>
            <button onClick={() => sendCommand("CMD:PUMP:1")} className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-blue-300 border border-neutral-700">Sulama</button>
          </div>
        )}

        {/* Terminal Logs */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto bg-neutral-950 rounded-xl p-3 border border-neutral-800 font-mono text-xs space-y-1 min-h-[160px] select-text"
        >
          {logs.length === 0 ? (
            <div className="text-neutral-600 italic py-6 text-center">
              ESP32 USB kablosunu takın ve yukarıdaki &quot;USB Portunu Seç&quot; butonuna basarak COM portunu seçin...
            </div>
          ) : (
            logs.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className={line.startsWith("[ESP32]") ? "text-cyan-300" : line.startsWith("[PC") ? "text-yellow-400 font-semibold" : "text-neutral-400"}>
                  {line}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        {connected && (
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
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="Komut yaz (örn: CMD:FAN:80, CMD:STATUS)"
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLogs([])}
              title="Temizle"
              className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
