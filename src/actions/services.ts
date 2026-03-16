"use server";

import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  businesses,
  services,
  serviceCategories,
  servicePackages,
  serviceStaff,
} from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { canAddService, canAddPackage } from "@/lib/plans/gates";
import {
  serviceSchema,
  serviceCategorySchema,
  servicePackageSchema,
} from "@/validators/service";
import type { ActionResult } from "@/types";
import type { ServiceInput, ServiceCategoryInput, ServicePackageInput } from "@/validators/service";
import type { PlanType } from "@/lib/plans/limits";

async function getBusinessPlan(businessId: string) {
  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { subscriptionPlan: true },
  });
  return (biz?.subscriptionPlan ?? "FREE") as PlanType;
}

export async function createServiceCategory(
  input: ServiceCategoryInput
): Promise<ActionResult<{ categoryId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const parsed = serviceCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [cat] = await db
    .insert(serviceCategories)
    .values({ businessId, name: parsed.data.name })
    .returning({ id: serviceCategories.id });

  revalidatePath("/dashboard/services");
  return { success: true, data: { categoryId: cat.id } };
}

export async function deleteServiceCategory(
  categoryId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .delete(serviceCategories)
    .where(
      and(
        eq(serviceCategories.id, categoryId),
        eq(serviceCategories.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}

export async function createService(
  input: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const plan = await getBusinessPlan(businessId);
  const [svcCount] = await db
    .select({ value: count() })
    .from(services)
    .where(eq(services.businessId, businessId));

  const gate = canAddService(plan, svcCount.value);
  if (!gate.allowed) {
    return { success: false, error: "Service limit reached for your plan." };
  }

  const data = parsed.data;

  const [svc] = await db
    .insert(services)
    .values({
      businessId,
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || null,
      durationMinutes: data.durationMinutes,
      bufferMinutes: data.bufferMinutes ?? null,
      price: data.price || null,
      depositAmount: data.depositAmount || null,
      paymentMode: data.paymentMode,
      approvalType: data.approvalType,
      staffAssignmentMode: data.staffAssignmentMode,
      imageUrl: data.imageUrl || null,
      meetingLink: data.meetingLink || null,
      cancelHoursBefore: data.cancelHoursBefore ?? null,
      rescheduleHoursBefore: data.rescheduleHoursBefore ?? null,
      isActive: data.isActive,
    })
    .returning({ id: services.id });

  revalidatePath("/dashboard/services");
  return { success: true, data: { serviceId: svc.id } };
}

export async function updateService(
  serviceId: string,
  input: ServiceInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const data = parsed.data;

  await db
    .update(services)
    .set({
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId || null,
      durationMinutes: data.durationMinutes,
      bufferMinutes: data.bufferMinutes ?? null,
      price: data.price || null,
      depositAmount: data.depositAmount || null,
      paymentMode: data.paymentMode,
      approvalType: data.approvalType,
      staffAssignmentMode: data.staffAssignmentMode,
      imageUrl: data.imageUrl || null,
      meetingLink: data.meetingLink || null,
      cancelHoursBefore: data.cancelHoursBefore ?? null,
      rescheduleHoursBefore: data.rescheduleHoursBefore ?? null,
      isActive: data.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}

export async function deleteService(
  serviceId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .delete(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)));

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}

export async function createServicePackage(
  input: ServicePackageInput
): Promise<ActionResult<{ packageId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const parsed = servicePackageSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const plan = await getBusinessPlan(businessId);
  const [pkgCount] = await db
    .select({ value: count() })
    .from(servicePackages)
    .where(eq(servicePackages.businessId, businessId));

  const gate = canAddPackage(plan, pkgCount.value);
  if (!gate.allowed) {
    return { success: false, error: "Package limit reached for your plan." };
  }

  const data = parsed.data;

  const [pkg] = await db
    .insert(servicePackages)
    .values({
      businessId,
      serviceId: data.serviceId,
      name: data.name,
      sessionCount: data.sessionCount,
      price: data.price,
      expirationDays: data.expirationDays ?? null,
      isActive: data.isActive,
    })
    .returning({ id: servicePackages.id });

  revalidatePath("/dashboard/services");
  return { success: true, data: { packageId: pkg.id } };
}

export async function deleteServicePackage(
  packageId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .delete(servicePackages)
    .where(
      and(
        eq(servicePackages.id, packageId),
        eq(servicePackages.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}

export async function updateServiceStaff(
  serviceId: string,
  staffIds: string[]
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const svc = await db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, businessId)),
    columns: { id: true },
  });
  if (!svc) return { success: false, error: "Service not found" };

  await db.delete(serviceStaff).where(eq(serviceStaff.serviceId, serviceId));

  if (staffIds.length > 0) {
    await db.insert(serviceStaff).values(
      staffIds.map((staffId) => ({ serviceId, staffId }))
    );
  }

  revalidatePath("/dashboard/services");
  return { success: true, data: undefined };
}
