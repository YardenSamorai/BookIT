import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import twilio from "twilio";
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

function verifyTwilioSignature(req: NextRequest, body: Record<string, string>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const signature = req.headers.get("x-twilio-signature");
  if (!signature) return false;

  const callbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL;
  if (!callbackUrl) return false;

  return twilio.validateRequest(authToken, signature, callbackUrl, body);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    if (process.env.NODE_ENV !== "development") {
      if (!verifyTwilioSignature(request, params)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;
    const errorCode = params.ErrorCode;

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
