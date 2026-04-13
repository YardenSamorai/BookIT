import type { BusinessContext } from "../business-context";
import { DAY_NAMES_HE, DAY_NAMES_EN } from "../business-context";
import type { AnalysisResult, InsightSeverity, Locale } from "../types";
import { computeConfidence, computeEffectSize, toDataQuality } from "../confidence";

const MODULE = "demand_forecast";

// ── Phase 1: Detect ──

type CandidateKind = "service_growth" | "service_decline" | "day_shift" | "volume_trend";

interface Candidate {
  kind: CandidateKind;
  metric: number;
  baseline: number;
  absoluteDelta: number;
  sampleSize: number;
  entityRef?: string;
  contextKey?: string;
  context: Record<string, unknown>;
}

function detect(ctx: BusinessContext): Candidate[] {
  const current = ctx.appointments.currentPeriodCount;
  const previous = ctx.appointments.previousPeriodCount;

  // Hard gate
  if (current < 5) return [];

  const candidates: Candidate[] = [];
  const hasHistory = previous > 0;
  const thinHistory = previous > 0 && previous < 10;

  // Threshold helpers
  const relThreshold = thinHistory ? 0.50 : 0.30;
  const absThreshold = 5;

  // 1. Overall volume trend
  if (hasHistory) {
    const pctChange = (current - previous) / previous;
    const absDelta = Math.abs(current - previous);
    if (absDelta >= absThreshold && Math.abs(pctChange) >= relThreshold) {
      candidates.push({
        kind: pctChange > 0 ? "volume_trend" : "volume_trend",
        metric: pctChange,
        baseline: 0,
        absoluteDelta: absDelta,
        sampleSize: current + previous,
        contextKey: pctChange > 0 ? "growth" : "decline",
        context: { current, previous, pctChange: Math.round(pctChange * 100), absDelta },
      });
    }
  } else if (current >= 10) {
    // New business -- can only emit growth at low confidence
    candidates.push({
      kind: "volume_trend",
      metric: 1,
      baseline: 0,
      absoluteDelta: current,
      sampleSize: current,
      contextKey: "new_business",
      context: { current, previous: 0, pctChange: 100, absDelta: current },
    });
  }

  // 2. Service-level growth/decline
  for (const svc of ctx.services.services) {
    const cur = svc.currentPeriodCount;
    const prev = svc.previousPeriodCount;
    if (cur < 2 && prev < 2) continue;

    if (prev > 0) {
      const pctChange = (cur - prev) / prev;
      const absDelta = Math.abs(cur - prev);
      if (absDelta >= absThreshold && Math.abs(pctChange) >= relThreshold) {
        // For decline, need minimum 10 in previous period
        if (pctChange < 0 && prev < 10) continue;

        candidates.push({
          kind: pctChange > 0 ? "service_growth" : "service_decline",
          metric: pctChange,
          baseline: 0,
          absoluteDelta: absDelta,
          sampleSize: cur + prev,
          entityRef: `service:${svc.id}`,
          context: { title: svc.title, cur, prev, pctChange: Math.round(pctChange * 100) },
        });
      }
    }
  }

  // 3. Day-of-week shift
  if (hasHistory && !thinHistory) {
    const curDays = ctx.appointments.dayOfWeekCounts;
    const prevDays = ctx.appointments.prevDayOfWeekCounts;
    for (let day = 0; day < 7; day++) {
      if (prevDays[day] < 3) continue;
      const pctChange = (curDays[day] - prevDays[day]) / prevDays[day];
      const absDelta = Math.abs(curDays[day] - prevDays[day]);
      if (absDelta >= 3 && Math.abs(pctChange) >= 0.40) {
        candidates.push({
          kind: "day_shift",
          metric: pctChange,
          baseline: 0,
          absoluteDelta: absDelta,
          sampleSize: curDays[day] + prevDays[day],
          entityRef: `day:${day}`,
          contextKey: pctChange > 0 ? "day_growth" : "day_decline",
          context: { day, cur: curDays[day], prev: prevDays[day], pctChange: Math.round(pctChange * 100) },
        });
      }
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
  const hasHistory = ctx.appointments.previousPeriodCount > 0;
  const thinHistory = ctx.appointments.previousPeriodCount > 0 && ctx.appointments.previousPeriodCount < 10;
  const isNewBusiness = !hasHistory;

  const results: ScoredCandidate[] = [];
  for (const c of candidates) {
    const effectSize = computeEffectSize(
      Math.abs(c.metric), 0,
      c.kind === "day_shift" ? 0.20 : 0.15,
      c.kind === "day_shift" ? 0.80 : 0.60,
    );
    if (effectSize === 0) continue;

    const completeness = isNewBusiness ? 0.3 : thinHistory ? 0.6 : 0.9;
    const confidence = computeConfidence({
      sampleSize: c.sampleSize,
      minSampleRequired: 5,
      consistencyWeeks: 4,
      totalWeeksObserved: 4,
      recencyWeight: 0.8,
      dataCompleteness: completeness,
    });

    let cappedConfidence = confidence;
    const dq = toDataQuality(cappedConfidence);
    if (dq === "weak") cappedConfidence = Math.min(cappedConfidence, 0.45);

    const priority = Math.round(effectSize * 55 + cappedConfidence * 35 + (c.kind === "volume_trend" ? 10 : 0));
    const isDecline = c.metric < 0;
    const severity: InsightSeverity = isDecline && effectSize > 0.4 ? "warning" : isDecline ? "info" : "opportunity";

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

    switch (c.kind) {
      case "volume_trend": {
        const { current, previous, pctChange } = c.context as Record<string, number>;
        const isGrowth = pctChange > 0;
        title = isHe
          ? isGrowth ? "עלייה בנפח הפעילות" : "ירידה בנפח הפעילות"
          : isGrowth ? "Business volume growing" : "Business volume declining";
        summary = isHe
          ? `${Math.abs(pctChange)}% ${isGrowth ? "עלייה" : "ירידה"} בתורים: ${previous} → ${current}`
          : `${Math.abs(pctChange)}% ${isGrowth ? "increase" : "decrease"} in appointments: ${previous} → ${current}`;
        evidence = isHe
          ? `${current} תורים ב-30 יום האחרונים לעומת ${previous} בתקופה הקודמת`
          : `${current} appointments in last 30 days vs ${previous} in previous period`;
        recommendation = isGrowth
          ? (isHe ? "מצוין! שקול להוסיף שעות או צוות כדי לנצל את הצמיחה" : "Great! Consider adding hours or staff to capitalize on growth")
          : (isHe ? "שקול להריץ מבצעים או לבדוק מה גורם לירידה" : "Consider running promotions or investigating what's causing the decline");
        break;
      }
      case "service_growth":
      case "service_decline": {
        const { title: svcTitle, cur, prev, pctChange } = c.context as Record<string, string | number>;
        const isGrowth = (pctChange as number) > 0;
        title = isHe
          ? `${isGrowth ? "צמיחה" : "ירידה"} בשירות - ${svcTitle}`
          : `Service ${isGrowth ? "growing" : "declining"} - ${svcTitle}`;
        summary = isHe
          ? `"${svcTitle}" ${isGrowth ? "עלה" : "ירד"} ב-${Math.abs(pctChange as number)}%: ${prev} → ${cur}`
          : `"${svcTitle}" ${isGrowth ? "grew" : "declined"} by ${Math.abs(pctChange as number)}%: ${prev} → ${cur}`;
        evidence = isHe
          ? `${cur} הזמנות בתקופה הנוכחית לעומת ${prev} בקודמת`
          : `${cur} bookings in current period vs ${prev} in previous`;
        recommendation = isGrowth
          ? (isHe ? `שקול להוסיף זמינות לשירות "${svcTitle}" כדי לנצל את הביקוש` : `Consider adding availability for "${svcTitle}" to meet growing demand`)
          : (isHe ? `בדוק מה גורם לירידה ב-"${svcTitle}" -- מחיר, חוויה, או תחרות?` : `Investigate what's causing the decline in "${svcTitle}" -- pricing, experience, or competition?`);
        break;
      }
      case "day_shift": {
        const { day, cur, prev, pctChange } = c.context as Record<string, number>;
        const dayStr = dayNames[day];
        const isGrowth = pctChange > 0;
        title = isHe
          ? `${isGrowth ? "עלייה" : "ירידה"} ביום ${dayStr}`
          : `${dayStr} ${isGrowth ? "growing" : "declining"}`;
        summary = isHe
          ? `יום ${dayStr} ${isGrowth ? "עלה" : "ירד"} ב-${Math.abs(pctChange)}%: ${prev} → ${cur} תורים`
          : `${dayStr} ${isGrowth ? "grew" : "declined"} by ${Math.abs(pctChange)}%: ${prev} → ${cur} appointments`;
        evidence = isHe
          ? `${cur} תורים ביום ${dayStr} בתקופה הנוכחית לעומת ${prev} בקודמת`
          : `${cur} appointments on ${dayStr} in current period vs ${prev} in previous`;
        recommendation = isGrowth
          ? (isHe ? `שקול להוסיף צוות ליום ${dayStr} כדי לתת מענה לביקוש` : `Consider adding staff on ${dayStr} to meet rising demand`)
          : (isHe ? `בדוק אם כדאי להפחית צוות ביום ${dayStr} או להריץ מבצע` : `Consider reducing staff on ${dayStr} or running a targeted promotion`);
        break;
      }
    }

    return {
      id: `${MODULE}:${c.kind}${c.entityRef ? `:${c.entityRef}` : ""}`,
      module: MODULE,
      category: "operations" as const,
      severity: c.severity,
      claimType: c.kind,
      entityRef: c.entityRef,
      contextKey: c.contextKey,
      title,
      summary,
      evidence,
      recommendation,
      priorityScore: c.priority,
      confidenceScore: c.confidence,
      effectSize: c.effectSize,
      timeframe: "this_month" as const,
      supportingMetrics: [
        { label: isHe ? "תורים נוכחי" : "Current", value: String(ctx.appointments.currentPeriodCount), periodLabel: "30d" },
        { label: isHe ? "תורים קודם" : "Previous", value: String(ctx.appointments.previousPeriodCount), periodLabel: "30d" },
      ],
      requiresHumanReview: c.dataQuality === "weak" || c.confidence < 0.45,
      dataQuality: c.dataQuality,
      action: { label: isHe ? "צפה בלוח" : "View calendar", href: "/dashboard/calendar" },
    };
  });
}

// ── Exported analyzer ──

export function analyzeDemand(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const candidates = detect(ctx);
  const scored = score(candidates, ctx);
  return present(scored, locale, ctx);
}
