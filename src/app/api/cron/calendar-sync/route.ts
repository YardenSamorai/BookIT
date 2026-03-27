import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calendarConnections } from "@/lib/db/schema";
import {
  syncInboundChanges,
  setupWebhookChannel,
} from "@/lib/calendar/google-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.query.calendarConnections.findMany();

  let synced = 0;
  let channelsRenewed = 0;
  const errors: string[] = [];

  for (const conn of connections) {
    // Sync inbound changes
    try {
      await syncInboundChanges(conn.id);
      synced++;
    } catch (err) {
      errors.push(`sync-${conn.id}: ${String(err)}`);
    }

    // Renew webhook channel if expiring within 24 hours
    const renewThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (!conn.channelExpiration || conn.channelExpiration < renewThreshold) {
      try {
        await setupWebhookChannel(conn.id);
        channelsRenewed++;
      } catch (err) {
        errors.push(`webhook-${conn.id}: ${String(err)}`);
      }
    }
  }

  console.log(
    `[Calendar Sync Cron] ${synced}/${connections.length} synced, ${channelsRenewed} channels renewed`
  );

  return NextResponse.json({
    total: connections.length,
    synced,
    channelsRenewed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
