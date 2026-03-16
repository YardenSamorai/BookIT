import { eq, and, desc, avg, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviews, users, services } from "@/lib/db/schema";

export async function getBusinessReviews(businessId: string) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      isPublished: reviews.isPublished,
      createdAt: reviews.createdAt,
      userName: users.name,
      userPhone: users.phone,
      serviceName: services.title,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .leftJoin(services, eq(reviews.serviceId, services.id))
    .where(eq(reviews.businessId, businessId))
    .orderBy(desc(reviews.createdAt));
}

export async function getPublishedReviews(businessId: string) {
  return db
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
    .where(and(eq(reviews.businessId, businessId), eq(reviews.isPublished, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(20);
}

export async function getBusinessRatingStats(businessId: string) {
  const [result] = await db
    .select({
      avgRating: avg(reviews.rating),
      totalReviews: count(reviews.id),
    })
    .from(reviews)
    .where(and(eq(reviews.businessId, businessId), eq(reviews.isPublished, true)));

  return {
    avgRating: result?.avgRating ? parseFloat(result.avgRating) : 0,
    totalReviews: result?.totalReviews ?? 0,
  };
}

export async function getRatingDistribution(businessId: string) {
  const rows = await db
    .select({
      rating: reviews.rating,
      count: count(reviews.id),
    })
    .from(reviews)
    .where(eq(reviews.businessId, businessId))
    .groupBy(reviews.rating)
    .orderBy(desc(reviews.rating));

  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const row of rows) {
    dist[row.rating] = row.count;
  }
  return dist;
}

export async function hasUserReviewedAppointment(userId: string, appointmentId: string) {
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.appointmentId, appointmentId)))
    .limit(1);
  return !!existing;
}
