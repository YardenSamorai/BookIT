"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import type { ActionResult } from "@/types";

export async function updateNotificationPreferences(input: {
  whatsappEnabled: boolean;
  smsBookingEnabled: boolean;
  reminderHoursBefore: number;
  reminderHoursBefore2: number | null;
}): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const existing = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.businessId, businessId),
    columns: { id: true },
  });

  const values = {
    whatsappEnabled: input.whatsappEnabled,
    smsBookingEnabled: input.smsBookingEnabled,
    reminderHoursBefore: input.reminderHoursBefore,
    reminderHoursBefore2: input.reminderHoursBefore2 && input.reminderHoursBefore2 > 0
      ? input.reminderHoursBefore2
      : null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(notificationPreferences)
      .set(values)
      .where(eq(notificationPreferences.id, existing.id));
  } else {
    await db.insert(notificationPreferences).values({
      businessId,
      ...values,
    });
  }

  revalidatePath("/dashboard/messages");
  return { success: true, data: undefined };
}
