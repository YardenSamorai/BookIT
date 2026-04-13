"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { intakeForms, services } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import type { ActionResult } from "@/types";

export interface IntakeFormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "consent";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface IntakeFormInput {
  title: string;
  description?: string;
  fields: IntakeFormField[];
}

export async function createIntakeForm(
  data: IntakeFormInput
): Promise<ActionResult<{ id: string }>> {
  const { businessId } = await requireBusinessOwner();

  const [form] = await db
    .insert(intakeForms)
    .values({
      businessId,
      title: data.title,
      description: data.description || null,
      fields: data.fields,
    })
    .returning({ id: intakeForms.id });

  revalidatePath("/dashboard/intake-forms");
  return { success: true, data: { id: form.id } };
}

export async function updateIntakeForm(
  formId: string,
  data: IntakeFormInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(intakeForms)
    .set({
      title: data.title,
      description: data.description || null,
      fields: data.fields,
      updatedAt: new Date(),
    })
    .where(
      and(eq(intakeForms.id, formId), eq(intakeForms.businessId, businessId))
    );

  revalidatePath("/dashboard/intake-forms");
  return { success: true, data: undefined };
}

export async function deleteIntakeForm(
  formId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(services)
    .set({ intakeFormId: null })
    .where(
      and(
        eq(services.intakeFormId, formId),
        eq(services.businessId, businessId)
      )
    );

  await db
    .delete(intakeForms)
    .where(
      and(eq(intakeForms.id, formId), eq(intakeForms.businessId, businessId))
    );

  revalidatePath("/dashboard/intake-forms");
  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}

export async function toggleIntakeFormActive(
  formId: string,
  isActive: boolean
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(intakeForms)
    .set({ isActive, updatedAt: new Date() })
    .where(
      and(eq(intakeForms.id, formId), eq(intakeForms.businessId, businessId))
    );

  revalidatePath("/dashboard/intake-forms");
  return { success: true, data: undefined };
}
