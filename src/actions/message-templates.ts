"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { messageTemplates } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getDefaultTemplateBody } from "@/lib/notifications/templates";
import type { ActionResult } from "@/types";

export async function updateMessageTemplate(
  templateId: string,
  body: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const tmpl = await db.query.messageTemplates.findFirst({
    where: and(
      eq(messageTemplates.id, templateId),
      eq(messageTemplates.businessId, businessId)
    ),
  });

  if (!tmpl) {
    return { success: false, error: "Template not found" };
  }

  await db
    .update(messageTemplates)
    .set({ body, updatedAt: new Date() })
    .where(eq(messageTemplates.id, templateId));

  revalidatePath("/dashboard/messages");
  return { success: true, data: undefined };
}

export async function resetMessageTemplate(
  templateId: string,
  locale: "en" | "he" = "he"
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const tmpl = await db.query.messageTemplates.findFirst({
    where: and(
      eq(messageTemplates.id, templateId),
      eq(messageTemplates.businessId, businessId)
    ),
  });

  if (!tmpl) {
    return { success: false, error: "Template not found" };
  }

  const defaultBody = getDefaultTemplateBody(
    tmpl.type as "BOOKING_CONFIRMED" | "REMINDER" | "CANCELLATION" | "RESCHEDULE",
    tmpl.channel as "WHATSAPP" | "SMS",
    locale
  );

  if (!defaultBody) {
    return { success: false, error: "No default template found" };
  }

  await db
    .update(messageTemplates)
    .set({ body: defaultBody, updatedAt: new Date() })
    .where(eq(messageTemplates.id, templateId));

  revalidatePath("/dashboard/messages");
  return { success: true, data: undefined };
}

export async function toggleMessageTemplate(
  templateId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const tmpl = await db.query.messageTemplates.findFirst({
    where: and(
      eq(messageTemplates.id, templateId),
      eq(messageTemplates.businessId, businessId)
    ),
  });

  if (!tmpl) {
    return { success: false, error: "Template not found" };
  }

  await db
    .update(messageTemplates)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(messageTemplates.id, templateId));

  revalidatePath("/dashboard/messages");
  return { success: true, data: undefined };
}
