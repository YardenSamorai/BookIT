import { eq, and, gte, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { systemAnnouncements, businesses } from "@/lib/db/schema";

export async function getActiveAnnouncements(businessId: string) {
  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { subscriptionPlan: true },
  });

  const plan = biz?.subscriptionPlan ?? "FREE";
  const now = new Date();

  const rows = await db
    .select({
      id: systemAnnouncements.id,
      title: systemAnnouncements.title,
      body: systemAnnouncements.body,
      type: systemAnnouncements.type,
    })
    .from(systemAnnouncements)
    .where(
      and(
        eq(systemAnnouncements.isActive, true),
        or(isNull(systemAnnouncements.targetPlan), eq(systemAnnouncements.targetPlan, plan)),
        or(isNull(systemAnnouncements.expiresAt), gte(systemAnnouncements.expiresAt, now))
      )
    );

  return rows;
}
