import { NextResponse } from "next/server";
import { globalLampState, LampState } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  // Check auto-off timer
  if (globalLampState.autoOffTime && Date.now() >= globalLampState.autoOffTime) {
    globalLampState.power = false;
    globalLampState.autoOffTime = null;
    globalLampState.lastUpdated = Date.now();
  }

  return NextResponse.json(globalLampState, {
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
      globalLampState.power = body.power;
    }
    if (typeof body.brightness === "number") {
      globalLampState.brightness = Math.min(100, Math.max(0, Math.round(body.brightness)));
    }
    if (typeof body.color === "string") {
      globalLampState.color = body.color;
    }
    if (body.mode && ["solid", "breathe", "strobe", "rainbow"].includes(body.mode)) {
      globalLampState.mode = body.mode;
    }
    if (typeof body.speed === "number") {
      globalLampState.speed = Math.min(10, Math.max(1, body.speed));
    }
    if (body.autoOffTime !== undefined) {
      globalLampState.autoOffTime = body.autoOffTime;
    }

    globalLampState.lastUpdated = Date.now();

    return NextResponse.json({
      success: true,
      state: globalLampState,
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
