import type { BusinessContext } from "./business-context";
import { DAY_NAMES_HE, DAY_NAMES_EN } from "./business-context";
import type { AnalysisResult } from "./types";

export function buildSystemPrompt(
  ctx: BusinessContext,
  insights: AnalysisResult[],
): string {
  const isHe = ctx.profile.locale === "he";
  const dayNames = isHe ? DAY_NAMES_HE : DAY_NAMES_EN;
  const cs = ctx.profile.currency === "ILS" ? "₪" : ctx.profile.currency;

  const lang = isHe
    ? "Respond ONLY in Hebrew. Use natural Hebrew with proper grammar."
    : "Respond in English.";

  // ── Serialized business context ──

  const staffSection = ctx.staff.members
    .filter((s) => s.isActive)
    .map((s) => `- ${s.name}: ${s.utilizationPct}% utilization, ${s.appointmentCount} appts, ${cs}${s.revenue} revenue`)
    .join("\n") || "No staff data";

  const servicesSection = ctx.services.services
    .slice(0, 10)
    .map((s) => `- ${s.title}: ${s.currentPeriodCount} bookings (${s.pctOfTotal}%), ${cs}${s.revenue} rev, ${cs}${s.revenuePerHour}/hr${s.isGroup ? " [GROUP]" : ""}`)
    .join("\n") || "No service data";

  const dayBreakdown = ctx.appointments.dayOfWeekCounts
    .map((c, i) => `${dayNames[i]}: ${c}`)
    .join(", ");

  const peakHours = ctx.appointments.hourCounts
    .map((c, h) => ({ h, c }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, 5)
    .map((x) => `${String(x.h).padStart(2, "0")}:00 (${x.c})`)
    .join(", ") || "No data";

  const emptyWindows = ctx.appointments.slotGrid
    .filter((s) => s.utilizationPct < 25 && s.availableStaffCount > 0)
    .slice(0, 6)
    .map((s) => `${dayNames[s.day]} ${String(s.hour).padStart(2, "0")}:00 (${s.utilizationPct}%)`)
    .join(", ") || "None detected";

  const cancelByDay = ctx.cancellations.byDay
    .map((c, i) => `${dayNames[i]}: ${c}`)
    .join(", ");

  const avgPerDay = ctx.appointments.currentPeriodCount > 0
    ? Math.round(ctx.appointments.currentPeriodCount / 30)
    : 0;

  const classSection = ctx.classes.schedules.length > 0
    ? ctx.classes.schedules.map((c) => `- ${c.title}: ${c.instanceCount} sessions, max ${c.maxParticipants}, ${c.avgFillPct}% avg fill (${c.fillTrend})`).join("\n")
    : "No class data";

  // ── Pre-analyzed insights section ──

  const insightsSection = insights.length > 0
    ? insights.map((ins, i) => {
        const conf = Math.round(ins.confidenceScore * 100);
        const impact = ins.estimatedRevenueImpact != null ? ` | Impact: ${cs}${ins.estimatedRevenueImpact}` : "";
        return `${i + 1}. [${ins.severity.toUpperCase()}] ${ins.title} (confidence: ${conf}%${impact})\n   Evidence: ${ins.evidence}\n   Recommendation: ${ins.recommendation}`;
      }).join("\n\n")
    : "No insights generated -- insufficient data.";

  return `You are a business consultant for "${ctx.profile.name}", a ${ctx.profile.type.toLowerCase()} business.

${lang}

## Your Knowledge (verified data, do not fabricate):

### Business Overview
- Currency: ${cs}
- Total customers: ${ctx.customers.totalCustomers} (${ctx.customers.newCustomers30d} new in last 30 days)
- Last 30 days: ${ctx.appointments.currentPeriodCount} appointments, ${cs}${ctx.revenue.currentPeriod} revenue
- Previous 30 days: ${ctx.appointments.previousPeriodCount} appointments, ${cs}${ctx.revenue.previousPeriod} revenue
- Revenue growth: ${ctx.revenue.growthPct}%
- Average: ${avgPerDay} appointments/day
- Cancellation rate: ${ctx.cancellations.cancellationRate}% (${ctx.cancellations.totalCancelled} cancellations, ${cs}${ctx.cancellations.revenueLost} lost)
- Avg booking lead time: ${ctx.appointments.avgLeadTimeDays} days

### Customer Segments
- VIP: ${ctx.customers.segments.vip} | Regular: ${ctx.customers.segments.regular} | At-risk: ${ctx.customers.segments.atRisk} | Churned: ${ctx.customers.segments.churned} | New: ${ctx.customers.segments.newRecent}
- Return rate: ${ctx.customers.returnRate30d}%
- Avg visit frequency: every ${ctx.customers.avgVisitFrequencyDays} days

### Staff Performance (last 30 days)
${staffSection}

### Services (last 30 days)
${servicesSection}

### Schedule Patterns
- Bookings by day: ${dayBreakdown}
- Top hours: ${peakHours}
- Empty windows: ${emptyWindows}
- Cancellations by day: ${cancelByDay}

### Classes
${classSection}

### Revenue
- Revenue per appointment: ${cs}${ctx.revenue.avgPerAppointment}
- Top 2 services concentration: ${ctx.revenue.concentrationTop2Pct}%
- Paid/Unpaid: ${ctx.revenue.paidVsUnpaid.paid}/${ctx.revenue.paidVsUnpaid.unpaid}

## Pre-analyzed Insights:

${insightsSection}

## Instructions:
- When the user asks about scheduling, reference the dead hours and schedule data above.
- When asked about revenue, reference RPH and service data.
- When asked about customers, reference segment counts and return rates.
- When asked about cancellations, reference cancellation breakdowns and lost revenue.
- Always cite specific numbers from the data above. Never invent data.
- If the data does not support an answer, say so explicitly.
- The pre-analyzed insights above are your starting point -- you can elaborate, explain, or add context, but do not contradict the underlying data.
- Be concise, practical, and actionable. Use bullet points when listing multiple items.
- Focus on answering: "What should the business owner do differently?"
`;
}
