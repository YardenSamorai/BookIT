"use server";

import { eq, sql, count, desc, and, gte, lte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  businesses,
  users,
  notificationLogs,
  adminBillingRecords,
  appointments,
  staffMembers,
  services,
  cardTemplates,
  products,
} from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { type PlanType, PLAN_LIMITS } from "@/lib/plans/limits";

type ActionResult = { success: true } | { success: false; error: string };

function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function periodLabel(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ── Dashboard Stats ──

export async function getAdminDashboardStats() {
  await requireSuperAdmin();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [bizStats] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} = 'ACTIVE')`,
      free: sql<number>`count(*) filter (where ${businesses.subscriptionPlan} = 'FREE')`,
      cancelled: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} = 'CANCELLED')`,
    })
    .from(businesses);

  const [msgStats] = await db
    .select({
      total: count(),
      whatsapp: sql<number>`count(*) filter (where ${notificationLogs.channel} = 'WHATSAPP')`,
      sms: sql<number>`count(*) filter (where ${notificationLogs.channel} = 'SMS')`,
    })
    .from(notificationLogs)
    .where(
      and(
        gte(notificationLogs.createdAt, monthStart),
        lte(notificationLogs.createdAt, monthEnd)
      )
    );

  const [revenueResult] = await db
    .select({
      total: sql<number>`coalesce(sum(${adminBillingRecords.amountIls}), 0)`,
    })
    .from(adminBillingRecords)
    .where(
      and(
        eq(adminBillingRecords.status, "PAID"),
        eq(adminBillingRecords.periodLabel, periodLabel(now))
      )
    );

  const [signups] = await db
    .select({ total: count() })
    .from(businesses)
    .where(gte(businesses.createdAt, thirtyDaysAgo));

  return {
    businesses: {
      total: bizStats?.total ?? 0,
      active: bizStats?.active ?? 0,
      trial: bizStats?.free ?? 0,
      cancelled: bizStats?.cancelled ?? 0,
    },
    revenue: (revenueResult?.total ?? 0) / 100,
    messages: {
      total: msgStats?.total ?? 0,
      whatsapp: msgStats?.whatsapp ?? 0,
      sms: msgStats?.sms ?? 0,
    },
    newSignups: signups?.total ?? 0,
  };
}

// ── Businesses needing attention ──

export async function getBusinessesNeedingAttention() {
  await requireSuperAdmin();

  const overdue = await db
    .select({
      id: adminBillingRecords.id,
      businessId: adminBillingRecords.businessId,
      businessName: businesses.name,
      periodLabel: adminBillingRecords.periodLabel,
      amountIls: adminBillingRecords.amountIls,
    })
    .from(adminBillingRecords)
    .innerJoin(businesses, eq(adminBillingRecords.businessId, businesses.id))
    .where(eq(adminBillingRecords.status, "OVERDUE"))
    .orderBy(desc(adminBillingRecords.createdAt))
    .limit(10);

  return { overdue };
}

// ── Business List ──

export async function getAdminBusinessList() {
  await requireSuperAdmin();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const currentPeriod = periodLabel(now);

  const bizList = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      plan: businesses.subscriptionPlan,
      status: businesses.subscriptionStatus,
      messageQuotaOverride: businesses.messageQuotaOverride,
      brandingRemoved: businesses.brandingRemoved,
      createdAt: businesses.createdAt,
      ownerId: businesses.ownerId,
    })
    .from(businesses)
    .orderBy(desc(businesses.createdAt));

  const bizIds = bizList.map((b) => b.id);
  if (bizIds.length === 0) return [];

  const ownerIds = [...new Set(bizList.map((b) => b.ownerId))];
  const ownerRows = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(inArray(users.id, ownerIds));
  const ownerMap = new Map(ownerRows.map((o) => [o.id, o]));

  const msgCounts = await db
    .select({
      businessId: notificationLogs.businessId,
      total: count(),
    })
    .from(notificationLogs)
    .where(
      and(
        inArray(notificationLogs.businessId, bizIds),
        gte(notificationLogs.createdAt, monthStart),
        lte(notificationLogs.createdAt, monthEnd)
      )
    )
    .groupBy(notificationLogs.businessId);
  const msgMap = new Map(msgCounts.map((m) => [m.businessId, m.total]));

  const billingRows = await db
    .select({
      businessId: adminBillingRecords.businessId,
      status: adminBillingRecords.status,
    })
    .from(adminBillingRecords)
    .where(eq(adminBillingRecords.periodLabel, currentPeriod));
  const billingMap = new Map(billingRows.map((b) => [b.businessId, b.status]));

  return bizList.map((biz) => {
    const owner = ownerMap.get(biz.ownerId);
    const plan = biz.plan as PlanType;
    const quota = biz.messageQuotaOverride ?? PLAN_LIMITS[plan].maxMonthlyMessages;
    const msgCount = msgMap.get(biz.id) ?? 0;

    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      plan: biz.plan,
      status: biz.status,
      brandingRemoved: biz.brandingRemoved,
      createdAt: biz.createdAt,
      owner: owner
        ? { name: owner.name, email: owner.email, phone: owner.phone }
        : null,
      messages: { sent: msgCount, quota },
      billingStatus: billingMap.get(biz.id) ?? null,
    };
  });
}

// ── Business Detail ──

