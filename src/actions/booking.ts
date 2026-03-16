"use server";

import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  appointments,
  appointmentLogs,
  services,
  customers,
  businesses,
  customerPackages,
  servicePackages,
} from "@/lib/db/schema";
import { bookingSchema, type BookingInput } from "@/validators/booking";
import type { ActionResult } from "@/types";

async function findActivePackage(customerId: string, serviceId: string) {
  const now = new Date();
  const pkgs = await db
    .select({
      id: customerPackages.id,
      sessionsRemaining: customerPackages.sessionsRemaining,
      packageServiceId: servicePackages.serviceId,
    })
    .from(customerPackages)
    .innerJoin(servicePackages, eq(customerPackages.packageId, servicePackages.id))
    .where(
      and(
        eq(customerPackages.customerId, customerId),
        eq(customerPackages.status, "ACTIVE"),
        eq(customerPackages.paymentStatus, "PAID"),
        eq(servicePackages.serviceId, serviceId),
      )
    )
    .limit(5);

  return pkgs.find((p) => {
    if (p.sessionsRemaining <= 0) return false;
    return true;
  }) ?? null;
}

async function findOrCreateCustomer(businessId: string, userId: string): Promise<string> {
  const existing = await db.query.customers.findFirst({
    where: and(eq(customers.businessId, businessId), eq(customers.userId, userId)),
    columns: { id: true },
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(customers)
    .values({ businessId, userId })
    .returning({ id: customers.id });
  return created.id;
}

export async function createAppointment(
  businessId: string,
  userId: string,
  input: BookingInput
): Promise<ActionResult<{ appointmentId: string }>> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { serviceId, staffId, startTime: startTimeStr, notes } = parsed.data;
  const startTime = new Date(startTimeStr);

  const customerId = await findOrCreateCustomer(businessId, userId);

  const service = await db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, businessId)),
  });

  if (!service) {
    return { success: false, error: "Service not found" };
  }

  const endTime = new Date(
    startTime.getTime() + service.durationMinutes * 60 * 1000
  );

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { defaultBufferMin: true },
  });

  const bufferMin = service.bufferMinutes ?? business?.defaultBufferMin ?? 0;

  const bufferedEnd = new Date(endTime.getTime() + bufferMin * 60 * 1000);
  const bufferedStart = new Date(startTime.getTime() - bufferMin * 60 * 1000);

  const conflicts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.staffId, staffId),
        ne(appointments.status, "CANCELLED"),
        lt(appointments.startTime, bufferedEnd),
        gte(appointments.endTime, bufferedStart)
      )
    )
    .limit(1);

  if (conflicts.length > 0) {
    return {
      success: false,
      error: "This time slot is no longer available. Please choose another.",
    };
  }

  // If this service blocks all staff, no one in the business can have overlapping appointments
  if (service.blocksAllStaff) {
    const crossConflicts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          ne(appointments.staffId, staffId),
          ne(appointments.status, "CANCELLED"),
          lt(appointments.startTime, bufferedEnd),
          gte(appointments.endTime, bufferedStart)
        )
      )
      .limit(1);

    if (crossConflicts.length > 0) {
      return {
        success: false,
        error: "This time slot is no longer available. Please choose another.",
      };
    }
  }

  // Check if any existing "blocks all staff" appointment blocks this slot
  const globalBlockConflicts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(services.blocksAllStaff, true),
        ne(appointments.staffId, staffId),
        ne(appointments.status, "CANCELLED"),
        lt(appointments.startTime, bufferedEnd),
        gte(appointments.endTime, bufferedStart)
      )
    )
    .limit(1);

  if (globalBlockConflicts.length > 0) {
    return {
      success: false,
      error: "This time slot is no longer available. Please choose another.",
    };
  }

  // Check for active session package
  const activePackage = await findActivePackage(customerId, serviceId);

  let paymentStatus: "FREE" | "ON_SITE" | "UNPAID" | "PACKAGE" | "PAID";
  let customerPackageId: string | null = null;

  if (activePackage) {
    paymentStatus = "PACKAGE";
    customerPackageId = activePackage.id;
  } else if (service.paymentMode === "FREE") {
    paymentStatus = "FREE";
  } else if (service.paymentMode === "ON_SITE") {
    paymentStatus = "ON_SITE";
  } else {
    paymentStatus = "UNPAID";
  }

  const status = service.approvalType === "AUTO" ? "CONFIRMED" : "PENDING";

  const [appointment] = await db
    .insert(appointments)
    .values({
      businessId,
      customerId,
      serviceId,
      staffId,
      startTime,
      endTime,
      status,
      paymentStatus,
      paymentAmount: activePackage ? null : (service.price || null),
      customerPackageId,
      notes: notes || null,
      source: "ONLINE",
    })
    .returning({ id: appointments.id });

  // Decrement package sessions
  if (activePackage) {
    const newRemaining = activePackage.sessionsRemaining - 1;
    await db
      .update(customerPackages)
      .set({
        sessionsRemaining: newRemaining,
        sessionsUsed: sql`${customerPackages.sessionsUsed} + 1`,
        status: newRemaining <= 0 ? "FULLY_USED" : "ACTIVE",
      })
      .where(eq(customerPackages.id, activePackage.id));
  }

  await db.insert(appointmentLogs).values({
    appointmentId: appointment.id,
    action: "CREATED",
    newValue: status,
    performedBy: "CUSTOMER",
  });

  revalidatePath(`/b`);
  return { success: true, data: { appointmentId: appointment.id } };
}

