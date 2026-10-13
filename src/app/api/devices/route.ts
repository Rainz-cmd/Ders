import { NextResponse } from "next/server";
import { globalDevicesState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (globalDevicesState.lamp.autoOffTime && Date.now() >= globalDevicesState.lamp.autoOffTime) {
    globalDevicesState.lamp.power = false;
    globalDevicesState.lamp.autoOffTime = null;
    globalDevicesState.lamp.lastUpdated = Date.now();
  }

  // Automation logic triggers
  if (globalDevicesState.automations.tempAutoFan) {
    if (globalDevicesState.fan.currentTemp >= globalDevicesState.fan.targetTemp) {
      globalDevicesState.fan.power = true;
    }
  }

  if (globalDevicesState.automations.soilAutoPump && globalDevicesState.irrigation.autoWatering) {
    if (globalDevicesState.irrigation.soilMoisture < globalDevicesState.irrigation.threshold) {
      globalDevicesState.irrigation.pump = true;
    }
  }

  const isOnline = Date.now() - globalDevicesState.telemetry.lastSeen < 15000;

  return NextResponse.json({
    ...globalDevicesState,
    telemetry: {
      ...globalDevicesState.telemetry,
      online: isOnline,
    },
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Lamp
    if (body.lamp) {
      if (typeof body.lamp.power === "boolean") globalDevicesState.lamp.power = body.lamp.power;
      if (typeof body.lamp.brightness === "number") globalDevicesState.lamp.brightness = body.lamp.brightness;
      if (typeof body.lamp.color === "string") globalDevicesState.lamp.color = body.lamp.color;
      if (body.lamp.mode) globalDevicesState.lamp.mode = body.lamp.mode;
      if (typeof body.lamp.speed === "number") globalDevicesState.lamp.speed = body.lamp.speed;
      if (body.lamp.autoOffTime !== undefined) globalDevicesState.lamp.autoOffTime = body.lamp.autoOffTime;
      globalDevicesState.lamp.lastUpdated = Date.now();
    }

    // 2. Fan
    if (body.fan) {
      if (typeof body.fan.power === "boolean") globalDevicesState.fan.power = body.fan.power;
      if (typeof body.fan.speed === "number") globalDevicesState.fan.speed = body.fan.speed;
      if (body.fan.mode) globalDevicesState.fan.mode = body.fan.mode;
      if (typeof body.fan.targetTemp === "number") globalDevicesState.fan.targetTemp = body.fan.targetTemp;
      if (typeof body.fan.currentTemp === "number") globalDevicesState.fan.currentTemp = body.fan.currentTemp;
      if (typeof body.fan.oscillation === "boolean") globalDevicesState.fan.oscillation = body.fan.oscillation;
      globalDevicesState.fan.lastUpdated = Date.now();
    }

    // 3. Lock
    if (body.lock) {
      if (typeof body.lock.locked === "boolean") {
        globalDevicesState.lock.locked = body.lock.locked;
        globalDevicesState.lock.angle = body.lock.locked ? 90 : 0;
      }
      if (typeof body.lock.angle === "number") globalDevicesState.lock.angle = body.lock.angle;
      if (typeof body.lock.autoLockSeconds === "number") globalDevicesState.lock.autoLockSeconds = body.lock.autoLockSeconds;
      if (typeof body.lock.alarm === "boolean") globalDevicesState.lock.alarm = body.lock.alarm;
      globalDevicesState.lock.lastUpdated = Date.now();
    }

    // 4. RGB NeoPixel
    if (body.rgb) {
      if (typeof body.rgb.power === "boolean") globalDevicesState.rgb.power = body.rgb.power;
      if (typeof body.rgb.color === "string") globalDevicesState.rgb.color = body.rgb.color;
      if (typeof body.rgb.brightness === "number") globalDevicesState.rgb.brightness = body.rgb.brightness;
      if (body.rgb.effect) globalDevicesState.rgb.effect = body.rgb.effect;
      if (typeof body.rgb.speed === "number") globalDevicesState.rgb.speed = body.rgb.speed;
      globalDevicesState.rgb.lastUpdated = Date.now();
    }

    // 5. Irrigation (Sulama)
    if (body.irrigation) {
      if (typeof body.irrigation.pump === "boolean") globalDevicesState.irrigation.pump = body.irrigation.pump;
      if (typeof body.irrigation.soilMoisture === "number") globalDevicesState.irrigation.soilMoisture = body.irrigation.soilMoisture;
      if (typeof body.irrigation.autoWatering === "boolean") globalDevicesState.irrigation.autoWatering = body.irrigation.autoWatering;
      if (typeof body.irrigation.threshold === "number") globalDevicesState.irrigation.threshold = body.irrigation.threshold;
      if (typeof body.irrigation.waterTankLevel === "number") globalDevicesState.irrigation.waterTankLevel = body.irrigation.waterTankLevel;
      globalDevicesState.irrigation.lastUpdated = Date.now();
    }

    // 6. Automations
    if (body.automations) {
      if (typeof body.automations.tempAutoFan === "boolean") globalDevicesState.automations.tempAutoFan = body.automations.tempAutoFan;
      if (typeof body.automations.soilAutoPump === "boolean") globalDevicesState.automations.soilAutoPump = body.automations.soilAutoPump;
      if (typeof body.automations.nightMode === "boolean") {
        globalDevicesState.automations.nightMode = body.automations.nightMode;
        if (body.automations.nightMode) {
          // Night mode preset
          globalDevicesState.lamp.power = true;
          globalDevicesState.lamp.brightness = 20;
          globalDevicesState.lock.locked = true;
          globalDevicesState.lock.angle = 90;
        }
      }
    }

    return NextResponse.json({
      success: true,
      state: globalDevicesState,
    }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
