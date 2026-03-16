import { and, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  businessHours,
  staffMembers,
  staffSchedules,
  staffTimeOff,
  staffBlockedSlots,
  services,
  serviceStaff,
  appointments,
} from "@/lib/db/schema";
import type { TimeSlot, StaffAvailability, DayAvailability } from "./types";

/**
 * Computes available time slots for a given service across one or more days.
 *
 * For group services: a slot remains available until maxParticipants bookings exist.
 * Each slot includes bookedCount and maxParticipants so the UI can show "X/Y spots".
 */
export async function getAvailability(opts: {
  businessId: string;
  serviceId: string;
  staffId?: string;
  dateFrom: string;
  dateTo: string;
}): Promise<DayAvailability[]> {
  const { businessId, serviceId, staffId, dateFrom, dateTo } = opts;

  const [service, business, bizHours, staffList, staffScheduleRows] =
    await Promise.all([
      db.query.services.findFirst({ where: eq(services.id, serviceId) }),
      db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { slotGranularityMin: true, defaultBufferMin: true, timezone: true },
      }),
      db.query.businessHours.findMany({ where: eq(businessHours.businessId, businessId) }),
      getEligibleStaff(businessId, serviceId, staffId),
      db.query.staffSchedules.findMany({
        where: staffId ? eq(staffSchedules.staffId, staffId) : undefined,
      }),
    ]);

  if (!service || !business) return [];

  const durationMin = service.durationMinutes;
  const bufferMin = service.bufferMinutes ?? business.defaultBufferMin;
  const granularity = business.slotGranularityMin;
  const isGroup = service.isGroup;
  const maxParticipants = service.maxParticipants ?? 1;
  const blocksAllStaff = service.blocksAllStaff;

  const startDate = new Date(dateFrom + "T00:00:00");
  const endDate = new Date(dateTo + "T23:59:59");

  const staffIds = staffList.map((s) => s.id);
  if (staffIds.length === 0) return [];

  const [timeOffRows, blockedRows, appointmentRows, allBlockingServiceIds] = await Promise.all([
    db.query.staffTimeOff.findMany({
      where: and(
        ...(staffIds.length === 1
          ? [eq(staffTimeOff.staffId, staffIds[0])]
          : []),
        lte(staffTimeOff.startDate, dateTo),
        gte(staffTimeOff.endDate, dateFrom)
      ),
    }),
    db.query.staffBlockedSlots.findMany({
      where: and(
        ...(staffIds.length === 1
          ? [eq(staffBlockedSlots.staffId, staffIds[0])]
          : []),
        lte(staffBlockedSlots.startTime, endDate),
        gte(staffBlockedSlots.endTime, startDate)
      ),
    }),
    db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.startTime, startDate),
          lte(appointments.endTime, endDate),
          ne(appointments.status, "CANCELLED")
        )
      ),
    db.query.services.findMany({
      where: and(
        eq(services.businessId, businessId),
        eq(services.blocksAllStaff, true)
      ),
      columns: { id: true },
    }),
  ]);

  const blockingServiceIdSet = new Set(allBlockingServiceIds.map((s) => s.id));
  const globalBlocks = appointmentRows
    .filter((a) => blockingServiceIdSet.has(a.serviceId))
    .map((a) => ({
      start: new Date(a.startTime),
      end: addMinutes(new Date(a.endTime), bufferMin),
    }));

  const days: DayAvailability[] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dayOfWeek = cursor.getDay();

    const staffAvailability: StaffAvailability[] = [];

    for (const staff of staffList) {
      const schedule = staffScheduleRows.find(
        (s) => s.staffId === staff.id && s.dayOfWeek === dayOfWeek
      );
      const bizHour = bizHours.find((h) => h.dayOfWeek === dayOfWeek);

      const workStart = schedule?.isActive
        ? schedule.startTime
        : bizHour?.isOpen
          ? bizHour.startTime
          : null;
      const workEnd = schedule?.isActive
        ? schedule.endTime
        : bizHour?.isOpen
          ? bizHour.endTime
          : null;

      if (!workStart || !workEnd) continue;

      const isOnTimeOff = timeOffRows.some(
        (to) =>
          to.staffId === staff.id &&
          dateStr >= to.startDate &&
          dateStr <= to.endDate
      );
      if (isOnTimeOff) continue;

      const dayStart = parseTimeToDate(dateStr, workStart);
      const dayEnd = parseTimeToDate(dateStr, workEnd);

      const blocked = blockedRows
        .filter((b) => b.staffId === staff.id)
        .map((b) => ({ start: new Date(b.startTime), end: new Date(b.endTime) }));

      const staffAppointments = appointmentRows.filter(
        (a) => a.staffId === staff.id
      );

      // "blocksAllStaff" appointments from OTHER staff also block this staff
      const crossStaffBlocks = globalBlocks.filter((gb) => {
        return !staffAppointments.some(
          (a) => new Date(a.startTime).getTime() === gb.start.getTime() && blockingServiceIdSet.has(a.serviceId)
        );
      });

      let slots: TimeSlot[];

      if (isGroup) {
        const serviceAppointments = staffAppointments.filter(
          (a) => a.serviceId === serviceId
        );
        slots = generateGroupSlots(
          dayStart,
          dayEnd,
          durationMin,
          granularity,
          [...blocked, ...crossStaffBlocks],
          staffAppointments,
          serviceAppointments,
          bufferMin,
          maxParticipants
        );
      } else {
        const booked = staffAppointments.map((a) => ({
          start: new Date(a.startTime),
          end: addMinutes(new Date(a.endTime), bufferMin),
        }));

        const unavailable = [...blocked, ...booked, ...crossStaffBlocks].sort(
          (a, b) => a.start.getTime() - b.start.getTime()
        );

        slots = generateSlots(dayStart, dayEnd, durationMin, granularity, unavailable);
      }

      const now = new Date();
      const futureSlots = slots.filter((s) => s.start > now);

      if (futureSlots.length > 0) {
        staffAvailability.push({
          staffId: staff.id,
          staffName: staff.name,
          slots: futureSlots,
        });
      }
    }

    if (staffAvailability.length > 0) {
      days.push({ date: dateStr, staffAvailability });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

async function getEligibleStaff(
  businessId: string,
  serviceId: string,
  specificStaffId?: string
) {
  if (specificStaffId) {
    const staff = await db.query.staffMembers.findFirst({
      where: and(
        eq(staffMembers.id, specificStaffId),
        eq(staffMembers.businessId, businessId),
        eq(staffMembers.isActive, true)
      ),
      columns: { id: true, name: true },
    });
    return staff ? [staff] : [];
  }

  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
    columns: { staffAssignmentMode: true },
  });

  if (!service) return [];

  if (service.staffAssignmentMode === "ANY") {
    return db.query.staffMembers.findMany({
      where: and(
        eq(staffMembers.businessId, businessId),
        eq(staffMembers.isActive, true)
      ),
      columns: { id: true, name: true },
    });
  }

  const linked = await db
    .select({ staffId: serviceStaff.staffId })
    .from(serviceStaff)
    .where(eq(serviceStaff.serviceId, serviceId));

  if (linked.length === 0) {
    return db.query.staffMembers.findMany({
      where: and(
        eq(staffMembers.businessId, businessId),
        eq(staffMembers.isActive, true)
      ),
      columns: { id: true, name: true },
    });
  }

  const linkedIds = linked.map((l) => l.staffId);
  const allStaff = await db.query.staffMembers.findMany({
    where: and(
      eq(staffMembers.businessId, businessId),
      eq(staffMembers.isActive, true)
    ),
    columns: { id: true, name: true },
  });

  return allStaff.filter((s) => linkedIds.includes(s.id));
}

