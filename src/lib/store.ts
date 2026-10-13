export interface LampState {
  power: boolean;
  brightness: number; // 0 - 100
  color: string; // Hex color e.g. #ffb703
  mode: "solid" | "breathe" | "strobe" | "rainbow";
  speed: number; // effect speed 1-10
  autoOffTime: number | null; // timestamp (ms) or null
  lastUpdated: number;
}

export interface FanState {
  power: boolean;
  speed: number; // 0 - 100%
  mode: "manual" | "auto" | "eco";
  targetTemp: number; // e.g. 25°C
  currentTemp: number; // Simulated or sensor reading
  oscillation: boolean;
  lastUpdated: number;
}

export interface LockState {
  locked: boolean;
  angle: number; // 0 (unlocked) to 90/180 (locked)
  autoLockSeconds: number; // 0 disabled, 5, 10, 30s
  alarm: boolean; // Tamper / unauthorized alarm
  lastUpdated: number;
}

export interface DeviceTelemetry {
  online: boolean;
  lastSeen: number;
  ip: string;
  rssi: number; // dBm
  deviceType: string;
  uptimeSeconds: number;
}

export interface AllDevicesState {
  lamp: LampState;
  fan: FanState;
  lock: LockState;
  telemetry: DeviceTelemetry;
}

// In-memory state for serverless functions
export const globalDevicesState: AllDevicesState = {
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
    ip: "N/A",
    rssi: 0,
    deviceType: "ESP32 / Deneyap",
    uptimeSeconds: 0,
  },
};

// Aliases for backwards compatibility with existing /api/lamp
export const globalLampState = globalDevicesState.lamp;
export const globalTelemetry = globalDevicesState.telemetry;
