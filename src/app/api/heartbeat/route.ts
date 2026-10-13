import { NextResponse } from "next/server";
import { globalTelemetry } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const isOnline = Date.now() - globalTelemetry.lastSeen < 15000; // Considered online if pinged in last 15s
  return NextResponse.json({
    ...globalTelemetry,
    online: isOnline,
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
    globalTelemetry.online = true;
    globalTelemetry.lastSeen = Date.now();
    if (body.ip) globalTelemetry.ip = String(body.ip);
    if (typeof body.rssi === "number") globalTelemetry.rssi = body.rssi;
    if (body.deviceType) globalTelemetry.deviceType = String(body.deviceType);
    if (typeof body.uptimeSeconds === "number") globalTelemetry.uptimeSeconds = body.uptimeSeconds;

    return NextResponse.json({ success: true, acknowledgedAt: Date.now() }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
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
