"use server";

import { and, eq, gte, ne, or, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  classSchedules,
  classInstances,
  appointments,
  services,
  customers,
  users,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types";

export async function searchBusinessCustomers(
  businessId: string,
  query: string
) {
  const q = query.trim();
  if (q.length < 1) return [];

  const rows = await db
    .select({
      id: customers.id,
      name: users.name,
      phone: users.phone,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(
        eq(customers.businessId, businessId),
        or(
          ilike(users.name, `%${q}%`),
          ilike(users.phone, `%${q}%`)
        )
      )
    )
    .limit(8);

  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? "",
    phone: r.phone ?? "",
  }));
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Valid #RRGGBB or null (default calendar tint). */
function normalizeCalendarColorHex(v: string | null | undefined): string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : null;
}

const SCHEDULE_FIELDS_THAT_REQUIRE_INSTANCE_REGEN = [
  "daysOfWeek",
  "startTime",
  "durationMinutes",
  "maxParticipants",
  "staffId",
  "effectiveUntil",
  "isActive",
] as const;

/**
 * Unified "Create Class" action.
 * Creates an auto-managed service behind the scenes, then creates the schedule + instances.
 */
export async function createClass(input: {
  businessId: string;
  serviceId?: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  maxParticipants: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  calendarColor?: string | null;
  price?: string | null;
  depositAmount?: string | null;
  paymentMode?: "FREE" | "FULL" | "DEPOSIT" | "ON_SITE" | "CONTACT_FOR_PRICE";
  approvalType?: "AUTO" | "MANUAL";
  cancelHoursBefore?: number | null;
  rescheduleHoursBefore?: number | null;
  slots: Array<{
    staffId: string;
    daysOfWeek: number[];
    startTime: string;
    notes?: string;
  }>;
}): Promise<ActionResult<{ scheduleIds: string[]; serviceId: string }>> {
  const {
    businessId, serviceId: existingServiceId, name, description,
    durationMinutes, maxParticipants, effectiveFrom, effectiveUntil,
    calendarColor, price, depositAmount,
    paymentMode = "FREE", approvalType = "AUTO",
    cancelHoursBefore, rescheduleHoursBefore, slots,
  } = input;

  if (!slots.length && existingServiceId) {
    return { success: false, error: "At least one time slot is required when using an existing class type" };
  }
  for (const slot of slots) {
    if (!slot.daysOfWeek.length) {
      return { success: false, error: "Each slot must have at least one day selected" };
    }
  }

  let svcId: string;

  if (existingServiceId) {
    const existing = await db.query.services.findFirst({
      where: and(
        eq(services.id, existingServiceId),
        eq(services.businessId, businessId),
        eq(services.autoManaged, true),
        eq(services.isGroup, true),
      ),
      columns: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Class type not found" };
    }
    svcId = existing.id;
  } else {
    if (!name.trim()) {
      return { success: false, error: "Class name is required" };
    }
    if (maxParticipants < 1) {
      return { success: false, error: "Max participants must be at least 1" };
    }
    if (durationMinutes < 5 || durationMinutes > 480) {
      return { success: false, error: "Duration must be 5–480 minutes" };
    }
    const [svc] = await db
      .insert(services)
      .values({
        businessId,
        title: name.trim(),
        description: description?.trim() || null,
        durationMinutes,
        isGroup: true,
        maxParticipants,
        autoManaged: true,
        paymentMode,
        approvalType,
        price: price || null,
        depositAmount: depositAmount || null,
        cancelHoursBefore: cancelHoursBefore ?? null,
        rescheduleHoursBefore: rescheduleHoursBefore ?? null,
        staffAssignmentMode: "SPECIFIC",
        isActive: true,
      })
      .returning({ id: services.id });
    svcId = svc.id;

    if (!slots.length) {
      revalidatePath("/dashboard/classes");
      return { success: true, data: { scheduleIds: [], serviceId: svcId } };
    }
  }

  const svcData = await db.query.services.findFirst({
    where: eq(services.id, svcId),
  });
  if (!svcData) {
    return { success: false, error: "Service not found" };
  }

  const { serviceStaff } = await import("@/lib/db/schema");

  const uniqueStaffIds = [...new Set(slots.map((s) => s.staffId))];
  for (const staffId of uniqueStaffIds) {
    await db
      .insert(serviceStaff)
      .values({ serviceId: svcId, staffId })
      .onConflictDoNothing();
  }

  const scheduleIds: string[] = [];

  let resolvedColor = calendarColor;
  if (resolvedColor === undefined && existingServiceId) {
    const existingSched = await db.query.classSchedules.findFirst({
      where: eq(classSchedules.serviceId, svcId),
      columns: { calendarColor: true },
    });
    resolvedColor = existingSched?.calendarColor ?? null;
  }
  const normColor = normalizeCalendarColorHex(resolvedColor ?? undefined);

  for (const slot of slots) {
    const [schedule] = await db
      .insert(classSchedules)
      .values({
        businessId,
        serviceId: svcId,
        staffId: slot.staffId,
        title: svcData.title,
        daysOfWeek: slot.daysOfWeek,
        startTime: slot.startTime,
        durationMinutes: svcData.durationMinutes,
        maxParticipants: svcData.maxParticipants ?? 10,
        effectiveFrom,
        effectiveUntil: effectiveUntil || null,
        notes: slot.notes || null,
        calendarColor: normColor,
        price: svcData.price || null,
        depositAmount: svcData.depositAmount || null,
        paymentMode: svcData.paymentMode,
        approvalType: svcData.approvalType,
        cancelHoursBefore: svcData.cancelHoursBefore ?? null,
        rescheduleHoursBefore: svcData.rescheduleHoursBefore ?? null,
      })
      .returning({ id: classSchedules.id });
    scheduleIds.push(schedule.id);
  }

  for (const schedId of scheduleIds) {
    await generateInstancesForSchedule(schedId, businessId, 4);
  }

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: { scheduleIds, serviceId: svcId } };
}

