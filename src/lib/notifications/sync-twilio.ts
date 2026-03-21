import { eq } from "drizzle-orm";
import twilio from "twilio";
import { db } from "@/lib/db";
import { notificationLogs, customers, users, businesses } from "@/lib/db/schema";

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

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/^whatsapp:/, "").replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+972")) cleaned = "0" + cleaned.slice(4);
  else if (cleaned.startsWith("972")) cleaned = "0" + cleaned.slice(3);
  else if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  return cleaned;
}

async function getBusinessPhones(businessId: string): Promise<Set<string>> {
  const rows = await db
    .select({ phone: users.phone })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(customers.businessId, businessId));

  const phones = new Set<string>();
  for (const r of rows) {
    if (r.phone) {
      phones.add(normalizePhone(r.phone));
    }
  }

  const ownerBiz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });
  if (ownerBiz?.ownerId) {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, ownerBiz.ownerId),
      columns: { phone: true },
    });
    if (owner?.phone) phones.add(normalizePhone(owner.phone));
  }

  return phones;
}

export async function syncTwilioMessagesCore(businessId: string): Promise<{ synced: number; skipped: number }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio not configured");
  }

  const client = twilio(accountSid, authToken);
  const businessPhones = await getBusinessPhones(businessId);

  let synced = 0;
  let skipped = 0;

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

    const recipientNormalized = normalizePhone(msg.to);
    if (!businessPhones.has(recipientNormalized)) {
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
      businessId,
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

  return { synced, skipped };
}
