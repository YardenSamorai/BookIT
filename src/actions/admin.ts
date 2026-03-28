"use server";

import { eq, sql, count, desc, and, or, gte, lte, inArray } from "drizzle-orm";
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
  systemAnnouncements,
  coupons,
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

export type AdminGlobalStats = {
  appointments: { today: number; week: number; month: number };
  churn: { rate: number; cancelled: number; wasActive: number };
  planDistribution: { free: number; starter: number; pro: number };
};

export async function getAdminGlobalStats(): Promise<AdminGlobalStats> {
  await requireSuperAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [apptToday] = await db
    .select({ c: count() })
    .from(appointments)
    .where(
      and(gte(appointments.startTime, startOfToday), lte(appointments.startTime, endOfToday))
    );

  const [apptWeek] = await db
    .select({ c: count() })
    .from(appointments)
    .where(and(gte(appointments.startTime, sevenDaysAgo), lte(appointments.startTime, now)));

  const [apptMonth] = await db
    .select({ c: count() })
    .from(appointments)
    .where(and(gte(appointments.startTime, monthStart), lte(appointments.startTime, monthEnd)));

  const [churnCancelled] = await db
    .select({ c: count() })
    .from(businesses)
    .where(
      and(
        eq(businesses.subscriptionStatus, "CANCELLED"),
        gte(businesses.updatedAt, thirtyDaysAgo),
        lte(businesses.updatedAt, now)
      )
    );

  const [churnWasActive] = await db
    .select({ c: count() })
    .from(businesses)
    .where(
      and(
        lte(businesses.createdAt, thirtyDaysAgo),
        or(
          eq(businesses.subscriptionStatus, "ACTIVE"),
          and(
            eq(businesses.subscriptionStatus, "CANCELLED"),
            gte(businesses.updatedAt, thirtyDaysAgo)
          )
        )
      )
    );

  const [planRow] = await db
    .select({
      free: sql<number>`count(*) filter (where ${businesses.subscriptionPlan} = 'FREE')`,
      starter: sql<number>`count(*) filter (where ${businesses.subscriptionPlan} = 'STARTER')`,
      pro: sql<number>`count(*) filter (where ${businesses.subscriptionPlan} = 'PRO')`,
    })
    .from(businesses);

  const cancelled = churnCancelled?.c ?? 0;
  const wasActive = churnWasActive?.c ?? 0;
  const rate = wasActive > 0 ? Math.round((cancelled / wasActive) * 10000) / 100 : 0;

  return {
    appointments: {
      today: apptToday?.c ?? 0,
      week: apptWeek?.c ?? 0,
      month: apptMonth?.c ?? 0,
    },
    churn: {
      rate,
      cancelled,
      wasActive,
    },
    planDistribution: {
      free: planRow?.free ?? 0,
      starter: planRow?.starter ?? 0,
      pro: planRow?.pro ?? 0,
    },
  };
}

export async function getRevenueStats() {
  await requireSuperAdmin();

  const planCounts = await db
    .select({
      plan: businesses.subscriptionPlan,
      count: count(),
    })
    .from(businesses)
    .where(eq(businesses.subscriptionStatus, "ACTIVE"))
    .groupBy(businesses.subscriptionPlan);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const minPeriod = periodLabel(sixMonthsAgo);

  const monthlyRevenueRows = await db
    .select({
      period: adminBillingRecords.periodLabel,
      total: sql<number>`coalesce(sum(${adminBillingRecords.amountIls}), 0)`,
    })
    .from(adminBillingRecords)
    .where(
      and(eq(adminBillingRecords.status, "PAID"), gte(adminBillingRecords.periodLabel, minPeriod))
    )
    .groupBy(adminBillingRecords.periodLabel)
    .orderBy(adminBillingRecords.periodLabel);

  const planPrices: Record<string, number> = { FREE: 0, STARTER: 79, PRO: 149 };
  const mrr = planCounts.reduce((sum, p) => sum + (planPrices[p.plan] ?? 0) * p.count, 0);

  const [totalRevenue] = await db
    .select({
      total: sql<number>`coalesce(sum(${adminBillingRecords.amountIls}), 0)`,
    })
    .from(adminBillingRecords)
    .where(eq(adminBillingRecords.status, "PAID"));

  const now = new Date();
  const last6Periods: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Periods.push(periodLabel(d));
  }
  const revenueByPeriod = new Map(monthlyRevenueRows.map((r) => [r.period, r.total]));
  const monthlyRevenue = last6Periods.map((period) => ({
    period,
    amount: (revenueByPeriod.get(period) ?? 0) / 100,
  }));

  const planOrder = ["FREE", "STARTER", "PRO"] as const;
  const countByPlan = new Map(planCounts.map((p) => [p.plan, p.count]));
  const planDistribution = planOrder.map((plan) => ({
    plan,
    count: countByPlan.get(plan) ?? 0,
  }));

  return {
    planDistribution,
    monthlyRevenue,
    mrr,
    totalRevenue: (totalRevenue?.total ?? 0) / 100,
    totalActiveBusinesses: planCounts.reduce((s, p) => s + p.count, 0),
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

// ── User List ──

export async function getAdminUserList() {
  await requireSuperAdmin();

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return allUsers;
}

// ── Admin permissions (SUPER_ADMIN roster) ──

export async function getAdminUsers() {
  await requireSuperAdmin();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "SUPER_ADMIN"))
    .orderBy(desc(users.createdAt));
}

