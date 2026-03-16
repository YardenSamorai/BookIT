import { eq, and, asc, desc } from "drizzle-orm";
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
} from "@/lib/db/schema";
import { getBusinessRatingStats } from "./reviews";

export async function getPublicBusinessData(slug: string) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
  });

  if (!business || !business.published) return null;

  const [hours, serviceList, staff, siteConfig, staffServiceRows, productList, publishedReviews, ratingStats] = await Promise.all([
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
  };
}

export type PublicBusinessData = NonNullable<
  Awaited<ReturnType<typeof getPublicBusinessData>>
>;
