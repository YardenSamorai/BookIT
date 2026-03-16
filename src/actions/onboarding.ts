"use server";

import { db } from "@/lib/db";
import { businesses, businessHours, services, siteConfigs } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { onboardingStep1Schema, onboardingStep2Schema } from "@/validators/onboarding";
import { getTemplate } from "@/lib/templates";
import { generateSlug, makeUniqueSlug } from "@/lib/utils/slug";
import { isSlugAvailable } from "@/lib/db/queries/business";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/types";
import type { OnboardingStep1Input, OnboardingStep2Input } from "@/validators/onboarding";

export async function createBusiness(
  input: OnboardingStep1Input
): Promise<ActionResult<{ businessId: string; slug: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = onboardingStep1Schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const { businessName, businessType } = parsed.data;

  let slug = generateSlug(businessName);
  if (!slug) slug = "my-business";

  const available = await isSlugAvailable(slug);
  if (!available) {
    slug = makeUniqueSlug(slug, nanoid(6));
  }

  const template = getTemplate(businessType);

  const [business] = await db
    .insert(businesses)
    .values({
      ownerId: session.user.id,
      name: businessName,
      slug,
      type: businessType,
    })
    .returning({ id: businesses.id, slug: businesses.slug });

  await Promise.all([
    db.insert(businessHours).values(
      template.hours.map((h) => ({
        businessId: business.id,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        isOpen: h.isOpen,
      }))
    ),

    db.insert(services).values(
      template.services.map((s, i) => ({
        businessId: business.id,
        title: s.title,
        description: s.description,
        durationMinutes: s.durationMinutes,
        price: s.price,
        paymentMode: s.paymentMode,
        sortOrder: i,
      }))
    ),

    db.insert(siteConfigs).values({
      businessId: business.id,
      sections: template.sections,
      themePreset: "default",
    }),
  ]);

  return { success: true, data: { businessId: business.id, slug: business.slug } };
}

export async function updateBusinessBrand(
  businessId: string,
  input: OnboardingStep2Input
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = onboardingStep2Schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const { primaryColor, secondaryColor, logoUrl, coverImageUrl } = parsed.data;

  await db
    .update(businesses)
    .set({
      primaryColor,
      secondaryColor,
      logoUrl: logoUrl || null,
      coverImageUrl: coverImageUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return { success: true, data: undefined };
}

export async function publishBusiness(
  businessId: string
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  await db
    .update(businesses)
    .set({
      published: true,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return { success: true, data: undefined };
}
