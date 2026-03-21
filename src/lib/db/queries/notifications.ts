import { eq, desc, and, sql, count, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";

export async function getNotificationLogs(businessId: string, limit = 100) {
  return db
    .select()
    .from(notificationLogs)
    .where(
      or(
        eq(notificationLogs.businessId, businessId),
        isNull(notificationLogs.businessId)
      )
    )
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
    .where(
      or(
        eq(notificationLogs.businessId, businessId),
        isNull(notificationLogs.businessId)
      )
    );

  return {
    total: totals?.total ?? 0,
    sent: (totals?.sent ?? 0) + (totals?.delivered ?? 0),
    failed: totals?.failed ?? 0,
    whatsapp: totals?.whatsapp ?? 0,
    sms: totals?.sms ?? 0,
  };
}
