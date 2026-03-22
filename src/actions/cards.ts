"use server";

import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  businesses,
  cardTemplates,
  cardTemplateServices,
  customerCards,
  cardUsages,
} from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { canAddCardTemplate } from "@/lib/plans/gates";
import {
  cardTemplateSchema,
  assignCardSchema,
  adjustCardSessionsSchema,
} from "@/validators/card";
import { mutateCardSessions } from "@/lib/cards/ledger";
import { getCardTemplateById } from "@/lib/db/queries/cards";
import type { ActionResult } from "@/types";
import type {
  CardTemplateInput,
  AssignCardInput,
  AdjustCardSessionsInput,
} from "@/validators/card";
import type { PlanType } from "@/lib/plans/limits";

async function getBusinessPlan(businessId: string) {
  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { subscriptionPlan: true },
  });
  return (biz?.subscriptionPlan ?? "FREE") as PlanType;
}

// ─── Card Template CRUD ─────────────────────────────────────────────────────

export async function createCardTemplate(
  input: CardTemplateInput
): Promise<ActionResult<{ templateId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const parsed = cardTemplateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const plan = await getBusinessPlan(businessId);
  const [templateCount] = await db
    .select({ value: count() })
    .from(cardTemplates)
    .where(
      and(
        eq(cardTemplates.businessId, businessId),
        eq(cardTemplates.isArchived, false)
      )
    );

  const gate = canAddCardTemplate(plan, templateCount.value);
  if (!gate.allowed) {
    return { success: false, error: "Card template limit reached for your plan." };
  }

  const data = parsed.data;

  const [template] = await db
    .insert(cardTemplates)
    .values({
      businessId,
      name: data.name,
      description: data.description || null,
      sessionCount: data.sessionCount,
      price: data.price,
      expirationDays: data.expirationDays || null,
      isActive: data.isActive,
      isPurchasable: data.isPurchasable,
      restoreOnLateCancel: data.restoreOnLateCancel,
      restoreOnNoShow: data.restoreOnNoShow,
      displayOrder: data.displayOrder,
    })
    .returning({ id: cardTemplates.id });

  if (data.serviceIds.length > 0) {
    await db.insert(cardTemplateServices).values(
      data.serviceIds.map((serviceId) => ({
        cardTemplateId: template.id,
        serviceId,
      }))
    );
  }

  revalidatePath("/dashboard/packages");
  return { success: true, data: { templateId: template.id } };
}

export async function updateCardTemplate(
  templateId: string,
  input: CardTemplateInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = cardTemplateSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const existing = await db.query.cardTemplates.findFirst({
    where: and(
      eq(cardTemplates.id, templateId),
      eq(cardTemplates.businessId, businessId)
    ),
  });
  if (!existing) return { success: false, error: "Template not found" };

  const data = parsed.data;

  await db
    .update(cardTemplates)
    .set({
      name: data.name,
      description: data.description || null,
      sessionCount: data.sessionCount,
      price: data.price,
      expirationDays: data.expirationDays || null,
      isActive: data.isActive,
      isPurchasable: data.isPurchasable,
      restoreOnLateCancel: data.restoreOnLateCancel,
      restoreOnNoShow: data.restoreOnNoShow,
      displayOrder: data.displayOrder,
      updatedAt: new Date(),
    })
    .where(eq(cardTemplates.id, templateId));

  // Replace service links
  await db
    .delete(cardTemplateServices)
    .where(eq(cardTemplateServices.cardTemplateId, templateId));

  if (data.serviceIds.length > 0) {
    await db.insert(cardTemplateServices).values(
      data.serviceIds.map((serviceId) => ({
        cardTemplateId: templateId,
        serviceId,
      }))
    );
  }

  revalidatePath("/dashboard/packages");
  revalidatePath(`/dashboard/packages/${templateId}`);
  return { success: true, data: undefined };
}

