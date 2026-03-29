import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

export async function getBusinessBySlug(slug: string) {
  return db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { id: true },
  });
}

export async function getBusinessByOwnerId(ownerId: string) {
  return db.query.businesses.findFirst({
    where: eq(businesses.ownerId, ownerId),
  });
}

export async function getBusinessLocale(businessId: string) {
  const row = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { language: true },
  });
  return (row?.language ?? "he") as "en" | "he";
}

export async function getBusinessCurrency(businessId: string) {
  const row = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { currency: true },
  });
  return row?.currency ?? "ILS";
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const existing = await getBusinessBySlug(slug);
  return !existing;
}

export async function getEnabledModules(businessId: string): Promise<string[] | null> {
  const row = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { enabledModules: true },
  });
  if (!row?.enabledModules) return null;
  try {
    return JSON.parse(row.enabledModules) as string[];
  } catch {
    return null;
  }
}

export async function isModuleEnabled(businessId: string, moduleKey: string): Promise<boolean> {
  const modules = await getEnabledModules(businessId);
  if (modules === null) return true;
  return modules.includes(moduleKey);
}
