import { eq, and, gte, lte, lt, ne, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  services,
  staffMembers,
  staffSchedules,
  staffBlockedSlots,
  staffTimeOff,
  businessHours,
  customers,
  users,
  classInstances,
} from "@/lib/db/schema";

export interface CalendarAppointment {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
  serviceId: string;
  durationMinutes: number;
  staffId: string;
  staffName: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  source: string;
  classInstanceId: string | null;
}

export interface CalendarClassInstance {
  id: string;
  classScheduleId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: Date;
  endTime: Date;
  maxParticipants: number;
  status: string;
  serviceName: string;
  staffName: string;
  bookedCount: number;
}

export interface StaffScheduleRow {
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface StaffBlockedSlotRow {
  id: string;
  staffId: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
}

export interface StaffTimeOffRow {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

export interface BusinessHoursRow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface CalendarData {
  appointments: CalendarAppointment[];
  classInstances: CalendarClassInstance[];
  staffSchedules: StaffScheduleRow[];
  staffBlockedSlots: StaffBlockedSlotRow[];
  staffTimeOff: StaffTimeOffRow[];
  businessHours: BusinessHoursRow[];
}

export async function getCalendarData(
  businessId: string,
  rangeStart: Date,
  rangeEnd: Date
): Promise<CalendarData> {
  const rangeStartStr = rangeStart.toISOString().slice(0, 10);
  const rangeEndStr = rangeEnd.toISOString().slice(0, 10);

  const [
    aptRows,
    ciRows,
    scheduleRows,
    blockedRows,
    timeOffRows,
    hoursRows,
  ] = await Promise.all([
    db
      .select({
        id: appointments.id,
        status: appointments.status,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        serviceName: services.title,
        serviceId: appointments.serviceId,
        durationMinutes: services.durationMinutes,
        staffId: appointments.staffId,
        staffName: staffMembers.name,
        customerName: users.name,
        customerPhone: users.phone,
        notes: appointments.notes,
        source: appointments.source,
        classInstanceId: appointments.classInstanceId,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
      .innerJoin(customers, eq(appointments.customerId, customers.id))
      .innerJoin(users, eq(customers.userId, users.id))
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.startTime, rangeStart),
          lt(appointments.startTime, rangeEnd),
          ne(appointments.status, "CANCELLED")
        )
      )
      .orderBy(appointments.startTime),

    getClassInstancesWithCounts(businessId, rangeStartStr, rangeEndStr),

    db
      .select({
        staffId: staffSchedules.staffId,
        dayOfWeek: staffSchedules.dayOfWeek,
        startTime: staffSchedules.startTime,
        endTime: staffSchedules.endTime,
        isActive: staffSchedules.isActive,
      })
      .from(staffSchedules)
      .innerJoin(staffMembers, eq(staffSchedules.staffId, staffMembers.id))
      .where(
        and(
          eq(staffMembers.businessId, businessId),
          eq(staffMembers.isActive, true)
        )
      ),

    db
      .select({
        id: staffBlockedSlots.id,
        staffId: staffBlockedSlots.staffId,
        startTime: staffBlockedSlots.startTime,
        endTime: staffBlockedSlots.endTime,
        reason: staffBlockedSlots.reason,
      })
      .from(staffBlockedSlots)
      .innerJoin(staffMembers, eq(staffBlockedSlots.staffId, staffMembers.id))
      .where(
        and(
          eq(staffMembers.businessId, businessId),
          lt(staffBlockedSlots.startTime, rangeEnd),
          gte(staffBlockedSlots.endTime, rangeStart)
        )
      ),

    db
      .select({
        id: staffTimeOff.id,
        staffId: staffTimeOff.staffId,
        startDate: staffTimeOff.startDate,
        endDate: staffTimeOff.endDate,
        reason: staffTimeOff.reason,
      })
      .from(staffTimeOff)
      .innerJoin(staffMembers, eq(staffTimeOff.staffId, staffMembers.id))
      .where(
        and(
          eq(staffMembers.businessId, businessId),
          lte(staffTimeOff.startDate, rangeEndStr),
          gte(staffTimeOff.endDate, rangeStartStr)
        )
      ),

    db
      .select({
        dayOfWeek: businessHours.dayOfWeek,
        startTime: businessHours.startTime,
        endTime: businessHours.endTime,
        isOpen: businessHours.isOpen,
      })
      .from(businessHours)
      .where(eq(businessHours.businessId, businessId)),
  ]);

  return {
    appointments: aptRows,
    classInstances: ciRows,
    staffSchedules: scheduleRows,
    staffBlockedSlots: blockedRows,
    staffTimeOff: timeOffRows,
    businessHours: hoursRows,
  };
}

async function getClassInstancesWithCounts(
  businessId: string,
  dateFrom: string,
  dateTo: string
): Promise<CalendarClassInstance[]> {
  const bookedCountSq = db
    .select({
      classInstanceId: appointments.classInstanceId,
      cnt: count().as("cnt"),
    })
    .from(appointments)
    .where(eq(appointments.status, "CONFIRMED"))
    .groupBy(appointments.classInstanceId)
    .as("booked");

  const rows = await db
    .select({
      id: classInstances.id,
      classScheduleId: classInstances.classScheduleId,
      serviceId: classInstances.serviceId,
      staffId: classInstances.staffId,
      date: classInstances.date,
      startTime: classInstances.startTime,
      endTime: classInstances.endTime,
      maxParticipants: classInstances.maxParticipants,
      status: classInstances.status,
      serviceName: services.title,
      staffName: staffMembers.name,
      bookedCount: sql<number>`coalesce(${bookedCountSq.cnt}, 0)`.mapWith(Number),
    })
    .from(classInstances)
    .innerJoin(services, eq(classInstances.serviceId, services.id))
    .innerJoin(staffMembers, eq(classInstances.staffId, staffMembers.id))
    .leftJoin(bookedCountSq, eq(classInstances.id, bookedCountSq.classInstanceId))
    .where(
      and(
        eq(classInstances.businessId, businessId),
        gte(classInstances.date, dateFrom),
        lte(classInstances.date, dateTo),
        eq(classInstances.status, "SCHEDULED")
      )
    );

  return rows;
}