export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: "CUSTOMER" | "BUSINESS",
  reason?: string
): Promise<ActionResult> {
  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  if (appointment.status === "CANCELLED") {
    return { success: false, error: "Appointment is already cancelled" };
  }

  if (appointment.status === "COMPLETED") {
    return { success: false, error: "Cannot cancel a completed appointment" };
  }

  await db
    .update(appointments)
    .set({
      status: "CANCELLED",
      cancelReason: reason || null,
      cancelledAt: new Date(),
      cancelledBy,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId));

  await db.insert(appointmentLogs).values({
    appointmentId,
    action: "CANCELLED",
    oldValue: appointment.status,
    newValue: "CANCELLED",
    performedBy: cancelledBy === "CUSTOMER" ? "CUSTOMER" : "BUSINESS",
  });

  if (cancelledBy === "CUSTOMER") {
    await db
      .update(customers)
      .set({ cancellationCount: sql`${customers.cancellationCount} + 1` })
      .where(eq(customers.id, appointment.customerId));
  }

  // Restore package session if it was a package booking
  if (appointment.paymentStatus === "PACKAGE" && appointment.customerPackageId) {
    await db
      .update(customerPackages)
      .set({
        sessionsRemaining: sql`${customerPackages.sessionsRemaining} + 1`,
        sessionsUsed: sql`${customerPackages.sessionsUsed} - 1`,
        status: "ACTIVE",
      })
      .where(eq(customerPackages.id, appointment.customerPackageId));
  }

  revalidatePath(`/b`);
  revalidatePath(`/dashboard`);
  return { success: true, data: undefined };
}

export async function rescheduleAppointment(
  appointmentId: string,
  newStartTime: string,
  newStaffId?: string
): Promise<ActionResult> {
  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    return { success: false, error: "Cannot reschedule this appointment" };
  }

  const service = await db.query.services.findFirst({
    where: eq(services.id, appointment.serviceId),
  });

  if (!service) {
    return { success: false, error: "Service not found" };
  }

  const start = new Date(newStartTime);
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);
  const staffId = newStaffId || appointment.staffId;

  const conflicts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.staffId, staffId),
        ne(appointments.id, appointmentId),
        ne(appointments.status, "CANCELLED"),
        lt(appointments.startTime, end),
        gte(appointments.endTime, start)
      )
    )
    .limit(1);

  if (conflicts.length > 0) {
    return { success: false, error: "Time slot not available" };
  }

  const oldStart = appointment.startTime;

  await db
    .update(appointments)
    .set({
      startTime: start,
      endTime: end,
      staffId,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId));

  await db.insert(appointmentLogs).values({
    appointmentId,
    action: "RESCHEDULED",
    oldValue: oldStart.toISOString(),
    newValue: start.toISOString(),
    performedBy: "CUSTOMER",
  });

  revalidatePath(`/b`);
  revalidatePath(`/dashboard`);
  return { success: true, data: undefined };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: "CONFIRMED" | "COMPLETED" | "NO_SHOW",
): Promise<ActionResult> {
  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED") {
    return { success: false, error: `Cannot change status of a ${appointment.status.toLowerCase()} appointment` };
  }

  await db
    .update(appointments)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));

  await db.insert(appointmentLogs).values({
    appointmentId,
    action: `STATUS_CHANGE`,
    oldValue: appointment.status,
    newValue: newStatus,
    performedBy: "BUSINESS",
  });

  if (newStatus === "NO_SHOW") {
    await db
      .update(customers)
      .set({ noShowCount: sql`${customers.noShowCount} + 1` })
      .where(eq(customers.id, appointment.customerId));
  }

  revalidatePath(`/dashboard`);
  return { success: true, data: undefined };
}
