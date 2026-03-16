"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessHours } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { businessInfoSchema, businessHoursSchema } from "@/validators/business";
import type { ActionResult } from "@/types";
import type { BusinessInfoInput, BusinessHoursInput } from "@/validators/business";

export async function updateBusinessInfo(
  input: BusinessInfoInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = businessInfoSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  await db
    .update(businesses)
    .set({
      name: parsed.data.name,
      type: parsed.data.type,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
      slotGranularityMin: parsed.data.slotGranularityMin,
      defaultBufferMin: parsed.data.defaultBufferMin,
      ...(parsed.data.language ? { language: parsed.data.language } : {}),
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return { success: true, data: undefined };
}

export async function updateBusinessHours(
  input: BusinessHoursInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = businessHoursSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message };
  }

  await Promise.all(
    parsed.data.map((entry) =>
      db
        .update(businessHours)
        .set({
          startTime: entry.startTime,
          endTime: entry.endTime,
          isOpen: entry.isOpen,
        })
        .where(
          and(
            eq(businessHours.businessId, businessId),
            eq(businessHours.dayOfWeek, entry.dayOfWeek)
          )
        )
    )
  );

  return { success: true, data: undefined };
}
