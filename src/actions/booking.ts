"use server";

import { and, eq, gte, lt, ne, sql, count } from "drizzle-orm";
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
  customerCards,
  staffMembers,
  users,
} from "@/lib/db/schema";
import { bookingSchema, type BookingInput } from "@/validators/booking";
import { findActiveCardsForService } from "@/lib/db/queries/cards";
import { mutateCardSessions } from "@/lib/cards/ledger";
import {
  pushEventToGoogle,
  updateGoogleEvent,
  deleteGoogleEvent,
} from "@/lib/calendar/google-sync";
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

async function findActiveCard(customerId: string, serviceId: string) {
  const cards = await findActiveCardsForService(customerId, serviceId);
  return cards[0] ?? null;
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

  const { serviceId, staffId, startTime: startTimeStr, notes, classInstanceId } = parsed.data;
  const startTime = new Date(startTimeStr);

  const customerId = await findOrCreateCustomer(businessId, userId);

  if (classInstanceId) {
    const [existing] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.classInstanceId, classInstanceId),
          eq(appointments.customerId, customerId),
          ne(appointments.status, "CANCELLED")
        )
      )
      .limit(1);

    if (existing) {
      return { success: false, error: "ALREADY_REGISTERED" };
    }
  }

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

  if (service.isGroup) {
    const [groupCount] = await db
      .select({ value: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.staffId, staffId),
          eq(appointments.serviceId, serviceId),
          ne(appointments.status, "CANCELLED"),
          lt(appointments.startTime, bufferedEnd),
          gte(appointments.endTime, bufferedStart)
        )
      );
    const maxP = service.maxParticipants ?? 1;
    if ((groupCount?.value ?? 0) >= maxP) {
      return {
        success: false,
        error: "This class is full. Please choose another time.",
      };
    }
  } else {
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

  // Check for active card (new system first, then fall back to old packages)
  const activeCard = await findActiveCard(customerId, serviceId);
  const activePackage = !activeCard ? await findActivePackage(customerId, serviceId) : null;

  let paymentStatus: "FREE" | "ON_SITE" | "UNPAID" | "PACKAGE" | "PAID";
  let customerPackageId: string | null = null;
  let customerCardIdVal: string | null = null;

  if (activeCard) {
    paymentStatus = "PACKAGE";
    customerCardIdVal = activeCard.id;
  } else if (activePackage) {
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
      paymentAmount: (activeCard || activePackage) ? null : (service.price || null),
      customerPackageId,
      customerCardId: customerCardIdVal,
      notes: notes || null,
      source: "ONLINE",
      classInstanceId: classInstanceId || null,
    })
    .returning({ id: appointments.id });

  // Deduct session via new card ledger
  if (activeCard) {
    await db.transaction(async (tx) => {
      await mutateCardSessions(tx as unknown as typeof db, {
        customerCardId: activeCard.id,
        delta: -1,
        action: "USED",
        appointmentId: appointment.id,
        actorType: "SYSTEM",
        notes: `Auto-deducted for booking`,
      });
    });
  }

  // Decrement old package sessions (backward compatibility)
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

  // Send WhatsApp/SMS notifications
  try {
    const { sendBookingNotificationSafe, sendOwnerBookingNotification } = await import("@/lib/notifications/send-notification");
    const [biz, staff, user] = await Promise.all([
      db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { name: true, ownerId: true },
      }),
      db.query.staffMembers.findFirst({ where: eq(staffMembers.id, staffId), columns: { name: true, phone: true, notifyOwner: true } }),
      db.query.users.findFirst({ where: eq(users.id, userId), columns: { phone: true, name: true } }),
    ]);

    const dateStr = startTime.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
    const timeStr = startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
    const variables: Record<string, string> = {
      customerName: user?.name || "",
      businessName: biz?.name || "",
      date: dateStr,
      time: timeStr,
      service: service.title,
      staff: staff?.name || "",
    };

    if (activeCard) {
      variables.cardName = activeCard.templateSnapshotName;
      variables.sessionsRemaining = String(activeCard.sessionsRemaining - 1);
    }

    const { sendStaffNotification } = await import("@/lib/notifications/send-notification");
    const promises: Promise<void>[] = [];

    if (user?.phone) {
      promises.push(sendBookingNotificationSafe({
        businessId,
        appointmentId: appointment.id,
        userId,
        recipientPhone: user.phone,
        type: "BOOKING_CONFIRMED",
        variables,
      }));
    }

    const shouldNotifyOwner = staff?.notifyOwner !== false || !staff?.phone;
    if (biz?.ownerId && shouldNotifyOwner) {
      promises.push(sendOwnerBookingNotification(businessId, biz.ownerId, variables));
    }

    promises.push(sendStaffNotification(businessId, staffId, "STAFF_NEW_BOOKING", variables));

    await Promise.all(promises);
  } catch { /* notification failure must not block booking */ }

  pushEventToGoogle(appointment.id).catch(() => {});

  revalidatePath(`/b`);
  return { success: true, data: { appointmentId: appointment.id } };
}

