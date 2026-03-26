import { eq, and, or, gt, sql, desc, asc, isNull, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cardTemplates,
  cardTemplateServices,
  customerCards,
  cardUsages,
  services,
  customers,
  users,
  appointments,
} from "@/lib/db/schema";

// ─── Eligibility Filter ─────────────────────────────────────────────────────
// Single source of truth for the 4 eligibility conditions.
// Used by all code paths that check whether a card can be used.

export function buildCardEligibilityConditions() {
  return and(
    eq(customerCards.status, "ACTIVE"),
    eq(customerCards.paymentStatus, "PAID"),
    gt(customerCards.sessionsRemaining, 0),
    or(
      isNull(customerCards.expiresAt),
      gt(customerCards.expiresAt, sql`now()`)
    )
  );
}

// ─── Card Templates ─────────────────────────────────────────────────────────

export async function getCardTemplates(
  businessId: string,
  includeArchived = false
) {
  const templates = await db
    .select({
      id: cardTemplates.id,
      name: cardTemplates.name,
      description: cardTemplates.description,
      sessionCount: cardTemplates.sessionCount,
      price: cardTemplates.price,
      expirationDays: cardTemplates.expirationDays,
      isActive: cardTemplates.isActive,
      isPurchasable: cardTemplates.isPurchasable,
      isArchived: cardTemplates.isArchived,
      restoreOnLateCancel: cardTemplates.restoreOnLateCancel,
      restoreOnNoShow: cardTemplates.restoreOnNoShow,
      displayOrder: cardTemplates.displayOrder,
      createdAt: cardTemplates.createdAt,
    })
    .from(cardTemplates)
    .where(
      includeArchived
        ? eq(cardTemplates.businessId, businessId)
        : and(
            eq(cardTemplates.businessId, businessId),
            eq(cardTemplates.isArchived, false)
          )
    )
    .orderBy(asc(cardTemplates.displayOrder), asc(cardTemplates.createdAt));

  const templateIds = templates.map((t) => t.id);
  if (templateIds.length === 0) return [];

  const serviceLinks = await db
    .select({
      cardTemplateId: cardTemplateServices.cardTemplateId,
      serviceId: cardTemplateServices.serviceId,
      serviceName: services.title,
      serviceDuration: services.durationMinutes,
      servicePrice: services.price,
    })
    .from(cardTemplateServices)
    .innerJoin(services, eq(cardTemplateServices.serviceId, services.id))
    .where(
      sql`${cardTemplateServices.cardTemplateId} IN (${sql.join(
        templateIds.map((id) => sql`${id}::uuid`),
        sql`, `
      )})`
    );

  return templates.map((t) => ({
    ...t,
    services: serviceLinks.filter((s) => s.cardTemplateId === t.id),
  }));
}

export type CardTemplateRow = Awaited<
  ReturnType<typeof getCardTemplates>
>[number];

export async function getCardTemplateById(templateId: string) {
  const template = await db.query.cardTemplates.findFirst({
    where: eq(cardTemplates.id, templateId),
  });
  if (!template) return null;

  const serviceLinks = await db
    .select({
      serviceId: cardTemplateServices.serviceId,
      serviceName: services.title,
    })
    .from(cardTemplateServices)
    .innerJoin(services, eq(cardTemplateServices.serviceId, services.id))
    .where(eq(cardTemplateServices.cardTemplateId, templateId));

  return { ...template, services: serviceLinks };
}

// ─── Customer Cards ─────────────────────────────────────────────────────────

export async function getCustomerCards(
  customerId: string,
  businessId: string
) {
  return db
    .select({
      id: customerCards.id,
      cardTemplateId: customerCards.cardTemplateId,
      templateSnapshotName: customerCards.templateSnapshotName,
      templateSnapshotDescription: customerCards.templateSnapshotDescription,
      templateSnapshotSessionCount: customerCards.templateSnapshotSessionCount,
      templateSnapshotPrice: customerCards.templateSnapshotPrice,
      templateSnapshotExpirationDays:
        customerCards.templateSnapshotExpirationDays,
      snapshotRestoreOnLateCancel: customerCards.snapshotRestoreOnLateCancel,
      snapshotRestoreOnNoShow: customerCards.snapshotRestoreOnNoShow,
      sessionsTotal: customerCards.sessionsTotal,
      sessionsUsed: customerCards.sessionsUsed,
      sessionsRemaining: customerCards.sessionsRemaining,
      status: customerCards.status,
      paymentStatus: customerCards.paymentStatus,
      paymentMethod: customerCards.paymentMethod,
      paymentConfirmedAt: customerCards.paymentConfirmedAt,
      source: customerCards.source,
      notes: customerCards.notes,
      purchasedAt: customerCards.purchasedAt,
      expiresAt: customerCards.expiresAt,
      closedAt: customerCards.closedAt,
      createdAt: customerCards.createdAt,
    })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.customerId, customerId),
        eq(customerCards.businessId, businessId)
      )
    )
    .orderBy(desc(customerCards.purchasedAt));
}

export type CustomerCardRow = Awaited<
  ReturnType<typeof getCustomerCards>
>[number];

// ─── Find Active Card for Service ───────────────────────────────────────────
// Uses eligibility filter + selection algorithm:
// 1. earliest expiry first (NULLS LAST)
// 2. oldest purchase first (FIFO)
// 3. lowest remaining first

