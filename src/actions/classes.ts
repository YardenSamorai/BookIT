"use server";

import { and, eq, gte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  classSchedules,
  classInstances,
  appointments,
  services,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types";

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
}): Promise<ActionResult<{ scheduleId: string }>> {
  const {
    businessId, serviceId, staffId, title,
    daysOfWeek, startTime, maxParticipants,
    effectiveFrom, effectiveUntil, notes,
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
      maxParticipants,
      effectiveFrom,
      effectiveUntil: effectiveUntil || null,
      notes: notes || null,
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
    daysOfWeek?: number[];
    startTime?: string;
    maxParticipants?: number;
    effectiveUntil?: string | null;
    isActive?: boolean;
    notes?: string;
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
  if (input.daysOfWeek !== undefined) updates.daysOfWeek = input.daysOfWeek;
  if (input.startTime !== undefined) updates.startTime = input.startTime;
  if (input.maxParticipants !== undefined) updates.maxParticipants = input.maxParticipants;
  if (input.effectiveUntil !== undefined) updates.effectiveUntil = input.effectiveUntil;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.notes !== undefined) updates.notes = input.notes || null;

  await db.update(classSchedules).set(updates).where(eq(classSchedules.id, scheduleId));

  const today = localDateStr(new Date());
  await db
    .delete(classInstances)
    .where(
      and(
        eq(classInstances.classScheduleId, scheduleId),
        gte(classInstances.date, today)
      )
    );

  if (input.isActive !== false && schedule.isActive) {
    await generateInstancesForSchedule(scheduleId, businessId, 4);
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

export async function generateInstancesForSchedule(
  scheduleId: string,
  businessId: string,
  weeksAhead: number
) {
  const schedule = await db.query.classSchedules.findFirst({
    where: and(eq(classSchedules.id, scheduleId), eq(classSchedules.businessId, businessId)),
  });
  if (!schedule || !schedule.isActive) return;

  const service = await db.query.services.findFirst({
    where: eq(services.id, schedule.serviceId),
    columns: { durationMinutes: true },
  });
  if (!service) return;

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
      const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

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