export async function createClassSchedule(input: {
  businessId: string;
  serviceId: string;
  staffId: string;
  title?: string;
  daysOfWeek: number[];
  startTime: string;
  maxParticipants: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  notes?: string;
  calendarColor?: string | null;
}): Promise<ActionResult<{ scheduleId: string }>> {
  const {
    businessId, serviceId, staffId, title,
    daysOfWeek, startTime, maxParticipants,
    effectiveFrom, effectiveUntil, notes, calendarColor,
  } = input;

  if (!daysOfWeek.length) {
    return { success: false, error: "At least one day must be selected" };
  }
  if (maxParticipants < 1) {
    return { success: false, error: "Max participants must be at least 1" };
  }

  const service = await db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, businessId)),
    columns: { id: true, durationMinutes: true },
  });
  if (!service) {
    return { success: false, error: "Service not found" };
  }

  const [schedule] = await db
    .insert(classSchedules)
    .values({
      businessId,
      serviceId,
      staffId,
      title: title || null,
      daysOfWeek,
      startTime,
      durationMinutes: service.durationMinutes,
      maxParticipants,
      effectiveFrom,
      effectiveUntil: effectiveUntil || null,
      notes: notes || null,
      calendarColor: normalizeCalendarColorHex(calendarColor ?? undefined),
    })
    .returning({ id: classSchedules.id });

  await generateInstancesForSchedule(schedule.id, businessId, 4);

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: { scheduleId: schedule.id } };
}

