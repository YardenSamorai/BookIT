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
      .from(businesses)
      .limit(1);

    const businessId = allBusinesses[0]?.id;
    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const result = await syncTwilioMessagesCore(businessId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Twilio sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
