import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  customers,
  customerNotes,
  customerActivities,
  appointments,
  users,
  services,
  staffMembers,
  customerPackages,
  servicePackages,
  customerCards,
} from "@/lib/db/schema";

// ─── Existing queries (preserved) ──────────────────────────────────────────

export async function getCustomersForBusiness(businessId: string) {
  const rows = await db
    .select({
      id: customers.id,
      userId: customers.userId,
      name: users.name,
      phone: users.phone,
      email: users.email,
      tags: customers.tags,
      status: customers.status,
      cancellationCount: customers.cancellationCount,
      noShowCount: customers.noShowCount,
      createdAt: customers.createdAt,
      appointmentCount: sql<number>`
        (SELECT count(*)::int FROM appointment
         WHERE appointment.customer_id = ${customers.id})
      `,
      lastAppointmentDate: sql<string | null>`
        (SELECT max(appointment.start_time)::text FROM appointment
         WHERE appointment.customer_id = ${customers.id})
      `,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(customers.businessId, businessId))
    .orderBy(desc(customers.createdAt));

  return rows.map((r) => ({
    ...r,
    name: r.name || r.phone || "—",
  }));
}

export type CustomerRow = Awaited<ReturnType<typeof getCustomersForBusiness>>[number];

export async function getCustomerDetail(customerId: string, businessId: string) {
  const customer = await db
    .select({
      id: customers.id,
      userId: customers.userId,
      name: users.name,
      phone: users.phone,
      email: users.email,
      tags: customers.tags,
      cancellationCount: customers.cancellationCount,
      noShowCount: customers.noShowCount,
      createdAt: customers.createdAt,
      appointmentCount: sql<number>`
        (SELECT count(*)::int FROM appointment
         WHERE appointment.customer_id = ${customers.id})
      `,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)))
    .limit(1);

  if (!customer[0]) return null;

  customer[0].name = customer[0].name || customer[0].phone || "—";

  const [notes, appointmentRows] = await Promise.all([
    db
      .select()
      .from(customerNotes)
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt)),
    db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        serviceName: services.title,
        staffName: staffMembers.name,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
      .where(eq(appointments.customerId, customerId))
      .orderBy(desc(appointments.startTime)),
  ]);

  return {
    ...customer[0],
    notes,
    appointments: appointmentRows,
  };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

export async function getCustomerPackages(customerId: string, businessId: string) {
  const rows = await db
    .select({
      id: customerPackages.id,
      packageId: customerPackages.packageId,
      sessionsRemaining: customerPackages.sessionsRemaining,
      sessionsUsed: customerPackages.sessionsUsed,
      purchasedAt: customerPackages.purchasedAt,
      expiresAt: customerPackages.expiresAt,
      paymentStatus: customerPackages.paymentStatus,
      status: customerPackages.status,
      packageName: servicePackages.name,
      serviceName: services.title,
      serviceId: servicePackages.serviceId,
      sessionCount: servicePackages.sessionCount,
      packagePrice: servicePackages.price,
    })
    .from(customerPackages)
    .innerJoin(servicePackages, eq(customerPackages.packageId, servicePackages.id))
    .innerJoin(services, eq(servicePackages.serviceId, services.id))
    .where(
      and(
        eq(customerPackages.customerId, customerId),
        eq(customerPackages.businessId, businessId)
      )
    )
    .orderBy(desc(customerPackages.purchasedAt));

  return rows;
}

export type CustomerPackageRow = Awaited<ReturnType<typeof getCustomerPackages>>[number];

export async function getCustomerByUserId(userId: string, businessId: string) {
  return db.query.customers.findFirst({
    where: and(eq(customers.businessId, businessId), eq(customers.userId, userId)),
    columns: { id: true },
  });
}

// ─── Customer Profile V2 queries ────────────────────────────────────────────

