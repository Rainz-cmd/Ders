"use client";

import React from "react";
import { Terminal, Trash2 } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "warn" | "error";
}

interface EventLogsProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const EventLogs: React.FC<EventLogsProps> = ({ logs, onClear }) => {
  const getTypeColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "success":
        return "text-emerald-400";
      case "warn":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-cyan-400";
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
            Olay & Komut Günlüğü (Telemetry)
          </span>
        </div>
        <button
          onClick={onClear}
          title="Günlüğü Temizle"
          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-neutral-950/80 rounded-xl p-3 font-mono text-xs max-h-40 overflow-y-auto border border-neutral-800 space-y-1.5 select-text">
        {logs.length === 0 ? (
          <div className="text-neutral-600 italic py-2 text-center">
            Henüz olay kaydı yok...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-neutral-600 shrink-0">[{log.timestamp}]</span>
              <span className={`shrink-0 font-bold ${getTypeColor(log.type)}`}>
                {log.type.toUpperCase()}:
              </span>
              <span className="text-neutral-300 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