export async function promoteToAdmin(email: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { success: false, error: "נא להזין אימייל" };

  const user = await db.query.users.findFirst({
    where: eq(users.email, trimmed),
  });
  if (!user) return { success: false, error: "משתמש לא נמצא" };
  if (user.role === "SUPER_ADMIN") return { success: false, error: "משתמש כבר אדמין" };

  await db
    .update(users)
    .set({ role: "SUPER_ADMIN", updatedAt: new Date() })
    .where(eq(users.id, user.id));
  revalidatePath("/admin/permissions");
  return { success: true };
}

export async function demoteFromAdmin(userId: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const { auth } = await import("@/lib/auth/config");
  const session = await auth();
  if (session?.user?.id === userId) return { success: false, error: "לא ניתן להסיר את עצמך" };

  await db
    .update(users)
    .set({ role: "CUSTOMER", updatedAt: new Date() })
    .where(eq(users.id, userId));
  revalidatePath("/admin/permissions");
  return { success: true };
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
      galleryQuotaOverride: biz.galleryQuotaOverride,
      brandingRemoved: biz.brandingRemoved,
      createdAt: biz.createdAt,
    },
    owner: owner ?? null,
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
      galleryImages: { used: 0, limit: biz.galleryQuotaOverride ?? limits.maxGalleryImages },
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

export async function setGalleryQuotaOverride(
  businessId: string,
  quota: number | null
): Promise<ActionResult> {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({
      galleryQuotaOverride: quota,
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

// ── System announcements ──

export async function getAnnouncements() {
  await requireSuperAdmin();
  return db.select().from(systemAnnouncements).orderBy(desc(systemAnnouncements.createdAt));
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  type: string;
  targetPlan: string | null;
  expiresAt: string | null;
}): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.insert(systemAnnouncements).values({
    title: input.title,
    body: input.body,
    type: input.type,
    targetPlan: input.targetPlan || null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });
  revalidatePath("/admin/announcements");
  return { success: true };
}

export async function toggleAnnouncement(id: string, isActive: boolean): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.update(systemAnnouncements).set({ isActive }).where(eq(systemAnnouncements.id, id));
  revalidatePath("/admin/announcements");
  return { success: true };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.delete(systemAnnouncements).where(eq(systemAnnouncements.id, id));
  revalidatePath("/admin/announcements");
  return { success: true };
}

// ── Coupons ──

export async function getCoupons() {
  await requireSuperAdmin();
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function createCoupon(input: {
  code: string;
  description: string;
  discountPercent: number | null;
  freeMonths: number | null;
  targetPlan: string | null;
  maxUses: number | null;
  expiresAt: string | null;
}): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.insert(coupons).values({
    code: input.code.toUpperCase().trim(),
    description: input.description || null,
    discountPercent: input.discountPercent,
    freeMonths: input.freeMonths,
    targetPlan: input.targetPlan || null,
    maxUses: input.maxUses,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
  });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function toggleCoupon(id: string, isActive: boolean): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.update(coupons).set({ isActive }).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.delete(coupons).where(eq(coupons.id, id));
  revalidatePath("/admin/coupons");
  return { success: true };
}

// ── Bulk email to business owners ──

export type BusinessOwnerEmailRow = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
};

export async function getBusinessOwnerEmails(filter?: {
  plan?: "FREE" | "STARTER" | "PRO";
  status?: "ACTIVE" | "CANCELLED" | "PAST_DUE";
}): Promise<BusinessOwnerEmailRow[]> {
  await requireSuperAdmin();

  const conditions = [];
  if (filter?.plan) conditions.push(eq(businesses.subscriptionPlan, filter.plan));
  if (filter?.status) conditions.push(eq(businesses.subscriptionStatus, filter.status));

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      plan: businesses.subscriptionPlan,
      status: businesses.subscriptionStatus,
      ownerId: businesses.ownerId,
    })
    .from(businesses)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(businesses.name);

  const ownerIds = [...new Set(rows.map((r) => r.ownerId))];
  if (ownerIds.length === 0) return [];

  const owners = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, ownerIds));
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  const out: BusinessOwnerEmailRow[] = [];
  for (const r of rows) {
    const owner = ownerMap.get(r.ownerId);
    if (!owner?.email) continue;
    out.push({
      id: r.id,
      name: r.name,
      email: owner.email,
      plan: r.plan,
      status: r.status,
    });
  }
  return out;
}

export async function sendBulkEmail(input: {
  subject: string;
  body: string;
  recipientEmails: string[];
}): Promise<{ success: boolean; sent: number; failed: number }> {
  await requireSuperAdmin();

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < input.recipientEmails.length; i += 10) {
    const batch = input.recipientEmails.slice(i, i + 10);
    const results = await Promise.all(
      batch.map(async (email) => {
        try {
          await resend.emails.send({
            from: "BookIT <noreply@book2it.app>",
            to: email,
            subject: input.subject,
            html: input.body.replace(/\n/g, "<br />"),
          });
          return true;
        } catch {
          return false;
        }
      })
    );
    sent += results.filter(Boolean).length;
    failed += results.filter((r) => !r).length;
  }

  return { success: true, sent, failed };
}