export async function createManualAppointment(input: {
  businessId: string;
  customerPhone: string;
  customerName: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  notes?: string;
  durationMinutes?: number;
  customerCardId?: string;
}): Promise<ActionResult<{ appointmentId: string }>> {
  const { requireBusinessOwner } = await import("@/lib/auth/guards");
  await requireBusinessOwner();

  const { businessId, customerPhone, customerName, serviceId, staffId, startTime: startTimeStr, notes, durationMinutes: customDurationMin, customerCardId: inputCardId } = input;

  if (!customerPhone?.trim() || !customerName?.trim()) {
    return { success: false, error: "Customer name and phone are required" };
  }

  const { users } = await import("@/lib/db/schema");
  const phone = customerPhone.replace(/[\s\-()]/g, "");

  let user = await db.query.users.findFirst({
    where: eq(users.phone, phone),
    columns: { id: true },
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ name: customerName.trim(), phone, role: "CUSTOMER" })
      .returning({ id: users.id });
    user = created;
  }

  const customerId = await findOrCreateCustomer(businessId, user.id);

  const startTime = new Date(startTimeStr);
  if (isNaN(startTime.getTime())) {
    return { success: false, error: "Invalid date/time" };
  }
  if (startTime.getTime() < Date.now() - 60_000) {
    return { success: false, error: "Cannot book appointments in the past" };
  }

  const service = await db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, businessId)),
  });

  if (!service) return { success: false, error: "Service not found" };

  const effectiveDuration = customDurationMin && customDurationMin > 0 ? customDurationMin : service.durationMinutes;
  const endTime = new Date(startTime.getTime() + effectiveDuration * 60 * 1000);

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { defaultBufferMin: true },
  });
  const bufferMin = service.bufferMinutes ?? business?.defaultBufferMin ?? 0;
  const bufferedStart = new Date(startTime.getTime() - bufferMin * 60 * 1000);
  const bufferedEnd = new Date(endTime.getTime() + bufferMin * 60 * 1000);

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
    return { success: false, error: "Time slot not available" };
  }

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
      return { success: false, error: "Time slot not available – this service blocks all staff" };
    }
  }

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
    return { success: false, error: "Time slot blocked by another service" };
  }

  // Check if a card was explicitly selected or auto-detect one
  let useCardId = inputCardId || null;
  if (!useCardId) {
    const autoCard = await findActiveCard(customerId, serviceId);
    if (autoCard) useCardId = autoCard.id;
  }

  const manualPaymentStatus = useCardId
    ? "PACKAGE" as const
    : service.paymentMode === "FREE"
      ? "FREE" as const
      : "ON_SITE" as const;

  const [appointment] = await db
    .insert(appointments)
    .values({
      businessId,
      customerId,
      serviceId,
      staffId,
      startTime,
      endTime,
      status: "CONFIRMED",
      paymentStatus: manualPaymentStatus,
      paymentAmount: useCardId ? null : (service.price || null),
      customerCardId: useCardId,
      notes: notes || null,
      source: "DASHBOARD",
    })
    .returning({ id: appointments.id });

  if (useCardId) {
    await db.transaction(async (tx) => {
      await mutateCardSessions(tx as unknown as typeof db, {
        customerCardId: useCardId!,
        delta: -1,
        action: "USED",
        appointmentId: appointment.id,
        actorType: "STAFF",
        notes: "Manual booking",
      });
    });
  }

  await db.insert(appointmentLogs).values({
    appointmentId: appointment.id,
    action: "CREATED",
    newValue: "CONFIRMED",
    performedBy: "BUSINESS",
  });

  // Send WhatsApp/SMS notification to customer + owner + staff
  try {
    const { sendBookingNotificationSafe, sendOwnerBookingNotification, sendStaffNotification } = await import("@/lib/notifications/send-notification");
    const [biz, staffMember] = await Promise.all([
      db.query.businesses.findFirst({ where: eq(businesses.id, businessId), columns: { name: true, ownerId: true } }),
      db.query.staffMembers.findFirst({ where: eq(staffMembers.id, staffId), columns: { name: true, phone: true, notifyOwner: true } }),
    ]);
    const dateStr = startTime.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
    const timeStr = startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
    const variables: Record<string, string> = {
      customerName,
      businessName: biz?.name || "",
      date: dateStr,
      time: timeStr,
      service: service.title,
      staff: staffMember?.name || "",
    };

    const promises: Promise<void>[] = [];
    promises.push(sendBookingNotificationSafe({
      businessId,
      appointmentId: appointment.id,
      recipientPhone: phone,
      type: "BOOKING_CONFIRMED",
      variables,
    }));
    const shouldNotifyOwner = staffMember?.notifyOwner !== false || !staffMember?.phone;
    if (biz?.ownerId && shouldNotifyOwner) {
      promises.push(sendOwnerBookingNotification(businessId, biz.ownerId, variables));
    }
    promises.push(sendStaffNotification(businessId, staffId, "STAFF_NEW_BOOKING", variables));
    await Promise.all(promises);
  } catch { /* notification failure must not block appointment creation */ }

  pushEventToGoogle(appointment.id).catch(() => {});

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  return { success: true, data: { appointmentId: appointment.id } };
}

