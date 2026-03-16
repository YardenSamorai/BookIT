"use server";

import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { businesses, staffMembers, staffSchedules, staffTimeOff, staffBlockedSlots } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { canAddStaff } from "@/lib/plans/gates";
import { staffMemberSchema, staffScheduleSchema, staffTimeOffSchema } from "@/validators/staff";
import type { ActionResult } from "@/types";
import type { StaffMemberInput, StaffScheduleInput, StaffTimeOffInput } from "@/validators/staff";
import type { PlanType } from "@/lib/plans/limits";

export async function createStaffMember(
  input: StaffMemberInput
): Promise<ActionResult<{ staffId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const parsed = staffMemberSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { subscriptionPlan: true },
  });

  const [staffCount] = await db
    .select({ value: count() })
    .from(staffMembers)
    .where(eq(staffMembers.businessId, businessId));

  const gate = canAddStaff(
    (business?.subscriptionPlan ?? "FREE") as PlanType,
    staffCount.value
  );
  if (!gate.allowed) {
    return { success: false, error: "Staff limit reached for your plan. Upgrade to add more." };
  }

  const [member] = await db
    .insert(staffMembers)
    .values({
      businessId,
      name: parsed.data.name,
      roleTitle: parsed.data.roleTitle || null,
      bio: parsed.data.bio || null,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
    })
    .returning({ id: staffMembers.id });

  const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
    staffId: member.id,
    dayOfWeek: i,
    startTime: "09:00",
    endTime: "18:00",
    isActive: i >= 0 && i <= 4,
  }));

  await db.insert(staffSchedules).values(defaultSchedule);

  revalidatePath("/dashboard/staff");
  return { success: true, data: { staffId: member.id } };
}

export async function updateStaffMember(
  staffId: string,
  input: StaffMemberInput
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  const parsed = staffMemberSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  await db
    .update(staffMembers)
    .set({
      name: parsed.data.name,
      roleTitle: parsed.data.roleTitle || null,
      bio: parsed.data.bio || null,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(staffMembers.id, staffId), eq(staffMembers.businessId, businessId)));

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}

export async function deleteStaffMember(
  staffId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  try {
    await db
      .delete(staffMembers)
      .where(and(eq(staffMembers.id, staffId), eq(staffMembers.businessId, businessId)));
  } catch {
    // FK constraint - staff has appointments; deactivate instead
    await db
      .update(staffMembers)
      .set({ isActive: false })
      .where(and(eq(staffMembers.id, staffId), eq(staffMembers.businessId, businessId)));
  }

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}

export async function updateStaffSchedule(
  staffId: string,
  input: StaffScheduleInput
): Promise<ActionResult> {
  await requireBusinessOwner();

  const parsed = staffScheduleSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message };
  }

  await Promise.all(
    parsed.data.map((entry) =>
      db
        .update(staffSchedules)
        .set({
          startTime: entry.startTime,
          endTime: entry.endTime,
          isActive: entry.isActive,
        })
        .where(
          and(
            eq(staffSchedules.staffId, staffId),
            eq(staffSchedules.dayOfWeek, entry.dayOfWeek)
          )
        )
    )
  );

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}

export async function createStaffTimeOff(
  staffId: string,
  input: StaffTimeOffInput
): Promise<ActionResult> {
  await requireBusinessOwner();

  const parsed = staffTimeOffSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message };
  }

  await db.insert(staffTimeOff).values({
    staffId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    reason: parsed.data.reason || null,
  });

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}

export async function deleteStaffTimeOff(
  timeOffId: string
): Promise<ActionResult> {
  await requireBusinessOwner();

  await db.delete(staffTimeOff).where(eq(staffTimeOff.id, timeOffId));

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}

export async function createStaffBlockedSlot(
  staffId: string,
  input: { startTime: string; endTime: string; reason?: string }
): Promise<ActionResult> {
  await requireBusinessOwner();

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);

  if (end <= start) {
    return { success: false, error: "End time must be after start time" };
  }

  await db.insert(staffBlockedSlots).values({
    staffId,
    startTime: start,
    endTime: end,
    reason: input.reason || null,
  });

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}

export async function deleteStaffBlockedSlot(
  slotId: string
): Promise<ActionResult> {
  await requireBusinessOwner();

  await db.delete(staffBlockedSlots).where(eq(staffBlockedSlots.id, slotId));

  revalidatePath("/dashboard/staff");
  return { success: true, data: undefined };
}
