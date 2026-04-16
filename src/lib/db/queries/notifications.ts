import { eq, desc, sql, count, inArray, and, isNull, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationLogs, customers, users, businesses } from "@/lib/db/schema";

/**
 * Statuses that count toward a business's monthly message quota.
 *
 * A message "costs" a quota slot the moment Twilio accepts it — whether it
 * later transitions to DELIVERED (WhatsApp read receipt / SMS delivery
 * confirmation) is irrelevant for billing. We therefore treat SENT and
 * DELIVERED identically here.
 *
 * `QUEUED` is intentionally excluded: those messages may still fail locally
 * before they ever hit Twilio, and they get upgraded to SENT/FAILED within
 * seconds. `FAILED` is excluded because a failed send is never charged.
 *
 * This list is the single source of truth consumed by both the quota
 * banner on the messages dashboard and the server-side quota guard in
 * `send-notification.ts`. Previously the banner only counted `SENT`, which
 * made the bar silently reset to 0 as soon as the Twilio status-sync flipped
 * rows to `DELIVERED`.
 */
export const QUOTA_COUNTING_STATUSES = ["SENT", "DELIVERED"] as const;

/**
 * Count how many messages this business has consumed from its monthly quota
 * since the given month boundary. Historical rows already marked DELIVERED
 * are automatically included, which is why no data backfill is needed — the
 * "retroactive" fix happens on the next query.
 */
export async function countMessagesThisMonth(
  businessId: string,
  monthStart: Date
): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.businessId, businessId),
        inArray(notificationLogs.status, [...QUOTA_COUNTING_STATUSES]),
        gte(notificationLogs.createdAt, monthStart)
      )
    );
  return row?.c ?? 0;
}

export async function getNotificationLogs(businessId: string, limit = 100) {
  return db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.businessId, businessId))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(limit);
}

export async function getNotificationStats(businessId: string) {
  const [totals] = await db
    .select({
      total: count(),
      sent: sql<number>`count(*) filter (where ${notificationLogs.status} = 'SENT')`,
      delivered: sql<number>`count(*) filter (where ${notificationLogs.status} = 'DELIVERED')`,
      failed: sql<number>`count(*) filter (where ${notificationLogs.status} = 'FAILED')`,
      whatsapp: sql<number>`count(*) filter (where ${notificationLogs.channel} = 'WHATSAPP')`,
      sms: sql<number>`count(*) filter (where ${notificationLogs.channel} = 'SMS')`,
    })
    .from(notificationLogs)
    .where(eq(notificationLogs.businessId, businessId));

  return {
    total: totals?.total ?? 0,
    sent: (totals?.sent ?? 0) + (totals?.delivered ?? 0),
    failed: totals?.failed ?? 0,
    whatsapp: totals?.whatsapp ?? 0,
    sms: totals?.sms ?? 0,
  };
}

/**
 * Remove notification logs that were bulk-synced from Twilio (no userId, no appointmentId)
 * rather than logged at send-time by the app. These are unreliable because the shared
 * Twilio account can't distinguish which business triggered a message.
 * Also removes logs where the recipient doesn't match any known customer/owner.
 */
export async function cleanupMisattributedLogs(businessId: string) {
  function normalize(phone: string): string {
    let c = phone.replace(/^whatsapp:/, "").replace(/[\s\-()]/g, "");
    if (c.startsWith("+972")) c = "0" + c.slice(4);
    else if (c.startsWith("972")) c = "0" + c.slice(3);
    else if (c.startsWith("+")) c = c.slice(1);
    return c;
  }

  // 1) Remove synced-in orphans (no userId AND no appointmentId means the sync created them)
  const orphanLogs = await db
    .select({ id: notificationLogs.id })
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.businessId, businessId),
        isNull(notificationLogs.userId),
        isNull(notificationLogs.appointmentId)
      )
    );

  const orphanIds = orphanLogs.map((l) => l.id);

  // 2) Remove logs whose recipient doesn't match any customer/owner
  const custRows = await db
    .select({ phone: users.phone })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(customers.businessId, businessId));

  const ownerBiz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { ownerId: true },
  });
  let ownerPhone: string | null = null;
  if (ownerBiz?.ownerId) {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, ownerBiz.ownerId),
      columns: { phone: true },
    });
    ownerPhone = owner?.phone ?? null;
  }

  const knownPhones = new Set<string>();
  for (const r of custRows) {
    if (r.phone) knownPhones.add(normalize(r.phone));
  }
  if (ownerPhone) knownPhones.add(normalize(ownerPhone));

  const allLogs = await db
    .select({ id: notificationLogs.id, recipient: notificationLogs.recipient })
    .from(notificationLogs)
    .where(eq(notificationLogs.businessId, businessId));

  const unknownRecipientIds: string[] = [];
  for (const log of allLogs) {
    const normalized = normalize(log.recipient);
    if (!knownPhones.has(normalized)) {
      unknownRecipientIds.push(log.id);
    }
  }

  const toDelete = [...new Set([...orphanIds, ...unknownRecipientIds])];

  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      await db.delete(notificationLogs).where(
        inArray(notificationLogs.id, batch)
      );
    }
  }

  return { deleted: toDelete.length };
}
