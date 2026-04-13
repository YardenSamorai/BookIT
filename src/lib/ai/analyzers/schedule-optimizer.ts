import type { BusinessContext } from "../business-context";
import { DAY_NAMES_HE, DAY_NAMES_EN } from "../business-context";
import type { AnalysisResult, InsightSeverity, Locale } from "../types";
import { computeConfidence, computeEffectSize, toDataQuality } from "../confidence";

const MODULE = "schedule_optimizer";

// ── Phase 1: Detect ──

type CandidateKind = "staff_imbalance" | "staff_overload" | "demand_coverage_mismatch";

interface Candidate {
  kind: CandidateKind;
  metric: number;
  baseline: number;
  sampleSize: number;
  entityRef?: string;
  context: Record<string, unknown>;
}

function detect(ctx: BusinessContext): Candidate[] {
  const activeStaff = ctx.staff.members.filter((m) => m.isActive);
  const totalAppts = ctx.appointments.currentPeriodCount;

  // Hard gate
  if (activeStaff.length < 2 || totalAppts < 10) return [];

  const isPartial = totalAppts < 30;
  const candidates: Candidate[] = [];

  // 1. Staff imbalance: top staff has 3x+ more appointments than bottom
  const sorted = [...activeStaff].sort((a, b) => b.appointmentCount - a.appointmentCount);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  if (bottom.appointmentCount > 0 && top.appointmentCount >= bottom.appointmentCount * 2.5) {
    candidates.push({
      kind: "staff_imbalance",
      metric: top.appointmentCount / bottom.appointmentCount,
      baseline: 1.5,
      sampleSize: totalAppts,
      context: {
        topName: top.name, topCount: top.appointmentCount,
        bottomName: bottom.name, bottomCount: bottom.appointmentCount,
      },
    });
  }

  // Partial data: suppress staff_overload and demand_coverage_mismatch
  if (isPartial) return candidates;

  // 2. Staff overload: any staff at 90%+ utilization
  for (const s of activeStaff) {
    if (s.utilizationPct >= 85 && s.appointmentCount >= 10) {
      candidates.push({
        kind: "staff_overload",
        metric: s.utilizationPct / 100,
        baseline: 0.70,
        sampleSize: s.appointmentCount,
        entityRef: `staff:${s.id}`,
        context: { name: s.name, utilPct: s.utilizationPct, count: s.appointmentCount },
      });
    }
  }

  // 3. Demand-coverage mismatch: day with high demand but low staff, or vice versa
  const dayOfWeekCounts = ctx.appointments.dayOfWeekCounts;
  const avgDay = totalAppts / 7;

  for (let day = 0; day < 7; day++) {
    const demand = dayOfWeekCounts[day];
    if (demand < 3) continue;

    const staffOnDay = activeStaff.filter((s) => s.dayBreakdown[day] > 0).length;
    if (staffOnDay === 0) continue;

    // High demand, low coverage: demand > 2x avg, staffOnDay < half of active
    if (demand > avgDay * 2 && staffOnDay < activeStaff.length * 0.5) {
      candidates.push({
        kind: "demand_coverage_mismatch",
        metric: demand / avgDay,
        baseline: 1.5,
        sampleSize: demand,
        entityRef: `day:${day}`,
        context: { day, demand, avgDay: Math.round(avgDay), staffOnDay, totalStaff: activeStaff.length },
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
}

function score(candidates: Candidate[], ctx: BusinessContext): ScoredCandidate[] {
  const totalAppts = ctx.appointments.currentPeriodCount;
  const isPartial = totalAppts < 30;

  const results: ScoredCandidate[] = [];
  for (const c of candidates) {
    let minDelta: number, maxDelta: number;
    switch (c.kind) {
      case "staff_imbalance": minDelta = 1.0; maxDelta = 4.0; break;
      case "staff_overload": minDelta = 0.10; maxDelta = 0.25; break;
      case "demand_coverage_mismatch": minDelta = 0.5; maxDelta = 2.0; break;
    }

    const effectSize = computeEffectSize(c.metric, c.baseline, minDelta, maxDelta);
    if (effectSize === 0) continue;

    const confidence = computeConfidence({
      sampleSize: c.sampleSize,
      minSampleRequired: c.kind === "staff_imbalance" ? 8 : 10,
      consistencyWeeks: 4,
      totalWeeksObserved: 4,
      recencyWeight: 0.7,
      dataCompleteness: isPartial ? 0.5 : 0.9,
    });

    let cappedConfidence = confidence;
    const dq = toDataQuality(cappedConfidence);
    if (dq === "weak") cappedConfidence = Math.min(cappedConfidence, 0.45);

    const priority = Math.round(effectSize * 55 + cappedConfidence * 35 + (c.kind === "staff_overload" ? 10 : 0));
    const severity: InsightSeverity = c.kind === "staff_overload" && effectSize > 0.5 ? "warning" : "opportunity";

    results.push({ ...c, confidence: cappedConfidence, effectSize, priority, severity, dataQuality: dq });
  }
  return results;
}

// ── Phase 3: Present ──

function present(scored: ScoredCandidate[], locale: Locale, ctx: BusinessContext): AnalysisResult[] {
  const dayNames = locale === "he" ? DAY_NAMES_HE : DAY_NAMES_EN;
  const isHe = locale === "he";

  return scored.map((c) => {
    let title: string, summary: string, evidence: string, recommendation: string;
    let claimType = c.kind;

    switch (c.kind) {
      case "staff_imbalance": {
        const { topName, topCount, bottomName, bottomCount } = c.context as Record<string, string | number>;
        title = isHe ? "חוסר איזון בין אנשי צוות" : "Staff workload imbalance";
        summary = isHe
          ? `${topName} מטפל ב-${topCount} תורים בעוד ${bottomName} מטפל רק ב-${bottomCount}`
          : `${topName} handles ${topCount} appointments while ${bottomName} handles only ${bottomCount}`;
        evidence = isHe
          ? `יחס של ${Math.round(c.metric)}:1 בין הצוות העמוס ביותר לפחות`
          : `${Math.round(c.metric)}:1 ratio between busiest and least busy staff`;
        recommendation = isHe
          ? `שקול להפנות חלק מהתורים של ${topName} ל-${bottomName} או לבדוק הגדרות שירותים`
          : `Consider routing some of ${topName}'s appointments to ${bottomName} or review service assignments`;
        break;
      }
      case "staff_overload": {
        const { name, utilPct } = c.context as Record<string, string | number>;
        title = isHe ? `עומס יתר - ${name}` : `Staff overloaded - ${name}`;
        summary = isHe
          ? `${name} בניצולת של ${utilPct}% -- קרוב לשריפת צוות`
          : `${name} is at ${utilPct}% utilization -- approaching burnout risk`;
        evidence = isHe
          ? `${c.context.count} תורים ב-30 יום, תפוסה ${utilPct}%`
          : `${c.context.count} appointments in 30 days, ${utilPct}% utilization`;
        recommendation = isHe
          ? `שקול להוסיף איש צוות או להגביל את ההזמנות של ${name}`
          : `Consider adding staff or capping ${name}'s bookable slots`;
        break;
      }
      case "demand_coverage_mismatch": {
        const { day, demand, staffOnDay, totalStaff } = c.context as Record<string, number>;
        const dayStr = dayNames[day];
        title = isHe ? `חוסר התאמה בכיסוי - ${dayStr}` : `Coverage mismatch - ${dayStr}`;
        summary = isHe
          ? `יום ${dayStr} עם ${demand} תורים אבל רק ${staffOnDay} מתוך ${totalStaff} אנשי צוות`
          : `${dayStr} has ${demand} appointments but only ${staffOnDay} of ${totalStaff} staff active`;
        evidence = isHe
          ? `ביקוש של פי ${Math.round(c.metric)} מהממוצע עם חצי מהכיסוי`
          : `${Math.round(c.metric)}x average demand with half the staff coverage`;
        recommendation = isHe
          ? `שקול להוסיף צוות ליום ${dayStr} או לפתוח עוד משמרות`
          : `Consider adding staff on ${dayStr} or opening more shifts`;
        break;
      }
    }

    return {
      id: `${MODULE}:${c.kind}${c.entityRef ? `:${c.entityRef}` : ""}`,
      module: MODULE,
      category: "scheduling" as const,
      severity: c.severity,
      claimType,
      entityRef: c.entityRef,
      title,
      summary,
      evidence,
      recommendation,
      priorityScore: c.priority,
      confidenceScore: c.confidence,
      effectSize: c.effectSize,
      timeframe: "this_month" as const,
      supportingMetrics: [
        { label: isHe ? "אנשי צוות" : "Staff", value: String(ctx.staff.members.filter((m) => m.isActive).length) },
        { label: isHe ? "תורים" : "Appointments", value: String(ctx.appointments.currentPeriodCount), periodLabel: "30d" },
      ],
      requiresHumanReview: c.dataQuality === "weak" || c.confidence < 0.45,
      dataQuality: c.dataQuality,
      action: { label: isHe ? "צפה בצוות" : "View staff", href: "/dashboard/staff" },
    };
  });
}

// ── Exported analyzer ──

export function analyzeSchedule(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const candidates = detect(ctx);
  const scored = score(candidates, ctx);
  return present(scored, locale, ctx);
}
