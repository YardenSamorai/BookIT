import { eq } from "drizzle-orm";
import twilio from "twilio";
import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";

const STATUS_MAP: Record<string, "SENT" | "DELIVERED" | "FAILED" | "QUEUED"> = {
  queued: "QUEUED",
  sending: "QUEUED",
  sent: "SENT",
  delivered: "DELIVERED",
  read: "DELIVERED",
  failed: "FAILED",
  undelivered: "FAILED",
};

/**
 * Sync only updates statuses for messages already logged by our app.
 * It does NOT create new log entries from Twilio -- those come only from
 * logNotification() at send-time, ensuring correct businessId attribution.
 */
export async function syncTwilioMessagesCore(businessId: string): Promise<{ synced: number; skipped: number }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio not configured");
  }

  const client = twilio(accountSid, authToken);

  const existingLogs = await db
    .select({
      id: notificationLogs.id,
      providerMessageId: notificationLogs.providerMessageId,
      status: notificationLogs.status,
    })
    .from(notificationLogs)
    .where(eq(notificationLogs.businessId, businessId));

  const logsWithSid = existingLogs.filter((l) => l.providerMessageId);
  if (logsWithSid.length === 0) {
    return { synced: 0, skipped: 0 };
  }

  const sidToLog = new Map(logsWithSid.map((l) => [l.providerMessageId!, l]));

  let synced = 0;
  let skipped = 0;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const messages = await client.messages.list({
    dateSentAfter: sevenDaysAgo,
    limit: 500,
  });

  for (const msg of messages) {
    const logEntry = sidToLog.get(msg.sid);
    if (!logEntry) {
      skipped++;
      continue;
    }

    const newStatus = STATUS_MAP[msg.status] ?? "SENT";
    if (logEntry.status !== newStatus) {
      await db
        .update(notificationLogs)
        .set({ status: newStatus })
        .where(eq(notificationLogs.id, logEntry.id));
      synced++;
    } else {
      skipped++;
    }
  }

  return { synced, skipped };
}
