"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { businesses, siteConfigs, services } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import {
  updateSectionsSchema,
  updateBrandSchema,
  socialLinksSchema,
  updateSeoSchema,
} from "@/validators/site-editor";
import type { ActionResult } from "@/types";
import type { SiteSection } from "@/lib/db/schema/site-config";
import type { UpdateSectionsInput, UpdateBrandInput, SocialLinksInput, UpdateSeoInput } from "@/validators/site-editor";

async function getBusinessSlug(businessId: string): Promise<string | null> {
  const row = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { slug: true },
  });
  return row?.slug ?? null;
}

function revalidatePublicSite(slug: string | null) {
  revalidatePath("/dashboard/site-editor");
  if (slug) revalidatePath(`/b/${slug}`);
  revalidatePath("/b");
}

export async function updateSiteSections(
  input: UpdateSectionsInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = updateSectionsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const sections = parsed.data as SiteSection[];

  await db
    .update(siteConfigs)
    .set({ sections, updatedAt: new Date() })
    .where(eq(siteConfigs.businessId, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function updateSiteBrand(
  input: UpdateBrandInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = updateBrandSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await db
    .update(businesses)
    .set({
      primaryColor: parsed.data.primaryColor,
      secondaryColor: parsed.data.secondaryColor,
      logoUrl: parsed.data.logoUrl || null,
      coverImageUrl: parsed.data.coverImageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function updateThemePreset(
  presetId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(siteConfigs)
    .set({ themePreset: presetId, updatedAt: new Date() })
    .where(eq(siteConfigs.businessId, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function updateFontFamily(
  fontFamily: string | null
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(siteConfigs)
    .set({ fontFamily: fontFamily || null, updatedAt: new Date() })
    .where(eq(siteConfigs.businessId, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function toggleSitePublished(
  published: boolean
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(businesses)
    .set({ published, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function savePuckData(
  data: Record<string, unknown>
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(siteConfigs)
    .set({ puckData: data, updatedAt: new Date() })
    .where(eq(siteConfigs.businessId, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function updateSocialLinks(
  input: SocialLinksInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = socialLinksSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const socialLinks = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v != null && v !== "")
  ) as Record<string, string>;

  await db
    .update(siteConfigs)
    .set({ socialLinks, updatedAt: new Date() })
    .where(eq(siteConfigs.businessId, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function updateSiteSeo(
  input: UpdateSeoInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = updateSeoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  await db
    .update(siteConfigs)
    .set({
      metaTitle: parsed.data.metaTitle || null,
      metaDescription: parsed.data.metaDescription || null,
      ogImageUrl: parsed.data.ogImageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(siteConfigs.businessId, businessId));

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}

export async function reorderServices(
  orderedIds: string[]
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const allServices = await db.query.services.findMany({
    where: eq(services.businessId, businessId),
    columns: { id: true },
  });
  const validIds = new Set(allServices.map((s) => s.id));

  const updates = orderedIds
    .filter((id) => validIds.has(id))
    .map((id, index) =>
      db
        .update(services)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(services.id, id))
    );

  await Promise.all(updates);

  const slug = await getBusinessSlug(businessId);
  revalidatePublicSite(slug);
  return { success: true, data: undefined };
}
