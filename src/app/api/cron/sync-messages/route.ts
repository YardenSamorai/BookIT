import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import twilio from "twilio";
import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, "SENT" | "DELIVERED" | "FAILED" | "QUEUED"> = {
  queued: "QUEUED",
  sending: "QUEUED",
  sent: "SENT",
  delivered: "DELIVERED",
  read: "DELIVERED",
  failed: "FAILED",
  undelivered: "FAILED",
};

function detectChannel(from: string, to: string): "WHATSAPP" | "SMS" {
  if (from.startsWith("whatsapp:") || to.startsWith("whatsapp:")) return "WHATSAPP";
  return "SMS";
}

function detectType(body: string): "OTP" | "BOOKING_CONFIRMED" | "REMINDER" | "CANCELLATION" | "MANUAL" {
  if (body.includes("קוד האימות") || body.includes("verification code")) return "OTP";
  if (body.includes("אושר") || body.includes("confirmed")) return "BOOKING_CONFIRMED";
  if (body.includes("תזכורת") || body.includes("Reminder")) return "REMINDER";
  if (body.includes("בוטל") || body.includes("cancelled")) return "CANCELLATION";
  return "MANUAL";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
  }

  const client = twilio(accountSid, authToken);

  let synced = 0;
  let skipped = 0;

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messages = await client.messages.list({
      dateSentAfter: sevenDaysAgo,
      limit: 500,
    });

    for (const msg of messages) {
      if (msg.direction === "inbound") {
        skipped++;
        continue;
      }

      const existing = await db.query.notificationLogs.findFirst({
        where: eq(notificationLogs.providerMessageId, msg.sid),
        columns: { id: true },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const channel = detectChannel(msg.from, msg.to);
      const type = detectType(msg.body || "");
      const status = STATUS_MAP[msg.status] ?? "SENT";

      await db.insert(notificationLogs).values({
        businessId: null,
        channel,
        type,
        recipient: msg.to.replace("whatsapp:", ""),
        messageBody: msg.body || null,
        status,
        provider: "twilio",
        providerMessageId: msg.sid,
        sentAt: msg.dateSent ? new Date(msg.dateSent.toISOString()) : null,
      });

      synced++;
    }

    return NextResponse.json({ ok: true, synced, skipped });
  } catch (err) {
    console.error("Twilio sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
