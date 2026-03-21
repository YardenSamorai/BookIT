import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, "SENT" | "DELIVERED" | "FAILED" | "QUEUED"> = {
  queued: "QUEUED",
  sent: "SENT",
  delivered: "DELIVERED",
  read: "DELIVERED",
  failed: "FAILED",
  undelivered: "FAILED",
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const messageSid = formData.get("MessageSid") as string | null;
    const messageStatus = formData.get("MessageStatus") as string | null;
    const errorCode = formData.get("ErrorCode") as string | null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newStatus = STATUS_MAP[messageStatus] ?? "SENT";

    const existing = await db.query.notificationLogs.findFirst({
      where: eq(notificationLogs.providerMessageId, messageSid),
      columns: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const shouldUpdate =
      (newStatus === "DELIVERED" && existing.status !== "DELIVERED") ||
      (newStatus === "FAILED" && existing.status !== "FAILED");

    if (shouldUpdate) {
      await db
        .update(notificationLogs)
        .set({
          status: newStatus,
          ...(newStatus === "FAILED" && errorCode
            ? { errorMessage: `Twilio error: ${errorCode}` }
            : {}),
        })
        .where(eq(notificationLogs.id, existing.id));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Twilio status webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
