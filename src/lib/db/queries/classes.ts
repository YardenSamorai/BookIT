import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  classSchedules,
  classInstances,
  appointments,
  services,
  staffMembers,
} from "@/lib/db/schema";

export async function getClassSchedules(businessId: string) {
  const rows = await db
    .select({
      id: classSchedules.id,
      businessId: classSchedules.businessId,
      serviceId: classSchedules.serviceId,
      staffId: classSchedules.staffId,
      title: classSchedules.title,
      daysOfWeek: classSchedules.daysOfWeek,
      startTime: classSchedules.startTime,
      durationMinutes: classSchedules.durationMinutes,
      maxParticipants: classSchedules.maxParticipants,
      effectiveFrom: classSchedules.effectiveFrom,
      effectiveUntil: classSchedules.effectiveUntil,
      isActive: classSchedules.isActive,
      notes: classSchedules.notes,
      calendarColor: classSchedules.calendarColor,
      price: classSchedules.price,
      paymentMode: classSchedules.paymentMode,
      approvalType: classSchedules.approvalType,
      depositAmount: classSchedules.depositAmount,
      cancelHoursBefore: classSchedules.cancelHoursBefore,
      rescheduleHoursBefore: classSchedules.rescheduleHoursBefore,
      createdAt: classSchedules.createdAt,
      serviceName: services.title,
      staffName: staffMembers.name,
      serviceDuration: services.durationMinutes,
    })
    .from(classSchedules)
    .innerJoin(services, eq(classSchedules.serviceId, services.id))
    .innerJoin(staffMembers, eq(classSchedules.staffId, staffMembers.id))
    .where(eq(classSchedules.businessId, businessId))
    .orderBy(desc(classSchedules.createdAt));

  return rows;
}

export async function getClassScheduleById(id: string, businessId: string) {
  return db.query.classSchedules.findFirst({
    where: and(eq(classSchedules.id, id), eq(classSchedules.businessId, businessId)),
  });
}

export async function getClassInstancesForRange(
  businessId: string,
  dateFrom: string,
  dateTo: string
) {
  const rows = await db
    .select({
      id: classInstances.id,
      classScheduleId: classInstances.classScheduleId,
      businessId: classInstances.businessId,
      serviceId: classInstances.serviceId,
      staffId: classInstances.staffId,
      date: classInstances.date,
      startTime: classInstances.startTime,
      endTime: classInstances.endTime,
      maxParticipants: classInstances.maxParticipants,
      status: classInstances.status,
      serviceName: sql<string>`COALESCE(${classSchedules.title}, ${services.title})`.as("service_name"),
      staffName: staffMembers.name,
      calendarColor: classSchedules.calendarColor,
    })
    .from(classInstances)
    .innerJoin(classSchedules, eq(classInstances.classScheduleId, classSchedules.id))
    .innerJoin(services, eq(classInstances.serviceId, services.id))
    .innerJoin(staffMembers, eq(classInstances.staffId, staffMembers.id))
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

export async function getInstanceBookingCount(instanceId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.classInstanceId, instanceId),
        eq(appointments.status, "CONFIRMED")
      )
    );
  return result?.value ?? 0;
}

export async function getInstanceBookings(instanceId: string) {
  const rows = await db
    .select({
      id: appointments.id,
      customerId: appointments.customerId,
      status: appointments.status,
      createdAt: appointments.createdAt,
    })
    .from(appointments)
    .where(eq(appointments.classInstanceId, instanceId));

  return rows;
}
