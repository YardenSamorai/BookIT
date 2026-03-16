import { eq, and, gte, lte, ne, count, sum, sql, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  services,
  staffMembers,
  customers,
  businesses,
  users,
} from "@/lib/db/schema";

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function getDashboardData(businessId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    business,
    allAppointments,
    servicesList,
    staffList,
    customerCount,
    newCustomersMonth,
    recentAppointments,
  ] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { currency: true },
    }),
    db
      .select({
        id: appointments.id,
        staffId: appointments.staffId,
        serviceId: appointments.serviceId,
        status: appointments.status,
        startTime: appointments.startTime,
        paymentAmount: appointments.paymentAmount,
        customerId: appointments.customerId,
      })
      .from(appointments)
      .where(eq(appointments.businessId, businessId)),
    db
      .select({
        id: services.id,
        title: services.title,
        isActive: services.isActive,
        imageUrl: services.imageUrl,
      })
      .from(services)
      .where(eq(services.businessId, businessId)),
    db
      .select({
        id: staffMembers.id,
        name: staffMembers.name,
        role: staffMembers.roleTitle,
        imageUrl: staffMembers.imageUrl,
        isActive: staffMembers.isActive,
      })
      .from(staffMembers)
      .where(eq(staffMembers.businessId, businessId)),
    db
      .select({ value: count() })
      .from(customers)
      .where(eq(customers.businessId, businessId)),
    db
      .select({ value: count() })
      .from(customers)
      .where(
        and(
          eq(customers.businessId, businessId),
          gte(customers.createdAt, monthStart)
        )
      ),
    db
      .select({
        id: appointments.id,
        serviceId: appointments.serviceId,
        staffId: appointments.staffId,
        customerId: appointments.customerId,
        status: appointments.status,
        startTime: appointments.startTime,
        paymentAmount: appointments.paymentAmount,
      })
      .from(appointments)
      .where(eq(appointments.businessId, businessId))
      .orderBy(desc(appointments.startTime))
      .limit(8),
  ]);

  const currency = business?.currency ?? "ILS";

  const todayAppts = allAppointments.filter(
    (a) => a.startTime >= todayStart && a.startTime <= todayEnd && a.status !== "CANCELLED"
  );
  const weekAppts = allAppointments.filter(
    (a) => a.startTime >= weekStart && a.startTime <= todayEnd && a.status !== "CANCELLED"
  );
  const monthAppts = allAppointments.filter(
    (a) => a.startTime >= monthStart && a.startTime <= monthEnd && a.status !== "CANCELLED"
  );
  const pendingAppts = allAppointments.filter((a) => a.status === "PENDING");
  const completedAppts = allAppointments.filter((a) => a.status === "COMPLETED");
  const cancelledAppts = allAppointments.filter((a) => a.status === "CANCELLED");

  const totalRevenue = allAppointments.reduce((sum, a) => {
    if (a.status !== "CANCELLED" && a.paymentAmount) {
      return sum + parseFloat(a.paymentAmount);
    }
    return sum;
  }, 0);

  const monthRevenue = monthAppts.reduce((sum, a) => {
    if (a.paymentAmount) return sum + parseFloat(a.paymentAmount);
    return sum;
  }, 0);

  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const serviceMap = new Map(servicesList.map((s) => [s.id, s]));

  // Staff performance
  const staffPerf = new Map<string, { count: number; revenue: number }>();
  for (const a of allAppointments) {
    if (a.status === "CANCELLED") continue;
    const curr = staffPerf.get(a.staffId) ?? { count: 0, revenue: 0 };
    curr.count++;
    if (a.paymentAmount) curr.revenue += parseFloat(a.paymentAmount);
    staffPerf.set(a.staffId, curr);
  }

  const staffPerformance = staffList
    .filter((s) => s.isActive)
    .map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      imageUrl: s.imageUrl,
      appointmentsCount: staffPerf.get(s.id)?.count ?? 0,
      revenue: staffPerf.get(s.id)?.revenue ?? 0,
    }))
    .sort((a, b) => b.appointmentsCount - a.appointmentsCount);

  // Popular services
  const svcCount = new Map<string, number>();
  for (const a of allAppointments) {
    if (a.status === "CANCELLED") continue;
    svcCount.set(a.serviceId, (svcCount.get(a.serviceId) ?? 0) + 1);
  }

  const totalNonCancelled = allAppointments.filter((a) => a.status !== "CANCELLED").length;
  const popularServices = servicesList
    .filter((s) => s.isActive)
    .map((s) => ({
      id: s.id,
      title: s.title,
      imageUrl: s.imageUrl,
      count: svcCount.get(s.id) ?? 0,
      percentage: totalNonCancelled > 0
        ? Math.round(((svcCount.get(s.id) ?? 0) / totalNonCancelled) * 100)
        : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent appointments enriched
  const recentEnriched = recentAppointments.map((a) => {
    const svc = serviceMap.get(a.serviceId);
    const stf = staffMap.get(a.staffId);
    return {
      id: a.id,
      serviceName: svc?.title ?? "—",
      staffName: stf?.name ?? "—",
      status: a.status,
      startTime: a.startTime.toISOString(),
      paymentAmount: a.paymentAmount,
    };
  });

  // Days in month for occupancy calculation
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();

  return {
    currency,
    stats: {
      todayCount: todayAppts.length,
      weekCount: weekAppts.length,
      monthCount: monthAppts.length,
      totalCount: allAppointments.filter((a) => a.status !== "CANCELLED").length,
      pendingCount: pendingAppts.length,
      completedCount: completedAppts.length,
      cancelledCount: cancelledAppts.length,
      totalCustomers: customerCount[0]?.value ?? 0,
      newCustomersMonth: newCustomersMonth[0]?.value ?? 0,
      activeServices: servicesList.filter((s) => s.isActive).length,
      activeStaff: staffList.filter((s) => s.isActive).length,
      totalRevenue,
      monthRevenue,
      avgPerDay: daysPassed > 0 ? Math.round(monthAppts.length / daysPassed) : 0,
    },
    staffPerformance,
    popularServices,
    recentAppointments: recentEnriched,
  };
}

export async function getPaymentData(businessId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [business, rows] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { currency: true },
    }),
    db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        paymentAmount: appointments.paymentAmount,
        paymentStatus: appointments.paymentStatus,
        status: appointments.status,
        customerId: appointments.customerId,
        serviceId: appointments.serviceId,
        staffId: appointments.staffId,
        serviceTitle: services.title,
        staffName: staffMembers.name,
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
      .where(
        and(
          eq(appointments.businessId, businessId),
          ne(appointments.status, "CANCELLED")
        )
      )
      .orderBy(desc(appointments.startTime)),
  ]);

  const currency = business?.currency ?? "ILS";

  const paidRows = rows.filter(
    (r) => r.paymentAmount && parseFloat(r.paymentAmount) > 0
  );

  const totalRevenue = paidRows.reduce(
    (s, r) => s + parseFloat(r.paymentAmount!),
    0
  );

  const monthRows = paidRows.filter(
    (r) => r.startTime >= monthStart && r.startTime <= monthEnd
  );
  const monthRevenue = monthRows.reduce(
    (s, r) => s + parseFloat(r.paymentAmount!),
    0
  );

  const avgPerAppointment =
    paidRows.length > 0 ? totalRevenue / paidRows.length : 0;

  const customerMap = new Map<string, string>();
  const customerIds = [...new Set(rows.map((r) => r.customerId))];
  if (customerIds.length > 0) {
    const custRows = await db
      .select({ id: customers.id, name: users.name })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .where(eq(customers.businessId, businessId));
    for (const c of custRows) {
      customerMap.set(c.id, c.name ?? "—");
    }
  }

  const transactions = rows
    .filter((r) => r.paymentAmount && parseFloat(r.paymentAmount) > 0)
    .map((r) => ({
      id: r.id,
      date: r.startTime.toISOString(),
      serviceTitle: r.serviceTitle ?? "—",
      staffName: r.staffName ?? "—",
      customerName: customerMap.get(r.customerId) ?? "—",
      amount: r.paymentAmount!,
      paymentStatus: r.paymentStatus,
    }));

  return {
    currency,
    totalRevenue,
    monthRevenue,
    avgPerAppointment,
    transactions,
  };
}
