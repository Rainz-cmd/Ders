export interface LampState {
  power: boolean;
  brightness: number; // 0 - 100
  color: string; // Hex color e.g. #ffb703
  mode: "solid" | "breathe" | "strobe" | "rainbow";
  speed: number; // effect speed 1-10
  autoOffTime: number | null; // timestamp (ms) or null
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

// In-memory global state for serverless functions
// Note: In serverless environments, module-level variables persist across warm invocations.
export const globalLampState: LampState = {
  power: false,
  brightness: 100,
  color: "#ffb703",
  mode: "solid",
  speed: 5,
  autoOffTime: null,
  lastUpdated: Date.now(),
};

export const globalTelemetry: DeviceTelemetry = {
  online: false,
  lastSeen: 0,
  ip: "N/A",
  rssi: 0,
  deviceType: "ESP32 / Deneyap",
  uptimeSeconds: 0,
};
