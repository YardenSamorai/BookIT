import { eq, desc, sql, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationLogs, customers, users, businesses } from "@/lib/db/schema";

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
 * Remove notification logs attributed to a business where the recipient
 * doesn't match any customer of that business (or the owner).
 * This fixes misattributed synced messages.
 */
export async function cleanupMisattributedLogs(businessId: string) {
  function normalize(phone: string): string {
    let c = phone.replace(/^whatsapp:/, "").replace(/[\s\-()]/g, "");
    if (c.startsWith("+972")) c = "0" + c.slice(4);
    else if (c.startsWith("972")) c = "0" + c.slice(3);
    else if (c.startsWith("+")) c = c.slice(1);
    return c;
  }

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

  const toDelete: string[] = [];
  for (const log of allLogs) {
    const normalized = normalize(log.recipient);
    if (!knownPhones.has(normalized)) {
      toDelete.push(log.id);
    }
  }

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
