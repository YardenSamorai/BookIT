import { eq, and, gte, ne, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  services,
  staffMembers,
  staffSchedules,
  customers,
  businesses,
  businessHours,
  classInstances,
  classSchedules,
  users,
} from "@/lib/db/schema";

// ── Subdomain types ──

export interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  currency: string;
  timezone: string;
  locale: "en" | "he";
}

export interface HourSlotStats {
  day: number;
  hour: number;
  bookingCount: number;
  availableStaffCount: number;
  utilizationPct: number;
}

export interface AppointmentMetrics {
  totalCount: number;
  currentPeriodCount: number;
  previousPeriodCount: number;
  dayOfWeekCounts: number[];
  prevDayOfWeekCounts: number[];
  hourCounts: number[];
  slotGrid: HourSlotStats[];
  sourceBreakdown: { online: number; dashboard: number; walkIn: number };
  avgLeadTimeDays: number;
}

export interface StaffMemberMetrics {
  id: string;
  name: string;
  isActive: boolean;
  utilizationPct: number;
  bookedMinutes: number;
  availableMinutes: number;
  appointmentCount: number;
  revenue: number;
  dayBreakdown: number[];
}

export interface StaffMetrics {
  members: StaffMemberMetrics[];
}

export interface ServiceItemMetrics {
  id: string;
  title: string;
  isGroup: boolean;
  durationMinutes: number;
  price: number;
  currentPeriodCount: number;
  previousPeriodCount: number;
  revenue: number;
  revenuePerHour: number;
  pctOfTotal: number;
}

export interface ServiceMetrics {
  services: ServiceItemMetrics[];
}

export interface CancellationMetrics {
  totalCancelled: number;
  cancellationRate: number;
  byDay: number[];
  byHour: number[];
  byService: Array<{ serviceId: string; title: string; count: number; rate: number }>;
  byStaff: Array<{ staffId: string; name: string; count: number; rate: number }>;
  byCancelledBy: { customer: number; business: number; unknown: number };
  revenueLost: number;
  serialCancellers: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers30d: number;
  segments: {
    vip: number;
    regular: number;
    atRisk: number;
    churned: number;
    newRecent: number;
  };
  returnRate30d: number;
  avgVisitFrequencyDays: number;
  vipAtRisk: Array<{ name: string; lastVisit: string; totalSpend: number }>;
}

export interface ClassScheduleMetrics {
  id: string;
  title: string;
  maxParticipants: number;
  instanceCount: number;
  avgFillPct: number;
  fillTrend: "up" | "down" | "flat";
}

export interface ClassMetrics {
  schedules: ClassScheduleMetrics[];
}

export interface RevenueMetrics {
  currentPeriod: number;
  previousPeriod: number;
  growthPct: number;
  avgPerAppointment: number;
  paidVsUnpaid: { paid: number; unpaid: number };
  revenueByDayOfWeek: number[];
  concentrationTop2Pct: number;
}

export interface BusinessContext {
  profile: BusinessProfile;
  appointments: AppointmentMetrics;
  staff: StaffMetrics;
  services: ServiceMetrics;
  cancellations: CancellationMetrics;
  customers: CustomerMetrics;
  classes: ClassMetrics;
  revenue: RevenueMetrics;
  collectedAt: string;
  observationWindowDays: number;
}

// ── Day names (for analyzers / prompt builder) ──

export const DAY_NAMES_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
export const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Cache (5-minute TTL per business) ──

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: BusinessContext; expiresAt: number }>();

// ── Collector ──

