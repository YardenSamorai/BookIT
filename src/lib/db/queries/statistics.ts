import { eq, and, gte, lte, ne, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  services,
  staffMembers,
  customers,
  businesses,
  users,
  reviews,
} from "@/lib/db/schema";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getStatisticsData(businessId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    business,
    allAppointments,
    servicesList,
    staffList,
    customerRows,
    reviewRows,
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
        endTime: appointments.endTime,
        paymentAmount: appointments.paymentAmount,
        source: appointments.source,
        customerId: appointments.customerId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.startTime, sixMonthsAgo)
        )
      ),
    db
      .select({
        id: services.id,
        title: services.title,
        isActive: services.isActive,
        price: services.price,
        durationMinutes: services.durationMinutes,
      })
      .from(services)
      .where(eq(services.businessId, businessId)),
    db
      .select({
        id: staffMembers.id,
        name: staffMembers.name,
        isActive: staffMembers.isActive,
      })
      .from(staffMembers)
      .where(eq(staffMembers.businessId, businessId)),
    db
      .select({
        id: customers.id,
        createdAt: customers.createdAt,
        cancellationCount: customers.cancellationCount,
        noShowCount: customers.noShowCount,
      })
      .from(customers)
      .where(eq(customers.businessId, businessId)),
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.businessId, businessId)),
  ]);

  const currency = business?.currency ?? "ILS";
  const nonCancelled = allAppointments.filter((a) => a.status !== "CANCELLED");

  // ── 1. Revenue by month (last 6 months) ──
  const revenueByMonth: { month: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const ms = startOfMonth(d).getTime();
    const me = endOfMonth(d).getTime();
    const monthApts = nonCancelled.filter(
      (a) => a.startTime.getTime() >= ms && a.startTime.getTime() <= me
    );
    const revenue = monthApts.reduce(
      (s, a) => s + (a.paymentAmount ? parseFloat(a.paymentAmount) : 0),
      0
    );
    revenueByMonth.push({ month: key, revenue, count: monthApts.length });
  }

  // ── 2. Appointments per day (last 30 days) ──
  const appointmentsByDay: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = localDateStr(d);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 86400000 - 1;
    const count = nonCancelled.filter(
      (a) => a.startTime.getTime() >= dayStart && a.startTime.getTime() <= dayEnd
    ).length;
    appointmentsByDay.push({ date: key, count });
  }

  // ── 3. Status breakdown ──
  const statusBreakdown = {
    confirmed: allAppointments.filter((a) => a.status === "CONFIRMED").length,
    completed: allAppointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: allAppointments.filter((a) => a.status === "CANCELLED").length,
    pending: allAppointments.filter((a) => a.status === "PENDING").length,
    noShow: allAppointments.filter((a) => a.status === "NO_SHOW").length,
  };

  // ── 4. Top services by revenue & count ──
  const svcMap = new Map(servicesList.map((s) => [s.id, s]));
  const svcStats = new Map<string, { count: number; revenue: number }>();
  for (const a of nonCancelled) {
    const curr = svcStats.get(a.serviceId) ?? { count: 0, revenue: 0 };
    curr.count++;
    if (a.paymentAmount) curr.revenue += parseFloat(a.paymentAmount);
    svcStats.set(a.serviceId, curr);
  }
  const topServices = servicesList
    .map((s) => ({
      id: s.id,
      title: s.title,
      count: svcStats.get(s.id)?.count ?? 0,
      revenue: svcStats.get(s.id)?.revenue ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ── 5. Staff performance ──
  const staffStats = new Map<string, { count: number; revenue: number; hours: number }>();
  for (const a of nonCancelled) {
    const curr = staffStats.get(a.staffId) ?? { count: 0, revenue: 0, hours: 0 };
    curr.count++;
    if (a.paymentAmount) curr.revenue += parseFloat(a.paymentAmount);
    const durationMs = new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
    curr.hours += durationMs / 3600000;
    staffStats.set(a.staffId, curr);
  }
  const staffPerformance = staffList
    .filter((s) => s.isActive)
    .map((s) => ({
      name: s.name,
      count: staffStats.get(s.id)?.count ?? 0,
      revenue: staffStats.get(s.id)?.revenue ?? 0,
      hours: Math.round((staffStats.get(s.id)?.hours ?? 0) * 10) / 10,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── 6. Busiest day of week ──
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const a of nonCancelled) {
    dayOfWeekCounts[a.startTime.getDay()]++;
  }

  // ── 7. Busiest hours ──
  const hourCounts = new Array(24).fill(0) as number[];
  for (const a of nonCancelled) {
    hourCounts[a.startTime.getHours()]++;
  }

  // ── 8. Source breakdown ──
  const sourceBreakdown = {
    online: allAppointments.filter((a) => a.source === "ONLINE").length,
    dashboard: allAppointments.filter((a) => a.source === "DASHBOARD").length,
    walkIn: allAppointments.filter((a) => a.source === "WALK_IN").length,
  };

  // ── 9. Customer growth (last 6 months) ──
  const customerGrowth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const ms = startOfMonth(d).getTime();
    const me = endOfMonth(d).getTime();
    const count = customerRows.filter(
      (c) => c.createdAt.getTime() >= ms && c.createdAt.getTime() <= me
    ).length;
    customerGrowth.push({ month: key, count });
  }

  // ── 10. Review stats ──
  const avgRating =
    reviewRows.length > 0
      ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
      : 0;
  const ratingDist = [0, 0, 0, 0, 0];
  for (const r of reviewRows) {
    if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++;
  }

  // ── 11. KPIs ──
  const thisMonthApts = nonCancelled.filter(
    (a) => a.startTime.getTime() >= monthStart.getTime() && a.startTime.getTime() <= monthEnd.getTime()
  );
  const thisMonthRevenue = thisMonthApts.reduce(
    (s, a) => s + (a.paymentAmount ? parseFloat(a.paymentAmount) : 0),
    0
  );
  const totalRevenue = nonCancelled.reduce(
    (s, a) => s + (a.paymentAmount ? parseFloat(a.paymentAmount) : 0),
    0
  );
  const cancellationRate =
    allAppointments.length > 0
      ? Math.round((statusBreakdown.cancelled / allAppointments.length) * 100)
      : 0;
  const newCustomersThisMonth = customerRows.filter(
    (c) => c.createdAt.getTime() >= monthStart.getTime() && c.createdAt.getTime() <= monthEnd.getTime()
  ).length;

  return {
    currency,
    kpis: {
      totalAppointments: nonCancelled.length,
      thisMonthAppointments: thisMonthApts.length,
      totalRevenue,
      thisMonthRevenue,
      totalCustomers: customerRows.length,
      newCustomersThisMonth,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviewRows.length,
      cancellationRate,
    },
    revenueByMonth,
    appointmentsByDay,
    statusBreakdown,
    topServices,
    staffPerformance,
    dayOfWeekCounts,
    hourCounts,
    sourceBreakdown,
    customerGrowth,
    ratingDist,
  };
}
