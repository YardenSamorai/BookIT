import { eq, and, sql, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, customerNotes, appointments, users, services, staffMembers } from "@/lib/db/schema";

export async function getCustomersForBusiness(businessId: string) {
  const rows = await db
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