export async function getUpcomingClassInstances(
  businessId: string,
  serviceId: string
) {
  const { requireBusinessOwner } = await import("@/lib/auth/guards");
  await requireBusinessOwner();

  const { classInstances } = await import("@/lib/db/schema");
  const now = new Date();

  const instances = await db
    .select({
      id: classInstances.id,
      date: classInstances.date,
      startTime: classInstances.startTime,
      endTime: classInstances.endTime,
      maxParticipants: classInstances.maxParticipants,
      staffId: classInstances.staffId,
      classScheduleId: classInstances.classScheduleId,
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.businessId, businessId),
        eq(classInstances.serviceId, serviceId),
        eq(classInstances.status, "SCHEDULED"),
        gte(classInstances.startTime, now)
      )
    )
    .orderBy(classInstances.startTime)
    .limit(30);

  const result = [];
  for (const inst of instances) {
    const [countRow] = await db
      .select({ value: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.classInstanceId, inst.id),
          ne(appointments.status, "CANCELLED")
        )
      );
    result.push({
      ...inst,
      startTime: inst.startTime.toISOString(),
      endTime: inst.endTime.toISOString(),
      bookedCount: countRow?.value ?? 0,
    });
  }

  return result;
}

export async function enrollCustomerInClass(input: {
  businessId: string;
  customerPhone: string;
  customerName: string;
  classInstanceId: string;
  notes?: string;
  customerCardId?: string;
}): Promise<ActionResult<{ appointmentId: string }>> {
  const { requireBusinessOwner } = await import("@/lib/auth/guards");
  await requireBusinessOwner();

  const { businessId, customerPhone, customerName, classInstanceId, notes, customerCardId: inputClassCardId } = input;

  if (!customerPhone?.trim() || !customerName?.trim()) {
    return { success: false, error: "Customer name and phone are required" };
  }

  const { classInstances } = await import("@/lib/db/schema");
  const instance = await db.query.classInstances.findFirst({
    where: and(
      eq(classInstances.id, classInstanceId),
      eq(classInstances.businessId, businessId),
      eq(classInstances.status, "SCHEDULED")
    ),
  });

  if (!instance) return { success: false, error: "Class instance not found" };

  const phone = customerPhone.replace(/[\s\-()]/g, "");
  let user = await db.query.users.findFirst({
    where: eq(users.phone, phone),
    columns: { id: true },
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ name: customerName.trim(), phone, role: "CUSTOMER" })
      .returning({ id: users.id });
    user = created;
  }

  const customerId = await findOrCreateCustomer(businessId, user.id);

  const [existing] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.classInstanceId, classInstanceId),
        eq(appointments.customerId, customerId),
        ne(appointments.status, "CANCELLED")
      )
    )
    .limit(1);

  if (existing) {
    return { success: false, error: "ALREADY_REGISTERED" };
  }

  const [countRow] = await db
    .select({ value: count() })
    .from(appointments)
    .where(
      and(
        eq(appointments.classInstanceId, classInstanceId),
        ne(appointments.status, "CANCELLED")
      )
    );

  if ((countRow?.value ?? 0) >= instance.maxParticipants) {
    return { success: false, error: "Class is full" };
  }

  const service = await db.query.services.findFirst({
    where: eq(services.id, instance.serviceId),
    columns: { title: true, paymentMode: true, price: true },
  });

  // Check for active card for this class's service
  let classCardId = inputClassCardId || null;
  if (!classCardId) {
    const autoCard = await findActiveCard(customerId, instance.serviceId);
    if (autoCard) classCardId = autoCard.id;
  }

  const enrollPaymentStatus = classCardId
    ? "PACKAGE" as const
    : service?.paymentMode === "FREE"
      ? "FREE" as const
      : "ON_SITE" as const;

  const [appointment] = await db
    .insert(appointments)
    .values({
      businessId,
      customerId,
      serviceId: instance.serviceId,
      staffId: instance.staffId,
      startTime: instance.startTime,
      endTime: instance.endTime,
      status: "CONFIRMED",
      paymentStatus: enrollPaymentStatus,
      paymentAmount: classCardId ? null : (service?.price || null),
      customerCardId: classCardId,
      notes: notes || null,
      source: "DASHBOARD",
      classInstanceId,
    })
    .returning({ id: appointments.id });

  if (classCardId) {
    await db.transaction(async (tx) => {
      await mutateCardSessions(tx as unknown as typeof db, {
        customerCardId: classCardId!,
        delta: -1,
        action: "USED",
        appointmentId: appointment.id,
        actorType: "STAFF",
        notes: "Class enrollment",
      });
    });
  }

  await db.insert(appointmentLogs).values({
    appointmentId: appointment.id,
    action: "CREATED",
    newValue: "CONFIRMED",
    performedBy: "BUSINESS",
  });

  try {
    const { sendBookingNotificationSafe, sendOwnerBookingNotification, sendStaffNotification } = await import("@/lib/notifications/send-notification");
    const [biz, staffMember] = await Promise.all([
      db.query.businesses.findFirst({ where: eq(businesses.id, businessId), columns: { name: true, ownerId: true } }),
      db.query.staffMembers.findFirst({ where: eq(staffMembers.id, instance.staffId), columns: { name: true, phone: true, notifyOwner: true } }),
    ]);
    const dateStr = instance.startTime.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
    const timeStr = instance.startTime.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
    const variables: Record<string, string> = {
      customerName,
      businessName: biz?.name || "",
      date: dateStr,
      time: timeStr,
      service: service?.title || "",
      staff: staffMember?.name || "",
    };

    const promises: Promise<void>[] = [];
    promises.push(sendBookingNotificationSafe({
      businessId,
      appointmentId: appointment.id,
      recipientPhone: phone,
      type: "BOOKING_CONFIRMED",
      variables,
    }));
    const shouldNotifyOwner = staffMember?.notifyOwner !== false || !staffMember?.phone;
    if (biz?.ownerId && shouldNotifyOwner) {
      promises.push(sendOwnerBookingNotification(businessId, biz.ownerId, variables));
    }
    promises.push(sendStaffNotification(businessId, instance.staffId, "STAFF_NEW_BOOKING", variables));
    await Promise.all(promises);
  } catch { /* notification failure must not block enrollment */ }

  pushEventToGoogle(appointment.id).catch(() => {});

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/classes");
  return { success: true, data: { appointmentId: appointment.id } };
}