export async function updateClassSchedule(
  scheduleId: string,
  businessId: string,
  input: {
    title?: string;
    description?: string | null;
    staffId?: string;
    daysOfWeek?: number[];
    startTime?: string;
    durationMinutes?: number;
    maxParticipants?: number;
    effectiveUntil?: string | null;
    isActive?: boolean;
    notes?: string;
    calendarColor?: string | null;
    price?: string | null;
    depositAmount?: string | null;
    paymentMode?: "FREE" | "FULL" | "DEPOSIT" | "ON_SITE" | "CONTACT_FOR_PRICE";
    approvalType?: "AUTO" | "MANUAL";
    cancelHoursBefore?: number | null;
    rescheduleHoursBefore?: number | null;
  }
): Promise<ActionResult> {
  const schedule = await db.query.classSchedules.findFirst({
    where: and(eq(classSchedules.id, scheduleId), eq(classSchedules.businessId, businessId)),
  });
  if (!schedule) {
    return { success: false, error: "Schedule not found" };
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) updates.title = input.title || null;
  if (input.staffId !== undefined) updates.staffId = input.staffId;
  if (input.daysOfWeek !== undefined) updates.daysOfWeek = input.daysOfWeek;
  if (input.startTime !== undefined) updates.startTime = input.startTime;
  if (input.durationMinutes !== undefined) updates.durationMinutes = input.durationMinutes;
  if (input.maxParticipants !== undefined) updates.maxParticipants = input.maxParticipants;
  if (input.effectiveUntil !== undefined) updates.effectiveUntil = input.effectiveUntil;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.notes !== undefined) updates.notes = input.notes || null;
  if (input.price !== undefined) updates.price = input.price || null;
  if (input.depositAmount !== undefined) updates.depositAmount = input.depositAmount || null;
  if (input.paymentMode !== undefined) updates.paymentMode = input.paymentMode;
  if (input.approvalType !== undefined) updates.approvalType = input.approvalType;
  if (input.cancelHoursBefore !== undefined) updates.cancelHoursBefore = input.cancelHoursBefore;
  if (input.rescheduleHoursBefore !== undefined) updates.rescheduleHoursBefore = input.rescheduleHoursBefore;
  if (input.calendarColor !== undefined) {
    if (input.calendarColor === null || input.calendarColor === "") {
      updates.calendarColor = null;
    } else {
      const norm = normalizeCalendarColorHex(input.calendarColor);
      if (!norm) {
        return { success: false, error: "Invalid calendar color" };
      }
      updates.calendarColor = norm;
    }
  }

  const needsInstanceRegen = SCHEDULE_FIELDS_THAT_REQUIRE_INSTANCE_REGEN.some(
    (k) => input[k] !== undefined
  );

  await db.update(classSchedules).set(updates).where(eq(classSchedules.id, scheduleId));

  // Sync auto-managed service when relevant fields change
  if (input.staffId || input.title || input.description !== undefined || input.durationMinutes !== undefined || input.maxParticipants !== undefined || input.paymentMode || input.approvalType) {
    const svc = await db.query.services.findFirst({
      where: and(eq(services.id, schedule.serviceId), eq(services.businessId, businessId)),
      columns: { id: true, autoManaged: true },
    });
    if (svc?.autoManaged) {
      const { serviceStaff } = await import("@/lib/db/schema");
      const svcUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.title !== undefined) svcUpdates.title = input.title || null;
      if (input.description !== undefined) svcUpdates.description = input.description || null;
      if (input.durationMinutes !== undefined) svcUpdates.durationMinutes = input.durationMinutes;
      if (input.maxParticipants !== undefined) svcUpdates.maxParticipants = input.maxParticipants;
      if (input.paymentMode !== undefined) svcUpdates.paymentMode = input.paymentMode;
      if (input.approvalType !== undefined) svcUpdates.approvalType = input.approvalType;
      if (input.price !== undefined) svcUpdates.price = input.price || null;
      if (input.depositAmount !== undefined) svcUpdates.depositAmount = input.depositAmount || null;
      if (input.cancelHoursBefore !== undefined) svcUpdates.cancelHoursBefore = input.cancelHoursBefore;
      if (input.rescheduleHoursBefore !== undefined) svcUpdates.rescheduleHoursBefore = input.rescheduleHoursBefore;
      await db.update(services).set(svcUpdates).where(eq(services.id, svc.id));

      if (input.staffId && input.staffId !== schedule.staffId) {
        await db.delete(serviceStaff).where(eq(serviceStaff.serviceId, svc.id));
        await db.insert(serviceStaff).values({ serviceId: svc.id, staffId: input.staffId });
      }
    }
  }

  if (needsInstanceRegen) {
    const today = localDateStr(new Date());
    await db
      .delete(classInstances)
      .where(
        and(
          eq(classInstances.classScheduleId, scheduleId),
          gte(classInstances.date, today)
        )
      );

    const effectiveActive =
      input.isActive !== undefined ? input.isActive : schedule.isActive;
    if (effectiveActive) {
      await generateInstancesForSchedule(scheduleId, businessId, 4);
    }
  }

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function deleteClassSchedule(
  scheduleId: string,
  businessId: string
): Promise<ActionResult> {
  await db
    .update(classSchedules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(classSchedules.id, scheduleId), eq(classSchedules.businessId, businessId)));

  const today = localDateStr(new Date());
  await db
    .delete(classInstances)
    .where(
      and(
        eq(classInstances.classScheduleId, scheduleId),
        gte(classInstances.date, today)
      )
    );

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function permanentDeleteClassSchedule(
  scheduleId: string,
  businessId: string
): Promise<ActionResult> {
  const schedule = await db.query.classSchedules.findFirst({
    where: and(eq(classSchedules.id, scheduleId), eq(classSchedules.businessId, businessId)),
    columns: { id: true, serviceId: true },
  });
  if (!schedule) {
    return { success: false, error: "Schedule not found" };
  }

  await db.delete(classInstances).where(eq(classInstances.classScheduleId, scheduleId));
  await db.delete(classSchedules).where(eq(classSchedules.id, scheduleId));

  const remaining = await db.select({ id: classSchedules.id })
    .from(classSchedules)
    .where(eq(classSchedules.serviceId, schedule.serviceId))
    .limit(1);

  if (remaining.length === 0) {
    const svc = await db.query.services.findFirst({
      where: and(eq(services.id, schedule.serviceId), eq(services.autoManaged, true)),
      columns: { id: true },
    });
    if (svc) {
      const { serviceStaff } = await import("@/lib/db/schema");
      await db.delete(serviceStaff).where(eq(serviceStaff.serviceId, svc.id));
      await db.delete(services).where(eq(services.id, svc.id));
    }
  }

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function deleteClassType(
  serviceId: string,
  businessId: string
): Promise<ActionResult> {
  const svc = await db.query.services.findFirst({
    where: and(
      eq(services.id, serviceId),
      eq(services.businessId, businessId),
      eq(services.autoManaged, true),
      eq(services.isGroup, true),
    ),
    columns: { id: true },
  });
  if (!svc) return { success: false, error: "Class type not found" };

  const hasSchedules = await db.select({ id: classSchedules.id })
    .from(classSchedules)
    .where(eq(classSchedules.serviceId, serviceId))
    .limit(1);
  if (hasSchedules.length > 0) {
    return { success: false, error: "Cannot delete a class type that has scheduled classes" };
  }

  const { serviceStaff } = await import("@/lib/db/schema");
  await db.delete(serviceStaff).where(eq(serviceStaff.serviceId, serviceId));
  await db.delete(services).where(eq(services.id, serviceId));

  revalidatePath("/dashboard/classes");
  return { success: true, data: undefined };
}

export async function updateClassInstanceTime(
  instanceId: string,
  businessId: string,
  newStartTime: string,
  newEndTime: string
): Promise<ActionResult> {
  const instance = await db.query.classInstances.findFirst({
    where: and(eq(classInstances.id, instanceId), eq(classInstances.businessId, businessId)),
  });
  if (!instance) return { success: false, error: "Instance not found" };

  const startDate = new Date(newStartTime);
  const endDate = new Date(newEndTime);
  const dateStr = localDateStr(startDate);

  await db
    .update(classInstances)
    .set({ startTime: startDate, endTime: endDate, date: dateStr })
    .where(eq(classInstances.id, instanceId));

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function updateAllFutureInstancesTime(
  scheduleId: string,
  businessId: string,
  newStartHour: string,
  newEndHour: string
): Promise<ActionResult> {
  const today = localDateStr(new Date());

  const futureInstances = await db
    .select()
    .from(classInstances)
    .where(
      and(
        eq(classInstances.classScheduleId, scheduleId),
        eq(classInstances.businessId, businessId),
        gte(classInstances.date, today),
        eq(classInstances.status, "SCHEDULED")
      )
    );

  const [sh, sm] = newStartHour.split(":").map(Number);
  const [eh, em] = newEndHour.split(":").map(Number);

  for (const inst of futureInstances) {
    const newStart = new Date(inst.startTime);
    newStart.setHours(sh, sm, 0, 0);
    const newEnd = new Date(inst.startTime);
    newEnd.setHours(eh, em, 0, 0);

    await db
      .update(classInstances)
      .set({ startTime: newStart, endTime: newEnd })
      .where(eq(classInstances.id, inst.id));
  }

  await db
    .update(classSchedules)
    .set({ startTime: newStartHour, updatedAt: new Date() })
    .where(eq(classSchedules.id, scheduleId));

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function getClassInstanceParticipants(
  instanceId: string,
  businessId: string
) {
  const rows = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(
        eq(appointments.classInstanceId, instanceId),
        eq(appointments.businessId, businessId),
        ne(appointments.status, "CANCELLED")
      )
    );
  return rows;
}

export async function cancelParticipantBooking(
  appointmentId: string,
  instanceId: string,
  businessId: string
): Promise<ActionResult> {
  const appointment = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, appointmentId),
      eq(appointments.classInstanceId, instanceId),
      eq(appointments.businessId, businessId),
      ne(appointments.status, "CANCELLED")
    ),
  });
  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  await db
    .update(appointments)
    .set({ status: "CANCELLED" })
    .where(eq(appointments.id, appointmentId));

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function cancelClassInstance(
  instanceId: string,
  businessId: string
): Promise<ActionResult> {
  await db
    .update(classInstances)
    .set({ status: "CANCELLED" })
    .where(
      and(eq(classInstances.id, instanceId), eq(classInstances.businessId, businessId))
    );

  await db
    .update(appointments)
    .set({ status: "CANCELLED" })
    .where(
      and(
        eq(appointments.classInstanceId, instanceId),
        ne(appointments.status, "CANCELLED")
      )
    );

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function cancelAllFutureInstances(
  scheduleId: string,
  businessId: string
): Promise<ActionResult> {
  const today = localDateStr(new Date());

  const futureInstances = await db
    .select({ id: classInstances.id })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.classScheduleId, scheduleId),
        eq(classInstances.businessId, businessId),
        gte(classInstances.date, today),
        eq(classInstances.status, "SCHEDULED")
      )
    );

  for (const inst of futureInstances) {
    await db
      .update(classInstances)
      .set({ status: "CANCELLED" })
      .where(eq(classInstances.id, inst.id));

    await db
      .update(appointments)
      .set({ status: "CANCELLED" })
      .where(
        and(
          eq(appointments.classInstanceId, inst.id),
          ne(appointments.status, "CANCELLED")
        )
      );
  }

  await db
    .update(classSchedules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(eq(classSchedules.id, scheduleId), eq(classSchedules.businessId, businessId))
    );

  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/calendar");

  return { success: true, data: undefined };
}

