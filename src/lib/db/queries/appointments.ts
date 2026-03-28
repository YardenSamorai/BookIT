import { eq, desc, and, gte, lte, lt, ne, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, appointmentLogs, services, staffMembers, businesses, customers, users } from "@/lib/db/schema";

export async function getCustomerAppointments(userId: string) {
  return db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      serviceId: appointments.serviceId,
      serviceName: services.title,
      serviceDuration: services.durationMinutes,
      cancelHoursBefore: services.cancelHoursBefore,
      staffId: appointments.staffId,
      staffName: staffMembers.name,
      businessId: appointments.businessId,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
    .innerJoin(businesses, eq(appointments.businessId, businesses.id))
    .where(eq(customers.userId, userId))
    .orderBy(desc(appointments.startTime));
}

export async function getBusinessAppointments(businessId: string) {
  return db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      paymentAmount: appointments.paymentAmount,
      notes: appointments.notes,
      source: appointments.source,
      createdAt: appointments.createdAt,
      serviceName: services.title,
      serviceDuration: services.durationMinutes,
      staffName: staffMembers.name,
      staffId: staffMembers.id,
      customerId: appointments.customerId,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
    .where(eq(appointments.businessId, businessId))
    .orderBy(desc(appointments.startTime));
}

export async function getAppointmentById(appointmentId: string) {
  return db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });
}

export async function getAppointmentDetail(appointmentId: string, businessId: string) {
  const [apt] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      paymentStatus: appointments.paymentStatus,
      paymentAmount: appointments.paymentAmount,
      notes: appointments.notes,
      source: appointments.source,
      cancelReason: appointments.cancelReason,
      cancelledAt: appointments.cancelledAt,
      cancelledBy: appointments.cancelledBy,
      createdAt: appointments.createdAt,
      serviceId: appointments.serviceId,
      serviceName: services.title,
      serviceDuration: services.durationMinutes,
      servicePrice: services.price,
      staffId: appointments.staffId,
      staffName: staffMembers.name,
      staffImage: staffMembers.imageUrl,
      customerId: appointments.customerId,
      customerName: users.name,
      customerPhone: users.phone,
      customerEmail: users.email,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, businessId)))
    .limit(1);

  if (!apt) return null;

  const logs = await db
    .select()
    .from(appointmentLogs)
    .where(eq(appointmentLogs.appointmentId, appointmentId))
    .orderBy(desc(appointmentLogs.createdAt));

  return { ...apt, logs };
}

export async function getWeekAppointments(businessId: string, weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      serviceName: services.title,
      staffId: staffMembers.id,
      staffName: staffMembers.name,
      customerName: users.name,
      customerPhone: users.phone,
      notes: appointments.notes,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.startTime, weekStart),
        lt(appointments.startTime, weekEnd),
        ne(appointments.status, "CANCELLED")
      )
    )
    .orderBy(appointments.startTime);
}

export async function getMonthAppointments(businessId: string, rangeStart: Date, rangeEnd: Date) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      serviceName: services.title,
      staffId: staffMembers.id,
      staffName: staffMembers.name,
      customerName: users.name,
      customerPhone: users.phone,
      notes: appointments.notes,
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
        ne(appointments.status, "CANCELLED"),
        isNull(appointments.classInstanceId)
      )
    )
    .orderBy(appointments.startTime);
}

export interface AppointmentFilters {
  status?: string;
  staffId?: string;
  serviceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function getAppointmentsForBusiness(
  businessId: string,
  filters?: AppointmentFilters
) {
  const conditions = [eq(appointments.businessId, businessId)];

  if (filters?.status) {
    conditions.push(eq(appointments.status, filters.status as any));
  }
  if (filters?.staffId) {
    conditions.push(eq(appointments.staffId, filters.staffId));
  }
  if (filters?.serviceId) {
    conditions.push(eq(appointments.serviceId, filters.serviceId));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(appointments.startTime, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(appointments.startTime, filters.dateTo));
  }

  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      paymentStatus: appointments.paymentStatus,
      paymentAmount: appointments.paymentAmount,
      notes: appointments.notes,
      serviceName: services.title,
      staffName: staffMembers.name,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(appointments.startTime))
    .limit(50);
}
