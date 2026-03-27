import { NextRequest, NextResponse } from "next/server";
import { syncInboundChanges } from "@/lib/calendar/google-sync";

export async function POST(request: NextRequest) {
  const channelToken = request.headers.get("x-goog-channel-token");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (!channelToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  try {
    await syncInboundChanges(channelToken);
  } catch (err) {
    console.error("[GCal Webhook] Error:", err);
  }

  return NextResponse.json({ ok: true });
}