export async function generateInstancesForSchedule(
  scheduleId: string,
  businessId: string,
  weeksAhead: number
) {
  const schedule = await db.query.classSchedules.findFirst({
    where: and(eq(classSchedules.id, scheduleId), eq(classSchedules.businessId, businessId)),
  });
  if (!schedule || !schedule.isActive) return;

  const durationMin = schedule.durationMinutes;

  const now = new Date();
  const today = localDateStr(now);
  const startDate = schedule.effectiveFrom > today ? schedule.effectiveFrom : today;

  const endLimit = new Date(now);
  endLimit.setDate(endLimit.getDate() + weeksAhead * 7);
  const endDateStr = schedule.effectiveUntil && schedule.effectiveUntil < localDateStr(endLimit)
    ? schedule.effectiveUntil
    : localDateStr(endLimit);

  const existing = await db
    .select({ date: classInstances.date })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.classScheduleId, scheduleId),
        gte(classInstances.date, startDate)
      )
    );
  const existingDates = new Set(existing.map((e) => e.date));

  const daysOfWeek = schedule.daysOfWeek as number[];
  const [hours, minutes] = schedule.startTime.split(":").map(Number);

  const cursor = new Date(startDate + "T00:00:00");
  const endDate = new Date(endDateStr + "T23:59:59");

  const toInsert: Array<{
    classScheduleId: string;
    businessId: string;
    serviceId: string;
    staffId: string;
    date: string;
    startTime: Date;
    endTime: Date;
    maxParticipants: number;
  }> = [];

  while (cursor <= endDate) {
    const dayOfWeek = cursor.getDay();
    const dateStr = localDateStr(cursor);

    if (daysOfWeek.includes(dayOfWeek) && !existingDates.has(dateStr)) {
      const start = new Date(cursor);
      start.setHours(hours, minutes, 0, 0);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);

      if (start.getTime() > now.getTime()) {
        toInsert.push({
          classScheduleId: scheduleId,
          businessId,
          serviceId: schedule.serviceId,
          staffId: schedule.staffId,
          date: dateStr,
          startTime: start,
          endTime: end,
          maxParticipants: schedule.maxParticipants,
        });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (toInsert.length > 0) {
    await db.insert(classInstances).values(toInsert);
  }
}

export async function generateAllClassInstances(businessId: string) {
  const schedules = await db
    .select({ id: classSchedules.id })
    .from(classSchedules)
    .where(and(eq(classSchedules.businessId, businessId), eq(classSchedules.isActive, true)));

  for (const s of schedules) {
    await generateInstancesForSchedule(s.id, businessId, 4);
  }
}
