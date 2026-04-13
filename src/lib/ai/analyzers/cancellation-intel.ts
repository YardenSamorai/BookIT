import type { BusinessContext } from "../business-context";
import { DAY_NAMES_HE, DAY_NAMES_EN } from "../business-context";
import type { AnalysisResult, InsightSeverity, Locale } from "../types";
import { computeConfidence, computeEffectSize, toDataQuality } from "../confidence";

const MODULE = "cancel_intel";

// ── Phase 1: Detect ──

type CandidateKind = "overall_rate" | "day_spike" | "service_spike" | "staff_spike" | "revenue_lost";

interface Candidate {
  kind: CandidateKind;
  metric: number;
  baseline: number;
  sampleSize: number;
  entityRef?: string;
  context: Record<string, unknown>;
}

function detect(ctx: BusinessContext): Candidate[] {
  const c = ctx.cancellations;
  const totalAppts = ctx.appointments.totalCount + c.totalCancelled;

  // Hard gate
  if (totalAppts < 10) return [];

  const candidates: Candidate[] = [];
  const avgRate = c.cancellationRate / 100;

  // 1. Overall high cancellation rate
  if (c.cancellationRate >= 10) {
    candidates.push({
      kind: "overall_rate",
      metric: avgRate,
      baseline: 0.10,
      sampleSize: totalAppts,
      context: { rate: c.cancellationRate, count: c.totalCancelled },
    });
  }

  // Partial gate: need 5+ cancellations for drill-downs
  if (c.totalCancelled < 5) return candidates;

  // 2. Day spike
  const avgCancelPerDay = c.totalCancelled / 7;
  for (let day = 0; day < 7; day++) {
    if (c.byDay[day] >= 3 && c.byDay[day] >= avgCancelPerDay * 2) {
      candidates.push({
        kind: "day_spike",
        metric: c.byDay[day],
        baseline: avgCancelPerDay,
        sampleSize: c.byDay[day],
        entityRef: `day:${day}`,
        context: { day, count: c.byDay[day], avg: Math.round(avgCancelPerDay) },
      });
    }
  }

  // 3. Service spike (only for services with 10+ total appointments)
  for (const svc of c.byService) {
    if (svc.count >= 3 && svc.rate >= avgRate * 100 * 2) {
      candidates.push({
        kind: "service_spike",
        metric: svc.rate / 100,
        baseline: avgRate,
        sampleSize: svc.count,
        entityRef: `service:${svc.serviceId}`,
        context: { title: svc.title, rate: svc.rate, count: svc.count },
      });
    }
  }

  // 4. Staff spike (only for staff with 10+ total appointments)
  for (const st of c.byStaff) {
    if (st.count >= 3 && st.rate >= avgRate * 100 * 2) {
      candidates.push({
        kind: "staff_spike",
        metric: st.rate / 100,
        baseline: avgRate,
        sampleSize: st.count,
        entityRef: `staff:${st.staffId}`,
        context: { name: st.name, rate: st.rate, count: st.count },
      });
    }
  }

  // 5. Revenue lost to cancellations (if >10% of total revenue)
  const totalRev = ctx.revenue.currentPeriod || 1;
  const lostPct = c.revenueLost / totalRev;
  if (lostPct >= 0.10 && c.revenueLost > 0) {
    candidates.push({
      kind: "revenue_lost",
      metric: lostPct,
      baseline: 0.05,
      sampleSize: c.totalCancelled,
      context: { lost: c.revenueLost, pct: Math.round(lostPct * 100) },
    });
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
  const totalAppts = ctx.appointments.totalCount + ctx.cancellations.totalCancelled;
  const isPartial = totalAppts < 20;

  const results: ScoredCandidate[] = [];
  for (const c of candidates) {
    let minDelta: number, maxDelta: number;
    switch (c.kind) {
      case "overall_rate": minDelta = 0.05; maxDelta = 0.25; break;
      case "day_spike":
      case "service_spike":
      case "staff_spike": minDelta = 0.05; maxDelta = 0.25; break;
      case "revenue_lost": minDelta = 0.05; maxDelta = 0.30; break;
    }

    const effectSize = computeEffectSize(c.metric, c.baseline, minDelta, maxDelta);
    if (effectSize === 0) continue;

    const confidence = computeConfidence({
      sampleSize: c.sampleSize,
      minSampleRequired: c.kind === "overall_rate" ? 5 : 3,
      consistencyWeeks: 4,
      totalWeeksObserved: 4,
      recencyWeight: 0.7,
      dataCompleteness: isPartial ? 0.5 : 0.9,
    });

    let cappedConfidence = confidence;
    const dq = toDataQuality(cappedConfidence);
    if (dq === "weak") cappedConfidence = Math.min(cappedConfidence, 0.45);

    const priority = Math.round(effectSize * 60 + cappedConfidence * 30 + (c.kind === "revenue_lost" ? 10 : 0));
    const severity: InsightSeverity = c.kind === "revenue_lost" || effectSize > 0.6 ? "critical" : effectSize > 0.3 ? "warning" : "opportunity";

    results.push({ ...c, confidence: cappedConfidence, effectSize, priority, severity, dataQuality: dq });
  }
  return results;
}

// ── Phase 3: Present ──

function present(scored: ScoredCandidate[], locale: Locale, ctx: BusinessContext): AnalysisResult[] {
  const dayNames = locale === "he" ? DAY_NAMES_HE : DAY_NAMES_EN;
  const currSymbol = ctx.profile.currency === "ILS" ? "₪" : ctx.profile.currency;
  const isHe = locale === "he";

  return scored.map((c) => {
    let title: string, summary: string, evidence: string, recommendation: string;
    let claimType = "high_cancel_rate";
    let contextKey: string | undefined;

    switch (c.kind) {
      case "overall_rate": {
        const rate = c.context.rate as number;
        const count = c.context.count as number;
        title = isHe ? "שיעור ביטולים גבוה" : "High cancellation rate";
        summary = isHe
          ? `שיעור הביטולים שלך הוא ${rate}% ב-60 הימים האחרונים (${count} ביטולים)`
          : `Your cancellation rate is ${rate}% over the last 60 days (${count} cancellations)`;
        evidence = isHe
          ? `${count} מתוך ${ctx.appointments.totalCount + count} תורים בוטלו`
          : `${count} out of ${ctx.appointments.totalCount + count} appointments were cancelled`;
        recommendation = isHe
          ? "שקול לשלוח תזכורות 24 שעות לפני, או לדרוש מקדמה להזמנות"
          : "Consider sending reminders 24 hours before, or requiring deposits for bookings";
        break;
      }
      case "day_spike": {
        const day = c.context.day as number;
        const count = c.context.count as number;
        const avg = c.context.avg as number;
        claimType = "cancel_spike";
        contextKey = `day:${day}`;
        title = isHe ? `שיא ביטולים - ${dayNames[day]}` : `Cancellation spike - ${dayNames[day]}`;
        summary = isHe
          ? `ביום ${dayNames[day]} יש ${count} ביטולים, כפול מהממוצע (${avg})`
          : `${dayNames[day]} has ${count} cancellations, 2x the average (${avg})`;
        evidence = isHe
          ? `ממוצע ביטולים ליום: ${avg}. יום ${dayNames[day]}: ${count}`
          : `Average cancellations per day: ${avg}. ${dayNames[day]}: ${count}`;
        recommendation = isHe
          ? `שקול לשלוח תזכורת נוספת ללקוחות של יום ${dayNames[day]} או לבדוק מה גורם לביטולים ביום הזה`
          : `Consider sending extra reminders for ${dayNames[day]} bookings or investigating what causes cancellations on this day`;
        break;
      }
      case "service_spike": {
        const svcTitle = c.context.title as string;
        const rate = c.context.rate as number;
        claimType = "cancel_spike";
        contextKey = `service`;
        title = isHe ? `ביטולים גבוהים - ${svcTitle}` : `High cancellations - ${svcTitle}`;
        summary = isHe
          ? `שירות "${svcTitle}" עם שיעור ביטולים של ${rate}%, כפול מהממוצע`
          : `Service "${svcTitle}" has a ${rate}% cancellation rate, 2x the average`;
        evidence = isHe
          ? `${c.context.count} ביטולים בשירות הזה (${rate}% מכלל ההזמנות שלו)`
          : `${c.context.count} cancellations for this service (${rate}% of its total bookings)`;
        recommendation = isHe
          ? `בדוק אם יש בעיה בשירות הזה -- אולי המחיר, משך הזמן, או תיאום הציפיות`
          : `Investigate this service -- consider price, duration, or expectation mismatch`;
        break;
      }
      case "staff_spike": {
        const staffName = c.context.name as string;
        const rate = c.context.rate as number;
        claimType = "cancel_spike";
        contextKey = `staff`;
        title = isHe ? `ביטולים גבוהים - ${staffName}` : `High cancellations - ${staffName}`;
        summary = isHe
          ? `ללקוחות של ${staffName} שיעור ביטולים של ${rate}%, כפול מהממוצע`
          : `${staffName}'s clients have a ${rate}% cancellation rate, 2x the average`;
        evidence = isHe
          ? `${c.context.count} ביטולים (${rate}% מהתורים של ${staffName})`
          : `${c.context.count} cancellations (${rate}% of ${staffName}'s appointments)`;
        recommendation = isHe
          ? `שוחח עם ${staffName} על חוויית הלקוח או בדוק אם הבעיה היא בתזמון`
          : `Talk to ${staffName} about client experience or check if the issue is scheduling-related`;
        break;
      }
      case "revenue_lost": {
        const lost = c.context.lost as number;
        const pct = c.context.pct as number;
        claimType = "high_cancel_rate";
        contextKey = "revenue_impact";
        title = isHe ? "הכנסות שאבדו מביטולים" : "Revenue lost to cancellations";
        summary = isHe
          ? `${currSymbol}${lost} אבדו מביטולים -- ${pct}% מסך ההכנסות`
          : `${currSymbol}${lost} lost to cancellations -- ${pct}% of total revenue`;
        evidence = isHe
          ? `${ctx.cancellations.totalCancelled} ביטולים עם ערך ממוצע של ${currSymbol}${Math.round(lost / (ctx.cancellations.totalCancelled || 1))}`
          : `${ctx.cancellations.totalCancelled} cancellations with avg value of ${currSymbol}${Math.round(lost / (ctx.cancellations.totalCancelled || 1))}`;
        recommendation = isHe
          ? "שקול לדרוש מקדמה או ליישם מדיניות ביטול עם חיוב"
          : "Consider requiring deposits or implementing a cancellation fee policy";
        break;
      }
    }

    return {
      id: `${MODULE}:${c.kind}${c.entityRef ? `:${c.entityRef}` : ""}`,
      module: MODULE,
      category: "operations" as const,
      severity: c.severity,
      claimType,
      entityRef: c.entityRef,
      contextKey,
      title,
      summary,
      evidence,
      recommendation,
      priorityScore: c.priority,
      confidenceScore: c.confidence,
      effectSize: c.effectSize,
      estimatedRevenueImpact: c.kind === "revenue_lost" ? (c.context.lost as number) : undefined,
      timeframe: "this_month" as const,
      supportingMetrics: [
        { label: isHe ? "שיעור ביטולים" : "Cancel rate", value: `${ctx.cancellations.cancellationRate}%` },
        { label: isHe ? "ביטולים" : "Cancellations", value: String(ctx.cancellations.totalCancelled), periodLabel: "60d" },
      ],
      requiresHumanReview: c.dataQuality === "weak" || c.confidence < 0.45,
      dataQuality: c.dataQuality,
      action: { label: isHe ? "צפה בתורים" : "View appointments", href: "/dashboard/appointments" },
    };
  });
}

// ── Exported analyzer ──

export function analyzeCancellations(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const candidates = detect(ctx);
  const scored = score(candidates, ctx);
  return present(scored, locale, ctx);
}