export async function findActiveCardsForService(
  customerId: string,
  serviceId: string
) {
  const eligibleCards = await db
    .select({
      id: customerCards.id,
      templateSnapshotName: customerCards.templateSnapshotName,
      sessionsRemaining: customerCards.sessionsRemaining,
      sessionsTotal: customerCards.sessionsTotal,
      sessionsUsed: customerCards.sessionsUsed,
      expiresAt: customerCards.expiresAt,
      purchasedAt: customerCards.purchasedAt,
      snapshotRestoreOnLateCancel: customerCards.snapshotRestoreOnLateCancel,
      snapshotRestoreOnNoShow: customerCards.snapshotRestoreOnNoShow,
    })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.customerId, customerId),
        buildCardEligibilityConditions(),
        or(
          sql`EXISTS (
            SELECT 1 FROM card_template_service cts
            WHERE cts.card_template_id = ${customerCards.cardTemplateId}
              AND cts.service_id = ${serviceId}::uuid
          )`,
          sql`NOT EXISTS (
            SELECT 1 FROM card_template_service cts
            WHERE cts.card_template_id = ${customerCards.cardTemplateId}
          )`
        )
      )
    )
    .orderBy(
      sql`${customerCards.expiresAt} ASC NULLS LAST`,
      asc(customerCards.purchasedAt),
      asc(customerCards.sessionsRemaining)
    );

  return eligibleCards;
}

export type EligibleCard = Awaited<
  ReturnType<typeof findActiveCardsForService>
>[number];

// ─── Card Usage History ─────────────────────────────────────────────────────

export async function getCardUsageHistory(customerCardId: string) {
  return db
    .select({
      id: cardUsages.id,
      action: cardUsages.action,
      deltaSessions: cardUsages.deltaSessions,
      actorType: cardUsages.actorType,
      notes: cardUsages.notes,
      createdAt: cardUsages.createdAt,
      appointmentId: cardUsages.appointmentId,
      appointmentStartTime: appointments.startTime,
      serviceName: services.title,
    })
    .from(cardUsages)
    .leftJoin(appointments, eq(cardUsages.appointmentId, appointments.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(cardUsages.customerCardId, customerCardId))
    .orderBy(desc(cardUsages.createdAt));
}

export type CardUsageRow = Awaited<
  ReturnType<typeof getCardUsageHistory>
>[number];

// ─── Business-level usage history (for dashboard tab) ───────────────────────

export async function getBusinessCardUsageHistory(
  businessId: string,
  limit = 50
) {
  return db
    .select({
      id: cardUsages.id,
      action: cardUsages.action,
      deltaSessions: cardUsages.deltaSessions,
      actorType: cardUsages.actorType,
      notes: cardUsages.notes,
      createdAt: cardUsages.createdAt,
      cardName: customerCards.templateSnapshotName,
      customerName: users.name,
      serviceName: services.title,
    })
    .from(cardUsages)
    .innerJoin(customerCards, eq(cardUsages.customerCardId, customerCards.id))
    .innerJoin(customers, eq(customerCards.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .leftJoin(appointments, eq(cardUsages.appointmentId, appointments.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(eq(customerCards.businessId, businessId))
    .orderBy(desc(cardUsages.createdAt))
    .limit(limit);
}

// ─── All Customer Cards for Business (dashboard tab) ────────────────────────

export async function getBusinessCustomerCards(businessId: string) {
  return db
    .select({
      id: customerCards.id,
      templateSnapshotName: customerCards.templateSnapshotName,
      sessionsTotal: customerCards.sessionsTotal,
      sessionsUsed: customerCards.sessionsUsed,
      sessionsRemaining: customerCards.sessionsRemaining,
      status: customerCards.status,
      paymentStatus: customerCards.paymentStatus,
      paymentMethod: customerCards.paymentMethod,
      source: customerCards.source,
      purchasedAt: customerCards.purchasedAt,
      expiresAt: customerCards.expiresAt,
      closedAt: customerCards.closedAt,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(customerCards)
    .innerJoin(customers, eq(customerCards.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(customerCards.businessId, businessId))
    .orderBy(desc(customerCards.purchasedAt));
}

export type BusinessCustomerCardRow = Awaited<
  ReturnType<typeof getBusinessCustomerCards>
>[number];

// ─── Analytics ──────────────────────────────────────────────────────────────

export async function getCardAnalytics(businessId: string) {
  const [activeCardsResult] = await db
    .select({ value: count() })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.businessId, businessId),
        eq(customerCards.status, "ACTIVE")
      )
    );

  const [totalRevenueResult] = await db
    .select({
      value: sql<string>`COALESCE(SUM(${customerCards.templateSnapshotPrice}), 0)`,
    })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.businessId, businessId),
        eq(customerCards.paymentStatus, "PAID")
      )
    );

  const [sessionsUsedThisMonth] = await db
    .select({ value: count() })
    .from(cardUsages)
    .innerJoin(customerCards, eq(cardUsages.customerCardId, customerCards.id))
    .where(
      and(
        eq(customerCards.businessId, businessId),
        eq(cardUsages.action, "USED"),
        gt(cardUsages.createdAt, sql`date_trunc('month', now())`)
      )
    );

  const [avgUsageResult] = await db
    .select({
      value: sql<string>`
        COALESCE(
          ROUND(
            AVG(
              CASE WHEN ${customerCards.sessionsTotal} > 0
                THEN ${customerCards.sessionsUsed}::numeric / ${customerCards.sessionsTotal} * 100
                ELSE 0
              END
            ), 1
          ), 0
        )
      `,
    })
    .from(customerCards)
    .where(
      and(
        eq(customerCards.businessId, businessId),
        sql`${customerCards.status} IN ('ACTIVE', 'FULLY_USED', 'EXPIRED')`
      )
    );

  return {
    activeCards: activeCardsResult.value,
    totalRevenue: totalRevenueResult.value,
    sessionsUsedThisMonth: sessionsUsedThisMonth.value,
    avgUsageRate: avgUsageResult.value,
  };
}
