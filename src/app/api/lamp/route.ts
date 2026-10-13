import { NextResponse } from "next/server";
import { globalDevicesState, LampState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (globalDevicesState.lamp.autoOffTime && Date.now() >= globalDevicesState.lamp.autoOffTime) {
    globalDevicesState.lamp.power = false;
    globalDevicesState.lamp.autoOffTime = null;
    globalDevicesState.lamp.lastUpdated = Date.now();
  }

  return NextResponse.json(globalDevicesState.lamp, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LampState>;

    if (typeof body.power === "boolean") {
      globalDevicesState.lamp.power = body.power;
    }
    if (typeof body.brightness === "number") {
      globalDevicesState.lamp.brightness = Math.min(100, Math.max(0, Math.round(body.brightness)));
    }
    if (typeof body.color === "string") {
      globalDevicesState.lamp.color = body.color;
    }
    if (body.mode && ["solid", "breathe", "strobe", "rainbow"].includes(body.mode)) {
      globalDevicesState.lamp.mode = body.mode;
    }
    if (typeof body.speed === "number") {
      globalDevicesState.lamp.speed = Math.min(10, Math.max(1, body.speed));
    }
    if (body.autoOffTime !== undefined) {
      globalDevicesState.lamp.autoOffTime = body.autoOffTime;
    }

    globalDevicesState.lamp.lastUpdated = Date.now();

    return NextResponse.json({
      success: true,
      state: globalDevicesState.lamp,
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