export async function getStaffDaySchedule(
  _staffId: string,
  businessId: string,
  dateStr: string
): Promise<{ startTime: string; endTime: string; isActive: boolean } | null> {
  const { requireBusinessOwner } = await import("@/lib/auth/guards");
  await requireBusinessOwner();

  const { businessHours } = await import("@/lib/db/schema");
  const d = new Date(dateStr + "T12:00:00");
  const dayOfWeek = d.getDay();

  const hours = await db.query.businessHours.findFirst({
    where: and(
      eq(businessHours.businessId, businessId),
      eq(businessHours.dayOfWeek, dayOfWeek)
    ),
  });

  if (!hours) return null;
  return {
    startTime: hours.startTime,
    endTime: hours.endTime,
    isActive: hours.isOpen,
  };
}

export async function getDayAppointments(
  businessId: string,
  date: string,
  staffId?: string
) {
  const { requireBusinessOwner } = await import("@/lib/auth/guards");
  await requireBusinessOwner();

  const dayStart = new Date(date + "T00:00:00");
  const dayEnd = new Date(date + "T23:59:59.999");

  const conditions = [
    eq(appointments.businessId, businessId),
    gte(appointments.startTime, dayStart),
    lt(appointments.startTime, dayEnd),
    ne(appointments.status, "CANCELLED"),
  ];
  if (staffId) conditions.push(eq(appointments.staffId, staffId));

  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      serviceName: services.title,
      staffId: appointments.staffId,
      staffName: staffMembers.name,
      customerName: users.name,
      blocksAllStaff: services.blocksAllStaff,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(...conditions))
    .orderBy(appointments.startTime);
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

  // Restore card session if it was a card booking (new system)
  if (appointment.paymentStatus === "PACKAGE" && appointment.customerCardId) {
    const card = await db.query.customerCards.findFirst({
      where: eq(customerCards.id, appointment.customerCardId),
    });
    if (card) {
      const shouldRestore =
        card.snapshotRestoreOnLateCancel || cancelledBy === "BUSINESS";
      if (shouldRestore) {
        await db.transaction(async (tx) => {
          await mutateCardSessions(tx as unknown as typeof db, {
            customerCardId: appointment.customerCardId!,
            delta: 1,
            action: "RESTORED",
            appointmentId,
            actorType: cancelledBy === "CUSTOMER" ? "CUSTOMER" : "STAFF",
            notes: `Restored on cancellation`,
          });
        });
      }
    }
  }

  // Restore old package session if it was a package booking (legacy)
  if (appointment.paymentStatus === "PACKAGE" && appointment.customerPackageId && !appointment.customerCardId) {
    await db
      .update(customerPackages)
      .set({
        sessionsRemaining: sql`${customerPackages.sessionsRemaining} + 1`,
        sessionsUsed: sql`${customerPackages.sessionsUsed} - 1`,
        status: "ACTIVE",
      })
      .where(eq(customerPackages.id, appointment.customerPackageId));
  }

  // Send cancellation WhatsApp notification to customer + owner + staff (fire-and-forget)
  try {
    const { sendBookingNotificationSafe, sendOwnerBookingNotification, sendStaffNotification } = await import("@/lib/notifications/send-notification");
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, appointment.customerId),
      columns: { userId: true },
    });
    if (customer) {
      const [user, svc, cancelBiz, cancelStaff] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, customer.userId), columns: { phone: true, name: true } }),
        db.query.services.findFirst({ where: eq(services.id, appointment.serviceId), columns: { title: true } }),
        db.query.businesses.findFirst({ where: eq(businesses.id, appointment.businessId), columns: { name: true, ownerId: true } }),
        db.query.staffMembers.findFirst({ where: eq(staffMembers.id, appointment.staffId), columns: { phone: true, notifyOwner: true } }),
      ]);
      const dateStr = new Date(appointment.startTime).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
      const timeStr = new Date(appointment.startTime).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
      const variables: Record<string, string> = {
        customerName: user?.name || "",
        businessName: cancelBiz?.name || "",
        date: dateStr,
        time: timeStr,
        service: svc?.title || "",
        staff: "",
      };

      if (user?.phone) {
        sendBookingNotificationSafe({
          businessId: appointment.businessId,
          appointmentId,
          userId: customer.userId,
          recipientPhone: user.phone,
          type: "CANCELLATION",
          variables,
        });
      }
      const shouldNotifyOwner = cancelStaff?.notifyOwner !== false || !cancelStaff?.phone;
      if (cancelBiz?.ownerId && shouldNotifyOwner) {
        sendOwnerBookingNotification(appointment.businessId, cancelBiz.ownerId, {
          ...variables,
          customerName: user?.name || "Customer",
        });
      }
      sendStaffNotification(appointment.businessId, appointment.staffId, "STAFF_CANCELLATION", {
        ...variables,
        customerName: user?.name || "Customer",
      });
    }
  } catch { /* notification failure must not block cancellation */ }

  deleteGoogleEvent(appointmentId).catch(() => {});

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

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, appointment.businessId),
    columns: { defaultBufferMin: true },
  });
  const bufferMin = service.bufferMinutes ?? business?.defaultBufferMin ?? 0;
  const bufferedStart = new Date(start.getTime() - bufferMin * 60 * 1000);
  const bufferedEnd = new Date(end.getTime() + bufferMin * 60 * 1000);

  const conflicts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.staffId, staffId),
        ne(appointments.id, appointmentId),
        ne(appointments.status, "CANCELLED"),
        lt(appointments.startTime, bufferedEnd),
        gte(appointments.endTime, bufferedStart)
      )
    )
    .limit(1);

  if (conflicts.length > 0) {
    return { success: false, error: "Time slot not available" };
  }

  if (service.blocksAllStaff) {
    const crossConflicts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, appointment.businessId),
          ne(appointments.staffId, staffId),
          ne(appointments.id, appointmentId),
          ne(appointments.status, "CANCELLED"),
          lt(appointments.startTime, bufferedEnd),
          gte(appointments.endTime, bufferedStart)
        )
      )
      .limit(1);

    if (crossConflicts.length > 0) {
      return { success: false, error: "Time slot not available – this service blocks all staff" };
    }
  }

  const globalBlockConflicts = await db
    .select({ id: appointments.id })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .where(
      and(
        eq(appointments.businessId, appointment.businessId),
        eq(services.blocksAllStaff, true),
        ne(appointments.staffId, staffId),
        ne(appointments.id, appointmentId),
        ne(appointments.status, "CANCELLED"),
        lt(appointments.startTime, bufferedEnd),
        gte(appointments.endTime, bufferedStart)
      )
    )
    .limit(1);

  if (globalBlockConflicts.length > 0) {
    return { success: false, error: "Time slot blocked by another service" };
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

  try {
    const { sendBookingNotificationSafe, sendStaffNotification } = await import("@/lib/notifications/send-notification");
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, appointment.customerId),
      columns: { userId: true },
    });
    if (customer) {
      const [user, staffMember, biz] = await Promise.all([
        db.query.users.findFirst({ where: eq(users.id, customer.userId), columns: { phone: true, name: true } }),
        db.query.staffMembers.findFirst({ where: eq(staffMembers.id, staffId), columns: { name: true, phone: true, notifyOwner: true } }),
        db.query.businesses.findFirst({ where: eq(businesses.id, appointment.businessId), columns: { name: true } }),
      ]);
      const dateStr = start.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Jerusalem" });
      const timeStr = start.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" });
      const variables: Record<string, string> = {
        customerName: user?.name || "",
        businessName: biz?.name || "",
        date: dateStr,
        time: timeStr,
        service: service.title,
        staff: staffMember?.name || "",
      };

      if (user?.phone) {
        sendBookingNotificationSafe({
          businessId: appointment.businessId,
          appointmentId,
          userId: customer.userId,
          recipientPhone: user.phone,
          type: "RESCHEDULE",
          variables,
        });
      }
      sendStaffNotification(appointment.businessId, staffId, "STAFF_RESCHEDULE", variables);
    }
  } catch { /* notification failure must not block reschedule */ }

  updateGoogleEvent(appointmentId).catch(() => {});

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

