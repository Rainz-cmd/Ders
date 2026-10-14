export interface LampState {
  power: boolean;
  brightness: number; // 0 - 100
  color: string; // Hex color e.g. #ffb703
  mode: "solid" | "breathe" | "strobe" | "rainbow";
  speed: number;
  autoOffTime: number | null;
  lastUpdated: number;
}

export interface FanState {
  power: boolean;
  speed: number; // 0 - 100%
  mode: "manual" | "auto" | "eco";
  targetTemp: number; // e.g. 26°C
  currentTemp: number; // DHT11 sensor value
  oscillation: boolean;
  lastUpdated: number;
}

export interface LockState {
  locked: boolean;
  angle: number; // 0 to 180 deg
  autoLockSeconds: number; // 0, 5, 10, 30s
  alarm: boolean;
  lastUpdated: number;
}

export interface RgbState {
  power: boolean;
  color: string; // Hex color
  brightness: number; // 0 - 100
  effect: "solid" | "rainbow" | "fireplace" | "cyberwave" | "police";
  speed: number; // 1 - 10
  lastUpdated: number;
}

export interface IrrigationState {
  pump: boolean; // Water pump active
  soilMoisture: number; // 0 - 100%
  autoWatering: boolean;
  threshold: number; // Sulanma eşiği örn: %35
  waterTankLevel: number; // 0 - 100%
  lastUpdated: number;
}

export interface ThermostatState {
  currentTemp: number; // e.g. 24.5 °C
  thresholdTemp: number; // default 25.0 °C
  redLed: boolean; // true if currentTemp > thresholdTemp
  blueLed: boolean; // true if currentTemp <= thresholdTemp
  sensorType: "DHT11" | "NTC" | "LM35";
  autoMode: boolean;
  boardType: "deneyap_1a_v2" | "esp32_devkit";
  lastUpdated: number;
}

export interface AutomationsState {
  tempAutoFan: boolean; // Sıcaklık > 27°C ise fanı çalıştır
  soilAutoPump: boolean; // Nem < %35 ise pompayı çalıştır
  nightMode: boolean; // Gece modu
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
  rgb: RgbState;
  irrigation: IrrigationState;
  thermostat: ThermostatState;
  automations: AutomationsState;
  telemetry: DeviceTelemetry;
}

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
  thermostat: {
    currentTemp: 24.2,
    thresholdTemp: 25.0,
    redLed: false, // 24.2 <= 25.0 -> Mavi LED aktif
    blueLed: true,
    sensorType: "DHT11",
    autoMode: true,
    boardType: "deneyap_1a_v2",
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
    ip: "N/A",
    rssi: 0,
    deviceType: "Deneyap Kart 1A v2",
    uptimeSeconds: 0,
  },
};

export const globalLampState = globalDevicesState.lamp;
export const globalTelemetry = globalDevicesState.telemetry;