export async function getBusinessContext(businessId: string): Promise<BusinessContext> {
  const cached = cache.get(businessId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const WEEKS = 8;

  const [
    business,
    allAppts,
    serviceList,
    staffList,
    scheduleRows,
    bizHours,
    customerRows,
    classInstanceRows,
  ] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { id: true, name: true, type: true, currency: true, timezone: true, language: true },
    }),
    db
      .select({
        id: appointments.id,
        staffId: appointments.staffId,
        serviceId: appointments.serviceId,
        customerId: appointments.customerId,
        classInstanceId: appointments.classInstanceId,
        status: appointments.status,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        paymentAmount: appointments.paymentAmount,
        paymentStatus: appointments.paymentStatus,
        source: appointments.source,
        cancelledBy: appointments.cancelledBy,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .where(and(eq(appointments.businessId, businessId), gte(appointments.startTime, sixtyDaysAgo))),
    db
      .select({
        id: services.id,
        title: services.title,
        durationMinutes: services.durationMinutes,
        price: services.price,
        isGroup: services.isGroup,
        isActive: services.isActive,
      })
      .from(services)
      .where(eq(services.businessId, businessId)),
    db
      .select({ id: staffMembers.id, name: staffMembers.name, isActive: staffMembers.isActive })
      .from(staffMembers)
      .where(eq(staffMembers.businessId, businessId)),
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
      .where(eq(staffMembers.businessId, businessId)),
    db
      .select({ dayOfWeek: businessHours.dayOfWeek, startTime: businessHours.startTime, endTime: businessHours.endTime, isOpen: businessHours.isOpen })
      .from(businessHours)
      .where(eq(businessHours.businessId, businessId)),
    db
      .select({
        id: customers.id,
        userId: customers.userId,
        cancellationCount: customers.cancellationCount,
        noShowCount: customers.noShowCount,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.businessId, businessId)),
    db
      .select({
        id: classInstances.id,
        maxParticipants: classInstances.maxParticipants,
        status: classInstances.status,
        scheduleId: classInstances.classScheduleId,
        date: classInstances.date,
      })
      .from(classInstances)
      .where(and(eq(classInstances.businessId, businessId), gte(classInstances.date, sixtyDaysAgo.toISOString().slice(0, 10)))),
  ]);

  const nonCancelled = allAppts.filter((a) => a.status !== "CANCELLED");
  const cancelled = allAppts.filter((a) => a.status === "CANCELLED");
  const current = nonCancelled.filter((a) => a.startTime >= thirtyDaysAgo);
  const previous = nonCancelled.filter((a) => a.startTime < thirtyDaysAgo);

  // ── Profile ──
  const profile: BusinessProfile = {
    id: businessId,
    name: business?.name ?? "",
    type: business?.type ?? "GENERIC",
    currency: business?.currency ?? "ILS",
    timezone: business?.timezone ?? "Asia/Jerusalem",
    locale: (business?.language === "en" ? "en" : "he") as "en" | "he",
  };

  // ── Appointment metrics ──
  const dayOfWeekCounts = new Array(7).fill(0) as number[];
  const prevDayOfWeekCounts = new Array(7).fill(0) as number[];
  const hourCounts = new Array(24).fill(0) as number[];
  for (const a of current) {
    dayOfWeekCounts[a.startTime.getDay()]++;
    hourCounts[a.startTime.getHours()]++;
  }
  for (const a of previous) {
    prevDayOfWeekCounts[a.startTime.getDay()]++;
  }

  const sourceBreakdown = { online: 0, dashboard: 0, walkIn: 0 };
  for (const a of current) {
    if (a.source === "ONLINE") sourceBreakdown.online++;
    else if (a.source === "DASHBOARD") sourceBreakdown.dashboard++;
    else if (a.source === "WALK_IN") sourceBreakdown.walkIn++;
  }

  let totalLeadMs = 0;
  let leadCount = 0;
  for (const a of current) {
    const lead = a.startTime.getTime() - a.createdAt.getTime();
    if (lead > 0) { totalLeadMs += lead; leadCount++; }
  }
  const avgLeadTimeDays = leadCount > 0 ? Math.round((totalLeadMs / leadCount / 86400000) * 10) / 10 : 0;

  // Slot grid: day x hour with booking count + available staff
  const openHoursByDay = new Map<number, { start: number; end: number }>();
  for (const bh of bizHours) {
    if (bh.isOpen && bh.startTime && bh.endTime) {
      const [sh] = bh.startTime.split(":").map(Number);
      const [eh] = bh.endTime.split(":").map(Number);
      openHoursByDay.set(bh.dayOfWeek, { start: sh, end: eh });
    }
  }

  const staffScheduleByDay = new Map<number, number>();
  for (const s of scheduleRows) {
    if (!s.isActive) continue;
    const activeStaff = staffList.find((m) => m.id === s.staffId);
    if (!activeStaff?.isActive) continue;
    staffScheduleByDay.set(s.dayOfWeek, (staffScheduleByDay.get(s.dayOfWeek) ?? 0) + 1);
  }

  const bookingGrid = new Map<string, number>();
  for (const a of current) {
    const key = `${a.startTime.getDay()}-${a.startTime.getHours()}`;
    bookingGrid.set(key, (bookingGrid.get(key) ?? 0) + 1);
  }

  const slotGrid: HourSlotStats[] = [];
  for (let day = 0; day < 7; day++) {
    const hours = openHoursByDay.get(day);
    if (!hours) continue;
    const staffCount = staffScheduleByDay.get(day) ?? 0;
    for (let h = hours.start; h < hours.end; h++) {
      const key = `${day}-${h}`;
      const bCount = bookingGrid.get(key) ?? 0;
      const weeksInPeriod = 4;
      const availPerWeek = staffCount;
      const totalAvail = availPerWeek * weeksInPeriod;
      slotGrid.push({
        day, hour: h,
        bookingCount: bCount,
        availableStaffCount: staffCount,
        utilizationPct: totalAvail > 0 ? Math.round((bCount / totalAvail) * 100) : 0,
      });
    }
  }

  const appointmentMetrics: AppointmentMetrics = {
    totalCount: nonCancelled.length,
    currentPeriodCount: current.length,
    previousPeriodCount: previous.length,
    dayOfWeekCounts,
    prevDayOfWeekCounts,
    hourCounts,
    slotGrid,
    sourceBreakdown,
    avgLeadTimeDays,
  };

  // ── Staff metrics ──
  const staffBookedMin = new Map<string, number>();
  const staffRevenue = new Map<string, number>();
  const staffApptCount = new Map<string, number>();
  const staffDayBreakdown = new Map<string, number[]>();
  for (const a of current) {
    const dur = (a.endTime.getTime() - a.startTime.getTime()) / 60000;
    staffBookedMin.set(a.staffId, (staffBookedMin.get(a.staffId) ?? 0) + dur);
    staffApptCount.set(a.staffId, (staffApptCount.get(a.staffId) ?? 0) + 1);
    if (a.paymentAmount) {
      staffRevenue.set(a.staffId, (staffRevenue.get(a.staffId) ?? 0) + parseFloat(a.paymentAmount));
    }
    let bd = staffDayBreakdown.get(a.staffId);
    if (!bd) { bd = new Array(7).fill(0) as number[]; staffDayBreakdown.set(a.staffId, bd); }
    bd[a.startTime.getDay()]++;
  }

  const staffAvailMin = new Map<string, number>();
  for (const s of staffList.filter((s) => s.isActive)) {
    let totalMin = 0;
    for (const sch of scheduleRows.filter((r) => r.staffId === s.id && r.isActive)) {
      if (!sch.startTime || !sch.endTime) continue;
      const [sh, sm] = sch.startTime.split(":").map(Number);
      const [eh, em] = sch.endTime.split(":").map(Number);
      totalMin += ((eh * 60 + em) - (sh * 60 + sm)) * 4;
    }
    staffAvailMin.set(s.id, totalMin);
  }

  const staffMetrics: StaffMetrics = {
    members: staffList.map((s) => {
      const booked = staffBookedMin.get(s.id) ?? 0;
      const avail = staffAvailMin.get(s.id) ?? 1;
      return {
        id: s.id,
        name: s.name,
        isActive: s.isActive,
        bookedMinutes: Math.round(booked),
        availableMinutes: Math.round(avail),
        utilizationPct: avail > 0 ? Math.round((booked / avail) * 100) : 0,
        appointmentCount: staffApptCount.get(s.id) ?? 0,
        revenue: Math.round(staffRevenue.get(s.id) ?? 0),
        dayBreakdown: staffDayBreakdown.get(s.id) ?? new Array(7).fill(0),
      };
    }),
  };

  // ── Service metrics ──
  const svcCurrent = new Map<string, { count: number; revenue: number }>();
  const svcPrevious = new Map<string, number>();
  for (const a of current) {
    const cur = svcCurrent.get(a.serviceId) ?? { count: 0, revenue: 0 };
    cur.count++;
    if (a.paymentAmount) cur.revenue += parseFloat(a.paymentAmount);
    svcCurrent.set(a.serviceId, cur);
  }
  for (const a of previous) {
    svcPrevious.set(a.serviceId, (svcPrevious.get(a.serviceId) ?? 0) + 1);
  }
  const totalCurrent = current.length || 1;

  const serviceMetrics: ServiceMetrics = {
    services: serviceList.filter((s) => s.isActive).map((s) => {
      const st = svcCurrent.get(s.id) ?? { count: 0, revenue: 0 };
      const hrs = (s.durationMinutes * st.count) / 60 || 1;
      return {
        id: s.id,
        title: s.title,
        isGroup: s.isGroup,
        durationMinutes: s.durationMinutes,
        price: s.price ? parseFloat(s.price) : 0,
        currentPeriodCount: st.count,
        previousPeriodCount: svcPrevious.get(s.id) ?? 0,
        revenue: Math.round(st.revenue),
        revenuePerHour: Math.round(st.revenue / hrs),
        pctOfTotal: Math.round((st.count / totalCurrent) * 100),
      };
    }).sort((a, b) => b.revenue - a.revenue),
  };

  // ── Cancellation metrics ──
  const cancelByDay = new Array(7).fill(0) as number[];
  const cancelByHour = new Array(24).fill(0) as number[];
  const cancelBySvc = new Map<string, number>();
  const cancelByStaff = new Map<string, number>();
  const cancelByActor = { customer: 0, business: 0, unknown: 0 };
  let revenueLost = 0;
  for (const a of cancelled) {
    cancelByDay[a.startTime.getDay()]++;
    cancelByHour[a.startTime.getHours()]++;
    cancelBySvc.set(a.serviceId, (cancelBySvc.get(a.serviceId) ?? 0) + 1);
    cancelByStaff.set(a.staffId, (cancelByStaff.get(a.staffId) ?? 0) + 1);
    if (a.cancelledBy === "CUSTOMER") cancelByActor.customer++;
    else if (a.cancelledBy === "BUSINESS") cancelByActor.business++;
    else cancelByActor.unknown++;
    if (a.paymentAmount) revenueLost += parseFloat(a.paymentAmount);
  }

  const svcMap = new Map(serviceList.map((s) => [s.id, s.title]));
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]));
  const totalWithCancelled = allAppts.length || 1;

  const cancelBySvcArr: CancellationMetrics["byService"] = [];
  for (const [svcId, cnt] of cancelBySvc) {
    const totalForSvc = allAppts.filter((a) => a.serviceId === svcId).length || 1;
    cancelBySvcArr.push({ serviceId: svcId, title: svcMap.get(svcId) ?? "—", count: cnt, rate: Math.round((cnt / totalForSvc) * 100) });
  }
  const cancelByStaffArr: CancellationMetrics["byStaff"] = [];
  for (const [sid, cnt] of cancelByStaff) {
    const totalForStaff = allAppts.filter((a) => a.staffId === sid).length || 1;
    cancelByStaffArr.push({ staffId: sid, name: staffMap.get(sid) ?? "—", count: cnt, rate: Math.round((cnt / totalForStaff) * 100) });
  }

  const serialCancellers = customerRows.filter((c) => c.cancellationCount > 3).length;

  const cancellationMetrics: CancellationMetrics = {
    totalCancelled: cancelled.length,
    cancellationRate: Math.round((cancelled.length / totalWithCancelled) * 100),
    byDay: cancelByDay,
    byHour: cancelByHour,
    byService: cancelBySvcArr.sort((a, b) => b.count - a.count),
    byStaff: cancelByStaffArr.sort((a, b) => b.count - a.count),
    byCancelledBy: cancelByActor,
    revenueLost: Math.round(revenueLost),
    serialCancellers,
  };

  // ── Customer metrics ──
  const custAppts = new Map<string, { count: number; spend: number; lastVisit: Date | null; firstVisit: Date | null }>();
  for (const a of nonCancelled) {
    const c = custAppts.get(a.customerId) ?? { count: 0, spend: 0, lastVisit: null, firstVisit: null };
    c.count++;
    if (a.paymentAmount) c.spend += parseFloat(a.paymentAmount);
    if (!c.lastVisit || a.startTime > c.lastVisit) c.lastVisit = a.startTime;
    if (!c.firstVisit || a.startTime < c.firstVisit) c.firstVisit = a.startTime;
    custAppts.set(a.customerId, c);
  }

  const spends = [...custAppts.values()].map((c) => c.spend).sort((a, b) => b - a);
  const vipThreshold = spends.length >= 5 ? spends[Math.floor(spends.length * 0.2)] : Infinity;

  let vipCount = 0, regularCount = 0, atRiskCount = 0, churnedCount = 0, newRecentCount = 0;
  let returnCount = 0, visitGapSum = 0, visitGapN = 0;
  const vipAtRisk: CustomerMetrics["vipAtRisk"] = [];

  // Load user names for customer display
  const custIdToName = new Map<string, string>();
  if (customerRows.length > 0) {
    const userIds = [...new Set(customerRows.map((c) => c.userId))];
    if (userIds.length > 0) {
      const uRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, userIds));
      for (const u of uRows) {
        custIdToName.set(u.id, u.name ?? "");
      }
    }
  }
  const custIdToUserId = new Map(customerRows.map((c) => [c.id, c.userId]));

  for (const [custId, data] of custAppts) {
    const isVip = data.spend >= vipThreshold && data.count >= 3;
    const lastVisitAge = data.lastVisit ? (now.getTime() - data.lastVisit.getTime()) / 86400000 : 999;
    const isNew = data.firstVisit && data.firstVisit >= thirtyDaysAgo;

    if (isNew && data.count === 1) {
      newRecentCount++;
    } else if (isVip && lastVisitAge > 30) {
      atRiskCount++;
      if (vipAtRisk.length < 5 && data.lastVisit) {
        const userId = custIdToUserId.get(custId);
        const name = (userId && custIdToName.get(userId)) || "Customer";
        vipAtRisk.push({ name, lastVisit: data.lastVisit.toISOString().slice(0, 10), totalSpend: Math.round(data.spend) });
      }
      vipCount++;
    } else if (isVip) {
      vipCount++;
    } else if (data.count >= 2 && lastVisitAge <= 60) {
      regularCount++;
    } else if (data.count >= 2 && lastVisitAge > 60) {
      churnedCount++;
    }

    if (data.count >= 2) returnCount++;
    if (data.count >= 2 && data.firstVisit && data.lastVisit) {
      const span = (data.lastVisit.getTime() - data.firstVisit.getTime()) / 86400000;
      if (span > 0) { visitGapSum += span / (data.count - 1); visitGapN++; }
    }
  }

  const customerMetrics: CustomerMetrics = {
    totalCustomers: customerRows.length,
    newCustomers30d: customerRows.filter((c) => c.createdAt >= thirtyDaysAgo).length,
    segments: { vip: vipCount, regular: regularCount, atRisk: atRiskCount, churned: churnedCount, newRecent: newRecentCount },
    returnRate30d: custAppts.size > 0 ? Math.round((returnCount / custAppts.size) * 100) : 0,
    avgVisitFrequencyDays: visitGapN > 0 ? Math.round(visitGapSum / visitGapN) : 0,
    vipAtRisk,
  };

  // ── Class metrics ──
  const classBookingCounts = new Map<string, number>();
  for (const a of nonCancelled) {
    if (a.classInstanceId) {
      classBookingCounts.set(a.classInstanceId, (classBookingCounts.get(a.classInstanceId) ?? 0) + 1);
    }
  }

  const schedFill = new Map<string, { instances: Array<{ booked: number; max: number; date: string }> }>();
  for (const ci of classInstanceRows) {
    if (ci.status === "CANCELLED") continue;
    const data = schedFill.get(ci.scheduleId) ?? { instances: [] };
    data.instances.push({
      booked: classBookingCounts.get(ci.id) ?? 0,
      max: ci.maxParticipants,
      date: ci.date,
    });
    schedFill.set(ci.scheduleId, data);
  }

  let classScheduleNames = new Map<string, string>();
  if (schedFill.size > 0) {
    const schRows = await db
      .select({ id: classSchedules.id, title: classSchedules.title })
      .from(classSchedules)
      .where(eq(classSchedules.businessId, businessId));
    classScheduleNames = new Map(schRows.map((r) => [r.id, r.title ?? "Class"]));
  }

  const classMetricsSchedules: ClassScheduleMetrics[] = [];
  for (const [schedId, data] of schedFill) {
    const fills = data.instances.map((i) => (i.max > 0 ? i.booked / i.max : 0));
    const avgFill = fills.length > 0 ? fills.reduce((s, v) => s + v, 0) / fills.length : 0;

    // Trend: compare first half vs second half of instances by date
    const sorted = [...data.instances].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    let fillTrend: "up" | "down" | "flat" = "flat";
    if (sorted.length >= 4) {
      const firstHalf = sorted.slice(0, mid).reduce((s, i) => s + (i.max > 0 ? i.booked / i.max : 0), 0) / mid;
      const secondHalf = sorted.slice(mid).reduce((s, i) => s + (i.max > 0 ? i.booked / i.max : 0), 0) / (sorted.length - mid);
      if (secondHalf > firstHalf + 0.1) fillTrend = "up";
      else if (secondHalf < firstHalf - 0.1) fillTrend = "down";
    }

    classMetricsSchedules.push({
      id: schedId,
      title: classScheduleNames.get(schedId) ?? "Class",
      maxParticipants: data.instances[0]?.max ?? 0,
      instanceCount: data.instances.length,
      avgFillPct: Math.round(avgFill * 100),
      fillTrend,
    });
  }

  const classMetrics: ClassMetrics = { schedules: classMetricsSchedules };

  // ── Revenue metrics ──
  let revCurrent = 0, revPrevious = 0;
  let paidCount = 0, unpaidCount = 0;
  const revByDay = new Array(7).fill(0) as number[];
  for (const a of current) {
    if (a.paymentAmount) {
      const amt = parseFloat(a.paymentAmount);
      revCurrent += amt;
      revByDay[a.startTime.getDay()] += amt;
      if (a.paymentStatus === "PAID") paidCount++; else unpaidCount++;
    } else {
      unpaidCount++;
    }
  }
  for (const a of previous) {
    if (a.paymentAmount) revPrevious += parseFloat(a.paymentAmount);
  }

  const svcRevenues = serviceMetrics.services.map((s) => s.revenue).sort((a, b) => b - a);
  const totalRev = revCurrent || 1;
  const top2Rev = (svcRevenues[0] ?? 0) + (svcRevenues[1] ?? 0);

  const revenueMetrics: RevenueMetrics = {
    currentPeriod: Math.round(revCurrent),
    previousPeriod: Math.round(revPrevious),
    growthPct: revPrevious > 0 ? Math.round(((revCurrent - revPrevious) / revPrevious) * 100) : 0,
    avgPerAppointment: current.length > 0 ? Math.round(revCurrent / current.length) : 0,
    paidVsUnpaid: { paid: paidCount, unpaid: unpaidCount },
    revenueByDayOfWeek: revByDay.map((v) => Math.round(v)),
    concentrationTop2Pct: Math.round((top2Rev / totalRev) * 100),
  };

  const result: BusinessContext = {
    profile,
    appointments: appointmentMetrics,
    staff: staffMetrics,
    services: serviceMetrics,
    cancellations: cancellationMetrics,
    customers: customerMetrics,
    classes: classMetrics,
    revenue: revenueMetrics,
    collectedAt: now.toISOString(),
    observationWindowDays: 60,
  };

  cache.set(businessId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

  return result;
}
