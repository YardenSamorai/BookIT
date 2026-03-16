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
