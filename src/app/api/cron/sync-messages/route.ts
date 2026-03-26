import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { syncTwilioMessagesCore } from "@/lib/notifications/sync-twilio";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allBusinesses = await db
      .select({ id: businesses.id })
      .from(businesses);

    if (allBusinesses.length === 0) {
      return NextResponse.json({ error: "No businesses found" }, { status: 404 });
    }

    const results: Record<string, unknown> = {};
    for (const biz of allBusinesses) {
      try {
        results[biz.id] = await syncTwilioMessagesCore(biz.id);
      } catch (err) {
        console.error(`Twilio sync error for business ${biz.id}:`, err);
        results[biz.id] = { error: String(err) };
      }
    }

    return NextResponse.json({ ok: true, synced: allBusinesses.length, results });
  } catch (err) {
    console.error("Twilio sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