export async function getCustomerProfile(customerId: string, businessId: string) {
  const customer = await db
    .select({
      id: customers.id,
      userId: customers.userId,
      name: users.name,
      phone: users.phone,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: customers.status,
      tags: customers.tags,
      cancellationCount: customers.cancellationCount,
      noShowCount: customers.noShowCount,
      birthday: customers.birthday,
      address: customers.address,
      source: customers.source,
      gender: customers.gender,
      preferredLanguage: customers.preferredLanguage,
      generalNotes: customers.generalNotes,
      smsOptIn: customers.smsOptIn,
      whatsappOptIn: customers.whatsappOptIn,
      emailMarketingOptIn: customers.emailMarketingOptIn,
      reminderChannel: customers.reminderChannel,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,

      upcomingAppointments: sql<number>`
        (SELECT count(*)::int FROM appointment
         WHERE appointment.customer_id = ${customers.id}
           AND appointment.start_time > now()
           AND appointment.status NOT IN ('CANCELLED'))
      `,
      totalVisits: sql<number>`
        (SELECT count(*)::int FROM appointment
         WHERE appointment.customer_id = ${customers.id}
           AND appointment.status = 'COMPLETED')
      `,
      activeCards: sql<number>`
        (SELECT count(*)::int FROM customer_card
         WHERE customer_card.customer_id = ${customers.id}
           AND customer_card.status = 'ACTIVE')
      `,
      pendingCards: sql<number>`
        (SELECT count(*)::int FROM customer_card
         WHERE customer_card.customer_id = ${customers.id}
           AND customer_card.status = 'PENDING_PAYMENT')
      `,
      unpaidBalance: sql<string>`
        coalesce((SELECT sum(appointment.payment_amount::numeric)
         FROM appointment
         WHERE appointment.customer_id = ${customers.id}
           AND appointment.payment_status = 'UNPAID'
           AND appointment.status IN ('CONFIRMED', 'COMPLETED')
           AND appointment.payment_amount IS NOT NULL
           AND appointment.payment_amount::numeric > 0
        ), 0)::text
      `,
      lastVisitDate: sql<string | null>`
        (SELECT max(appointment.start_time)::text FROM appointment
         WHERE appointment.customer_id = ${customers.id}
           AND appointment.status = 'COMPLETED')
      `,
      appointmentCount: sql<number>`
        (SELECT count(*)::int FROM appointment
         WHERE appointment.customer_id = ${customers.id})
      `,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)))
    .limit(1);

  if (!customer[0]) return null;

  const row = customer[0];
  row.name = row.name || row.phone || "—";

  const [notes, appointmentRows] = await Promise.all([
    db
      .select()
      .from(customerNotes)
      .where(eq(customerNotes.customerId, customerId))
      .orderBy(desc(customerNotes.createdAt)),
    db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        paymentStatus: appointments.paymentStatus,
        paymentAmount: appointments.paymentAmount,
        serviceName: services.title,
        staffName: staffMembers.name,
        source: appointments.source,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
      .where(eq(appointments.customerId, customerId))
      .orderBy(desc(appointments.startTime)),
  ]);

  return {
    ...row,
    notes,
    appointments: appointmentRows,
  };
}

export type CustomerProfile = NonNullable<Awaited<ReturnType<typeof getCustomerProfile>>>;

export async function getCustomerActivities(
  customerId: string,
  businessId: string,
  limit = 20,
  offset = 0
) {
  return db
    .select()
    .from(customerActivities)
    .where(
      and(
        eq(customerActivities.customerId, customerId),
        eq(customerActivities.businessId, businessId)
      )
    )
    .orderBy(desc(customerActivities.createdAt))
    .limit(limit)
    .offset(offset);
}

export type CustomerActivity = Awaited<ReturnType<typeof getCustomerActivities>>[number];

export async function getCustomerFinancialActivity(
  customerId: string,
  businessId: string
) {
  const [appointmentPayments, cardPurchases] = await Promise.all([
    db
      .select({
        id: appointments.id,
        date: appointments.startTime,
        type: sql<string>`'appointment'`,
        description: services.title,
        amount: appointments.paymentAmount,
        paymentStatus: appointments.paymentStatus,
        appointmentStatus: appointments.status,
      })
      .from(appointments)
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.customerId, customerId))
      .orderBy(desc(appointments.startTime)),
    db
      .select({
        id: customerCards.id,
        date: customerCards.purchasedAt,
        type: sql<string>`'card'`,
        description: customerCards.templateSnapshotName,
        amount: customerCards.templateSnapshotPrice,
        paymentStatus: customerCards.paymentStatus,
        cardStatus: customerCards.status,
      })
      .from(customerCards)
      .where(
        and(
          eq(customerCards.customerId, customerId),
          eq(customerCards.businessId, businessId)
        )
      )
      .orderBy(desc(customerCards.purchasedAt)),
  ]);

  const combined = [
    ...appointmentPayments.map((a) => ({
      id: a.id,
      date: a.date,
      type: "appointment" as const,
      description: a.description,
      amount: a.amount,
      paymentStatus: a.paymentStatus,
      status: a.appointmentStatus,
    })),
    ...cardPurchases.map((c) => ({
      id: c.id,
      date: c.date,
      type: "card" as const,
      description: c.description,
      amount: c.amount,
      paymentStatus: c.paymentStatus,
      status: c.cardStatus,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return combined;
}

export type FinancialActivityRow = Awaited<ReturnType<typeof getCustomerFinancialActivity>>[number];