export async function archiveCardTemplate(
  templateId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(cardTemplates)
    .set({ isArchived: true, isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(cardTemplates.id, templateId),
        eq(cardTemplates.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/packages");
  return { success: true, data: undefined };
}

export async function unarchiveCardTemplate(
  templateId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(cardTemplates)
    .set({ isArchived: false, updatedAt: new Date() })
    .where(
      and(
        eq(cardTemplates.id, templateId),
        eq(cardTemplates.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/packages");
  return { success: true, data: undefined };
}

export async function toggleCardTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(cardTemplates)
    .set({ isActive, updatedAt: new Date() })
    .where(
      and(
        eq(cardTemplates.id, templateId),
        eq(cardTemplates.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/packages");
  return { success: true, data: undefined };
}

// ─── Customer Card Operations ───────────────────────────────────────────────

export async function assignCustomerCard(
  input: AssignCardInput
): Promise<ActionResult<{ customerCardId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const parsed = assignCardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const template = await getCardTemplateById(parsed.data.cardTemplateId);
  if (!template || template.businessId !== businessId) {
    return { success: false, error: "Card template not found" };
  }

  const isPaid = parsed.data.paymentStatus === "PAID";
  const expiresAt = template.expirationDays
    ? new Date(Date.now() + template.expirationDays * 24 * 60 * 60 * 1000)
    : null;

  const [card] = await db
    .insert(customerCards)
    .values({
      customerId: parsed.data.customerId,
      cardTemplateId: template.id,
      businessId,
      templateSnapshotName: template.name,
      templateSnapshotDescription: template.description,
      templateSnapshotSessionCount: template.sessionCount,
      templateSnapshotPrice: template.price,
      templateSnapshotExpirationDays: template.expirationDays,
      snapshotRestoreOnLateCancel: template.restoreOnLateCancel,
      snapshotRestoreOnNoShow: template.restoreOnNoShow,
      sessionsTotal: template.sessionCount,
      sessionsUsed: 0,
      sessionsRemaining: template.sessionCount,
      status: isPaid ? "ACTIVE" : "PENDING_PAYMENT",
      paymentStatus: parsed.data.paymentStatus,
      paymentMethod: parsed.data.paymentMethod,
      paymentConfirmedAt: isPaid ? new Date() : null,
      source: "DASHBOARD",
      notes: parsed.data.notes || null,
      expiresAt,
    })
    .returning({ id: customerCards.id });

  // Log activation
  await db.insert(cardUsages).values({
    customerCardId: card.id,
    action: "ACTIVATED",
    deltaSessions: 0,
    actorType: "STAFF",
    notes: isPaid ? "Assigned and paid" : "Assigned, pending payment",
  });

  revalidatePath(`/dashboard/customers/${parsed.data.customerId}`);
  revalidatePath("/dashboard/packages");
  return { success: true, data: { customerCardId: card.id } };
}

export async function cancelCustomerCard(
  customerCardId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const card = await db.query.customerCards.findFirst({
    where: and(
      eq(customerCards.id, customerCardId),
      eq(customerCards.businessId, businessId)
    ),
  });

  if (!card) return { success: false, error: "Card not found" };
  if (["CANCELLED", "REFUNDED"].includes(card.status)) {
    return { success: false, error: "Card is already cancelled" };
  }

  await db
    .update(customerCards)
    .set({
      status: "CANCELLED",
      closedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(customerCards.id, customerCardId));

  await db.insert(cardUsages).values({
    customerCardId,
    action: "CANCELLED",
    deltaSessions: 0,
    actorType: "STAFF",
    notes: "Card cancelled by business owner",
  });

  revalidatePath("/dashboard/packages");
  return { success: true, data: undefined };
}

export async function updateCardPayment(
  customerCardId: string,
  paymentStatus: "PAID" | "PENDING"
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const card = await db.query.customerCards.findFirst({
    where: and(
      eq(customerCards.id, customerCardId),
      eq(customerCards.businessId, businessId)
    ),
  });

  if (!card) return { success: false, error: "Card not found" };

  const isPaid = paymentStatus === "PAID";
  const updates: Record<string, unknown> = {
    paymentStatus,
    updatedAt: new Date(),
  };

  if (isPaid && card.status === "PENDING_PAYMENT") {
    updates.status = "ACTIVE";
    updates.paymentConfirmedAt = new Date();

    await db.insert(cardUsages).values({
      customerCardId,
      action: "ACTIVATED",
      deltaSessions: 0,
      actorType: "STAFF",
      notes: "Payment confirmed",
    });
  }

  await db
    .update(customerCards)
    .set(updates)
    .where(eq(customerCards.id, customerCardId));

  revalidatePath("/dashboard/packages");
  return { success: true, data: undefined };
}

export async function adjustCardSessions(
  input: AdjustCardSessionsInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = adjustCardSessionsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const card = await db.query.customerCards.findFirst({
    where: and(
      eq(customerCards.id, parsed.data.customerCardId),
      eq(customerCards.businessId, businessId)
    ),
  });

  if (!card) return { success: false, error: "Card not found" };

  const result = await db.transaction(async (tx) => {
    return mutateCardSessions(tx as unknown as typeof db, {
      customerCardId: parsed.data.customerCardId,
      delta: parsed.data.delta,
      action: parsed.data.delta > 0 ? "MANUAL_ADD" : "MANUAL_DEDUCT",
      actorType: "STAFF",
      notes: parsed.data.notes,
    });
  });

  if (!result.success) {
    return { success: false, error: result.error! };
  }

  revalidatePath("/dashboard/packages");
  return { success: true, data: undefined };
}