// ─── Bulk Import Appointments ───────────────────────────────────────────────

export async function importAppointments(
  rows: {
    customerName: string;
    customerPhone: string;
    serviceName: string;
    staffName: string;
    date: string;
    time: string;
    notes?: string;
    durationOverride?: number;
  }[],
  serviceMap: Record<string, { id: string; durationMinutes: number; price: string | null }>,
  staffMap: Record<string, string>
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const { requireBusinessOwner: guard } = await import("@/lib/auth/guards");
  const { businessId } = await guard();

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const phone = row.customerPhone.replace(/[^+\d]/g, "");
      if (!row.customerName.trim() || !phone) { skipped++; continue; }

      const svc = serviceMap[row.serviceName.trim()];
      const staffId = staffMap[row.staffName.trim()];
      if (!svc || !staffId) { skipped++; continue; }

      const startTime = parseImportDateTime(row.date, row.time);
      if (!startTime) { skipped++; continue; }

      const duration = row.durationOverride && row.durationOverride > 0
        ? row.durationOverride
        : svc.durationMinutes;
      const endTime = new Date(startTime.getTime() + duration * 60_000);

      let existingUser = await db.query.users.findFirst({
        where: eq(users.phone, phone),
        columns: { id: true },
      });
      if (!existingUser) {
        const [newUser] = await db
          .insert(users)
          .values({ name: row.customerName.trim(), phone, role: "CUSTOMER" })
          .returning({ id: users.id });
        existingUser = newUser;
      }

      let customer = await db.query.customers.findFirst({
        where: and(eq(customers.businessId, businessId), eq(customers.userId, existingUser.id)),
        columns: { id: true },
      });
      if (!customer) {
        const [newCustomer] = await db
          .insert(customers)
          .values({ businessId, userId: existingUser.id, status: "ACTIVE" })
          .returning({ id: customers.id });
        customer = newCustomer;
      }

      await db.insert(appointments).values({
        businessId,
        customerId: customer.id,
        serviceId: svc.id,
        staffId,
        startTime,
        endTime,
        status: "CONFIRMED",
        paymentStatus: svc.price ? "UNPAID" : "FREE",
        paymentAmount: svc.price || null,
        notes: row.notes || null,
        source: "DASHBOARD",
      });

      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return { success: true, data: { imported, skipped } };
}

function parseImportDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    const time = timeStr.trim();
    const timeParts = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeParts) return null;
    const hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    if (hours > 23 || minutes > 59) return null;

    const d = dateStr.trim();
    let year: number, month: number, day: number;

    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(d)) {
      const parts = d.split(/[-/]/);
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(d)) {
      const parts = d.split(/[./]/);
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    } else {
      return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
    if (isNaN(result.getTime())) return null;
    return result;
  } catch {
    return null;
  }
}
