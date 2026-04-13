import type { BusinessContext, HourSlotStats } from "../business-context";
import { DAY_NAMES_HE, DAY_NAMES_EN } from "../business-context";
import type { AnalysisResult, InsightSeverity, Locale } from "../types";
import { computeConfidence, computeEffectSize, toDataQuality } from "../confidence";

const MODULE = "dead_hours";
const EXPECTED_UTILIZATION = 0.60;
const MIN_MEANINGFUL_DELTA = 0.15;
const MAX_DELTA = 0.50;

// ── Phase 1: Detect ──

interface Candidate {
  slot: HourSlotStats;
  utilPct: number;
  staffAvailable: number;
  weeksObserved: number;
}

function detect(ctx: BusinessContext): Candidate[] {
  const { slotGrid } = ctx.appointments;
  const totalBookings = ctx.appointments.currentPeriodCount;
  const weeksInWindow = 4;

  // Hard gate: need enough data
  if (weeksInWindow < 3 || totalBookings < weeksInWindow * 2) return [];

  const candidates: Candidate[] = [];
  for (const slot of slotGrid) {
    if (slot.availableStaffCount === 0) continue;
    const util = slot.utilizationPct / 100;
    if (util < 0.25) {
      candidates.push({
        slot,
        utilPct: util,
        staffAvailable: slot.availableStaffCount,
        weeksObserved: weeksInWindow,
      });
    }
  }
  return candidates;
}

// ── Phase 2: Score ──

interface ScoredCandidate extends Candidate {
  confidence: number;
  effectSize: number;
  priority: number;
  severity: InsightSeverity;
  dataQuality: ReturnType<typeof toDataQuality>;
  revenueImpact?: number;
}

function score(candidates: Candidate[], ctx: BusinessContext): ScoredCandidate[] {
  const avgRevPerHour = ctx.revenue.currentPeriod /
    (ctx.staff.members.reduce((s, m) => s + m.bookedMinutes, 0) / 60 || 1);
  const weeksInWindow = 4;
  const isPartial = weeksInWindow < 4;

  const results: ScoredCandidate[] = [];
  for (const c of candidates) {
    const confidence = computeConfidence({
      sampleSize: c.slot.bookingCount + c.staffAvailable * weeksInWindow,
      minSampleRequired: 4,
      consistencyWeeks: weeksInWindow,
      totalWeeksObserved: weeksInWindow,
      recencyWeight: 0.8,
      dataCompleteness: isPartial ? 0.6 : 1,
    });

    const effectSize = computeEffectSize(
      c.utilPct, EXPECTED_UTILIZATION, MIN_MEANINGFUL_DELTA, MAX_DELTA,
    );

    if (effectSize === 0) continue;

    let cappedConfidence = confidence;
    const dq = toDataQuality(cappedConfidence);
    if (dq === "weak") cappedConfidence = Math.min(cappedConfidence, 0.45);

    const urgencyBonus = c.utilPct < 0.1 ? 10 : 0;
    const priority = Math.round(effectSize * 60 + cappedConfidence * 30 + urgencyBonus);

    const wastedHours = (1 - c.utilPct) * c.staffAvailable * weeksInWindow;
    const revenueImpact = Math.round(wastedHours * avgRevPerHour);

    results.push({
      ...c,
      confidence: cappedConfidence,
      effectSize,
      priority,
      severity: (c.utilPct < 0.1 ? "warning" : "opportunity") as InsightSeverity,
      dataQuality: dq,
      revenueImpact: revenueImpact > 0 ? revenueImpact : undefined,
    });
  }
  return results;
}

// ── Phase 3: Present ──

function present(scored: ScoredCandidate[], locale: Locale, ctx: BusinessContext): AnalysisResult[] {
  const dayNames = locale === "he" ? DAY_NAMES_HE : DAY_NAMES_EN;
  const currSymbol = ctx.profile.currency === "ILS" ? "₪" : ctx.profile.currency;

  return scored.map((c) => {
    const dayStr = dayNames[c.slot.day];
    const hourStr = `${String(c.slot.hour).padStart(2, "0")}:00`;
    const utilStr = `${Math.round(c.utilPct * 100)}%`;

    const title = locale === "he"
      ? `חלון זמן ריק - ${dayStr} ${hourStr}`
      : `Dead window - ${dayStr} ${hourStr}`;

    const summary = locale === "he"
      ? `יום ${dayStr} ב-${hourStr} עם תפוסה של ${utilStr} בלבד ב-4 השבועות האחרונים`
      : `${dayStr} at ${hourStr} has only ${utilStr} utilization over the last 4 weeks`;

    const evidence = locale === "he"
      ? `${c.slot.bookingCount} הזמנות מול ${c.staffAvailable} אנשי צוות זמינים (${utilStr} תפוסה)`
      : `${c.slot.bookingCount} bookings vs ${c.staffAvailable} available staff (${utilStr} utilization)`;

    const recommendation = locale === "he"
      ? c.staffAvailable > 1
        ? `שקול להפחית איש צוות אחד בחלון הזה או להריץ מבצע ממוקד ליום ${dayStr}`
        : `שקול לקצר את שעות הפעילות או להריץ מבצע ליום ${dayStr} בשעה ${hourStr}`
      : c.staffAvailable > 1
        ? `Consider reducing staff by 1 in this window or running a targeted ${dayStr} promotion`
        : `Consider shortening hours or running a promotion for ${dayStr} at ${hourStr}`;

    return {
      id: `${MODULE}:${c.slot.day}:${c.slot.hour}`,
      module: MODULE,
      category: "scheduling" as const,
      severity: c.severity,
      claimType: "low_utilization",
      entityRef: `slot:${c.slot.day}:${c.slot.hour}`,
      title,
      summary,
      evidence,
      recommendation,
      priorityScore: c.priority,
      confidenceScore: c.confidence,
      effectSize: c.effectSize,
      estimatedRevenueImpact: c.revenueImpact,
      timeframe: "this_month" as const,
      supportingMetrics: [
        { label: locale === "he" ? "תפוסה" : "Utilization", value: utilStr },
        { label: locale === "he" ? "הזמנות" : "Bookings", value: String(c.slot.bookingCount), periodLabel: locale === "he" ? "30 יום" : "30 days" },
      ],
      requiresHumanReview: c.dataQuality === "weak" || c.confidence < 0.45,
      dataQuality: c.dataQuality,
      action: { label: locale === "he" ? "צפה בלוח" : "View calendar", href: "/dashboard/calendar" },
    };
  });
}

// ── Exported analyzer ──

export function analyzeDeadHours(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const candidates = detect(ctx);
  const scored = score(candidates, ctx);
  return present(scored, locale, ctx);
}