export async function getAdminBusinessDetail(businessId: string) {
  await requireSuperAdmin();

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!biz) return null;

  const owner = await db.query.users.findFirst({
    where: eq(users.id, biz.ownerId),
    columns: { id: true, name: true, email: true, phone: true },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [msgStats] = await db
    .select({
      total: count(),
      whatsapp: sql<number>`count(*) filter (where ${notificationLogs.channel} = 'WHATSAPP')`,
      sms: sql<number>`count(*) filter (where ${notificationLogs.channel} = 'SMS')`,
      confirmed: sql<number>`count(*) filter (where ${notificationLogs.type} = 'BOOKING_CONFIRMED')`,
      owner_notif: sql<number>`count(*) filter (where ${notificationLogs.type} = 'BOOKING_OWNER')`,
      reminder: sql<number>`count(*) filter (where ${notificationLogs.type} = 'REMINDER')`,
      cancellation: sql<number>`count(*) filter (where ${notificationLogs.type} = 'CANCELLATION')`,
      otp: sql<number>`count(*) filter (where ${notificationLogs.type} = 'OTP')`,
    })
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.businessId, businessId),
        gte(notificationLogs.createdAt, monthStart),
        lte(notificationLogs.createdAt, monthEnd)
      )
    );

  const plan = biz.subscriptionPlan as PlanType;
  const limits = PLAN_LIMITS[plan];
  const quota = biz.messageQuotaOverride ?? limits.maxMonthlyMessages;

  const billingRecords = await db
    .select()
    .from(adminBillingRecords)
    .where(eq(adminBillingRecords.businessId, businessId))
    .orderBy(desc(adminBillingRecords.periodLabel));

  // Usage counts for limits tab
  const [staffCount] = await db
    .select({ c: count() })
    .from(staffMembers)
    .where(eq(staffMembers.businessId, businessId));

  const [serviceCount] = await db
    .select({ c: count() })
    .from(services)
    .where(eq(services.businessId, businessId));

  const [bookingCount] = await db
    .select({ c: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.createdAt, monthStart),
        lte(appointments.createdAt, monthEnd)
      )
    );

  const [cardTemplateCount] = await db
    .select({ c: count() })
    .from(cardTemplates)
    .where(eq(cardTemplates.businessId, businessId));

  const [productCount] = await db
    .select({ c: count() })
    .from(products)
    .where(eq(products.businessId, businessId));

  const waEstCost = (msgStats?.whatsapp ?? 0) * 0.0084;
  const smsEstCost = (msgStats?.sms ?? 0) * 0.2575;

  return {
    business: {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      plan: biz.subscriptionPlan,
      status: biz.subscriptionStatus,
      messageQuotaOverride: biz.messageQuotaOverride,
      brandingRemoved: biz.brandingRemoved,
      createdAt: biz.createdAt,
    },
    owner,
    messages: {
      sent: msgStats?.total ?? 0,
      quota,
      whatsapp: msgStats?.whatsapp ?? 0,
      sms: msgStats?.sms ?? 0,
      byType: {
        confirmed: msgStats?.confirmed ?? 0,
        ownerNotif: msgStats?.owner_notif ?? 0,
        reminder: msgStats?.reminder ?? 0,
        cancellation: msgStats?.cancellation ?? 0,
        otp: msgStats?.otp ?? 0,
      },
      estimatedCost: {
        whatsapp: Math.round(waEstCost * 100) / 100,
        sms: Math.round(smsEstCost * 100) / 100,
        total: Math.round((waEstCost + smsEstCost) * 100) / 100,
      },
    },
    billing: billingRecords,
    usage: {
      staff: { used: staffCount?.c ?? 0, limit: limits.maxStaff },
      services: { used: serviceCount?.c ?? 0, limit: limits.maxServices },
      bookings: { used: bookingCount?.c ?? 0, limit: limits.maxBookingsPerMonth },
      cardTemplates: { used: cardTemplateCount?.c ?? 0, limit: limits.maxCardTemplates },
      products: { used: productCount?.c ?? 0, limit: limits.maxProducts },
    },
  };
}

// ── Mutations ──

export async function changeBusinessPlan(
  businessId: string,
  newPlan: "FREE" | "STARTER" | "PRO"
): Promise<ActionResult> {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({ subscriptionPlan: newPlan, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function changeBusinessStatus(
  businessId: string,
  newStatus: "ACTIVE" | "PAST_DUE" | "CANCELLED"
): Promise<ActionResult> {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({ subscriptionStatus: newStatus, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function toggleBusinessBranding(
  businessId: string,
  removeBranding: boolean
): Promise<ActionResult> {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({ brandingRemoved: removeBranding, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function setMessageQuotaOverride(
  businessId: string,
  quota: number | null
): Promise<ActionResult> {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({
      messageQuotaOverride: quota,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function createBillingRecord(
  businessId: string,
  period: string,
  amountIls: number
): Promise<ActionResult> {
  await requireSuperAdmin();

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { subscriptionPlan: true },
  });
  if (!biz) return { success: false, error: "Business not found" };

  await db.insert(adminBillingRecords).values({
    businessId,
    periodLabel: period,
    planAtTime: biz.subscriptionPlan,
    amountIls: Math.round(amountIls * 100),
    status: "PENDING",
  });

  revalidatePath(`/admin/businesses/${businessId}`);
  return { success: true };
}

export async function updateBillingRecord(
  recordId: string,
  status: "PENDING" | "PAID" | "OVERDUE" | "WAIVED",
  notes?: string
): Promise<ActionResult> {
  await requireSuperAdmin();

  await db
    .update(adminBillingRecords)
    .set({
      status,
      paidAt: status === "PAID" ? new Date() : null,
      notes: notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(adminBillingRecords.id, recordId));

  revalidatePath("/admin");
  return { success: true };
}
