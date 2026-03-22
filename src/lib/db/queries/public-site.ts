import { eq, and, asc, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  businessHours,
  services,
  serviceStaff,
  staffMembers,
  siteConfigs,
  products,
  reviews,
  users,
  classSchedules,
  cardTemplates,
  cardTemplateServices,
} from "@/lib/db/schema";
import { getBusinessRatingStats } from "./reviews";

export async function getPublicBusinessData(slug: string) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business || !business.published) return null;

  const [hours, serviceList, staff, siteConfig, staffServiceRows, productList, publishedReviews, ratingStats, activeClassSchedule, purchasableCards] = await Promise.all([
    db.query.businessHours.findMany({
      where: eq(businessHours.businessId, business.id),
      orderBy: [asc(businessHours.dayOfWeek)],
    }),
    db.query.services.findMany({
      where: eq(services.businessId, business.id),
      orderBy: [asc(services.sortOrder)],
    }),
    db.query.staffMembers.findMany({
      where: eq(staffMembers.businessId, business.id),
      orderBy: [asc(staffMembers.sortOrder)],
    }),
    db.query.siteConfigs.findFirst({
      where: eq(siteConfigs.businessId, business.id),
    }),
    db.select().from(serviceStaff),
    db.query.products.findMany({
      where: eq(products.businessId, business.id),
      orderBy: [asc(products.sortOrder)],
    }),
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
        serviceName: services.title,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .leftJoin(services, eq(reviews.serviceId, services.id))
      .where(and(eq(reviews.businessId, business.id), eq(reviews.isPublished, true)))
      .orderBy(desc(reviews.createdAt))
      .limit(20),
    getBusinessRatingStats(business.id),
    db.query.classSchedules.findFirst({
      where: and(
        eq(classSchedules.businessId, business.id),
        eq(classSchedules.isActive, true)
      ),
      columns: { id: true },
    }),
    db
      .select({
        id: cardTemplates.id,
        name: cardTemplates.name,
        description: cardTemplates.description,
        sessionCount: cardTemplates.sessionCount,
        price: cardTemplates.price,
        expirationDays: cardTemplates.expirationDays,
        displayOrder: cardTemplates.displayOrder,
      })
      .from(cardTemplates)
      .where(
        and(
          eq(cardTemplates.businessId, business.id),
          eq(cardTemplates.isActive, true),
          eq(cardTemplates.isPurchasable, true),
          eq(cardTemplates.isArchived, false)
        )
      )
      .orderBy(asc(cardTemplates.displayOrder), asc(cardTemplates.createdAt)),
  ]);

  const visibleProducts = productList.filter((p) => p.isVisible);
  const activeServices = serviceList.filter((s) => s.isActive);
  const activeStaff = staff.filter((s) => s.isActive);
  const activeServiceIds = new Set(activeServices.map((s) => s.id));
  const activeStaffIds = new Set(activeStaff.map((s) => s.id));

  const staffServiceMap: Record<string, string[]> = {};
  for (const row of staffServiceRows) {
    if (!activeServiceIds.has(row.serviceId) || !activeStaffIds.has(row.staffId)) continue;
    if (!staffServiceMap[row.staffId]) staffServiceMap[row.staffId] = [];
    staffServiceMap[row.staffId].push(row.serviceId);
  }

  const serviceStaffMap: Record<string, string[]> = {};
  for (const row of staffServiceRows) {
    if (!activeServiceIds.has(row.serviceId) || !activeStaffIds.has(row.staffId)) continue;
    if (!serviceStaffMap[row.serviceId]) serviceStaffMap[row.serviceId] = [];
    serviceStaffMap[row.serviceId].push(row.staffId);
  }

  // Load service links for purchasable card templates
  let cardTemplatesWithServices: Array<typeof purchasableCards[number] & { services: Array<{ serviceId: string; serviceName: string }> }> = [];
  if (purchasableCards.length > 0) {
    const templateIds = purchasableCards.map((c) => c.id);
    const serviceLinks = await db
      .select({
        cardTemplateId: cardTemplateServices.cardTemplateId,
        serviceId: cardTemplateServices.serviceId,
        serviceName: services.title,
      })
      .from(cardTemplateServices)
      .innerJoin(services, eq(cardTemplateServices.serviceId, services.id))
      .where(
        sql`${cardTemplateServices.cardTemplateId} IN (${sql.join(
          templateIds.map((id) => sql`${id}::uuid`),
          sql`, `
        )})`
      );

    cardTemplatesWithServices = purchasableCards.map((c) => ({
      ...c,
      services: serviceLinks.filter((s) => s.cardTemplateId === c.id),
    }));
  }

  return {
    business,
    hours,
    services: activeServices,
    staff: activeStaff,
    staffServiceMap,
    serviceStaffMap,
    siteConfig,
    products: visibleProducts,
    reviews: publishedReviews,
    ratingStats,
    hasWorkouts: !!activeClassSchedule,
    cardTemplates: cardTemplatesWithServices,
  };
}

export type PublicBusinessData = NonNullable<
  Awaited<ReturnType<typeof getPublicBusinessData>>
>;