/**
 * For individual (non-group) services: a slot is unavailable if any appointment overlaps.
 */
function generateSlots(
  dayStart: Date,
  dayEnd: Date,
  durationMin: number,
  granularity: number,
  unavailable: TimeSlot[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const stepMs = granularity * 60 * 1000;
  const durationMs = durationMin * 60 * 1000;
  let cursor = dayStart.getTime();
  const endMs = dayEnd.getTime();

  while (cursor + durationMs <= endMs) {
    const slotStart = cursor;
    const slotEnd = cursor + durationMs;

    const hasConflict = unavailable.some(
      (u) => slotStart < u.end.getTime() && slotEnd > u.start.getTime()
    );

    if (!hasConflict) {
      slots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
    }

    cursor += stepMs;
  }

  return slots;
}

/**
 * For group services: a slot is available as long as bookings < maxParticipants.
 * Non-group appointments for this staff still block slots entirely.
 * Returns bookedCount and maxParticipants on each slot for UI display.
 */
function generateGroupSlots(
  dayStart: Date,
  dayEnd: Date,
  durationMin: number,
  granularity: number,
  blocked: TimeSlot[],
  allStaffAppointments: { startTime: Date; endTime: Date; serviceId: string }[],
  serviceAppointments: { startTime: Date; endTime: Date }[],
  bufferMin: number,
  maxParticipants: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const stepMs = granularity * 60 * 1000;
  const durationMs = durationMin * 60 * 1000;
  let cursor = dayStart.getTime();
  const endMs = dayEnd.getTime();

  const otherAppointments = allStaffAppointments
    .filter((a) => a.serviceId !== allStaffAppointments[0]?.serviceId || false)
    .map((a) => ({
      start: new Date(a.startTime),
      end: addMinutes(new Date(a.endTime), bufferMin),
    }));

  const hardBlocked = [...blocked, ...otherAppointments].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  while (cursor + durationMs <= endMs) {
    const slotStart = cursor;
    const slotEnd = cursor + durationMs;

    const isHardBlocked = hardBlocked.some(
      (u) => slotStart < u.end.getTime() && slotEnd > u.start.getTime()
    );

    if (!isHardBlocked) {
      const bookedCount = serviceAppointments.filter((a) => {
        const aStart = new Date(a.startTime).getTime();
        return aStart >= slotStart && aStart < slotStart + stepMs;
      }).length;

      if (bookedCount < maxParticipants) {
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          bookedCount,
          maxParticipants,
        });
      }
    }

    cursor += stepMs;
  }

  return slots;
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
