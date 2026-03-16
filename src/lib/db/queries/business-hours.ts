import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessHours } from "@/lib/db/schema";

export async function getBusinessHours(businessId: string) {
  return db.query.businessHours.findMany({
    where: eq(businessHours.businessId, businessId),
    orderBy: [asc(businessHours.dayOfWeek)],
  });
}
