import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, serviceCategories, servicePackages, serviceStaff } from "@/lib/db/schema";

export async function getServices(businessId: string) {
  return db.query.services.findMany({
    where: eq(services.businessId, businessId),
    orderBy: [asc(services.sortOrder), asc(services.createdAt)],
  });
}

export async function getServiceById(id: string) {
  return db.query.services.findFirst({
    where: eq(services.id, id),
  });
}

export async function getServiceCategories(businessId: string) {
  return db.query.serviceCategories.findMany({
    where: eq(serviceCategories.businessId, businessId),
    orderBy: [asc(serviceCategories.sortOrder)],
  });
}

export async function getServicePackages(businessId: string) {
  return db.query.servicePackages.findMany({
    where: eq(servicePackages.businessId, businessId),
    orderBy: [asc(servicePackages.createdAt)],
  });
}

export async function getServiceStaffLinks(businessId: string) {
  return db
    .select({ serviceId: serviceStaff.serviceId, staffId: serviceStaff.staffId })
    .from(serviceStaff)
    .innerJoin(services, eq(serviceStaff.serviceId, services.id))
    .where(eq(services.businessId, businessId));
}
