import { NextResponse } from "next/server";
import { globalDevicesState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  // Check lamp auto-off
  if (globalDevicesState.lamp.autoOffTime && Date.now() >= globalDevicesState.lamp.autoOffTime) {
    globalDevicesState.lamp.power = false;
    globalDevicesState.lamp.autoOffTime = null;
    globalDevicesState.lamp.lastUpdated = Date.now();
  }

  // Telemetry online check (last 15s)
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

    // 1. Lamp Update
    if (body.lamp) {
      if (typeof body.lamp.power === "boolean") globalDevicesState.lamp.power = body.lamp.power;
      if (typeof body.lamp.brightness === "number") {
        globalDevicesState.lamp.brightness = Math.min(100, Math.max(0, Math.round(body.lamp.brightness)));
      }
      if (typeof body.lamp.color === "string") globalDevicesState.lamp.color = body.lamp.color;
      if (body.lamp.mode) globalDevicesState.lamp.mode = body.lamp.mode;
      if (typeof body.lamp.speed === "number") globalDevicesState.lamp.speed = body.lamp.speed;
      if (body.lamp.autoOffTime !== undefined) globalDevicesState.lamp.autoOffTime = body.lamp.autoOffTime;
      globalDevicesState.lamp.lastUpdated = Date.now();
    }

    // 2. Fan Update
    if (body.fan) {
      if (typeof body.fan.power === "boolean") globalDevicesState.fan.power = body.fan.power;
      if (typeof body.fan.speed === "number") {
        globalDevicesState.fan.speed = Math.min(100, Math.max(0, Math.round(body.fan.speed)));
      }
      if (body.fan.mode) globalDevicesState.fan.mode = body.fan.mode;
      if (typeof body.fan.targetTemp === "number") globalDevicesState.fan.targetTemp = body.fan.targetTemp;
      if (typeof body.fan.currentTemp === "number") globalDevicesState.fan.currentTemp = body.fan.currentTemp;
      if (typeof body.fan.oscillation === "boolean") globalDevicesState.fan.oscillation = body.fan.oscillation;
      globalDevicesState.fan.lastUpdated = Date.now();
    }

    // 3. Lock Update
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
