import type { BusinessContext } from "../business-context";
import type { AnalysisResult, InsightSeverity, Locale } from "../types";
import { computeConfidence, computeEffectSize, toDataQuality } from "../confidence";

const MODULE = "revenue_optimizer";

// ── Phase 1: Detect ──

type CandidateKind = "revenue_opportunity" | "price_increase_signal" | "revenue_concentration" | "revenue_trend";

interface Candidate {
  kind: CandidateKind;
  metric: number;
  baseline: number;
  sampleSize: number;
  entityRef?: string;
  context: Record<string, unknown>;
}

function detect(ctx: BusinessContext): Candidate[] {
  const paidAppts = ctx.services.services.reduce((s, svc) => s + svc.currentPeriodCount, 0);
  const servicesWithBookings = ctx.services.services.filter((s) => s.currentPeriodCount > 0);

  // Hard gate: 10 paid appointments
  if (paidAppts < 10) return [];

  const isPartial = paidAppts < 20;
  const candidates: Candidate[] = [];

  // 1. RPH opportunity: highest RPH service is underrepresented (<20% of bookings)
  if (servicesWithBookings.length >= 2) {
    const byRph = [...servicesWithBookings].sort((a, b) => b.revenuePerHour - a.revenuePerHour);
    const topRph = byRph[0];
    if (topRph.pctOfTotal < 20 && topRph.currentPeriodCount >= 2) {
      candidates.push({
        kind: "revenue_opportunity",
        metric: topRph.revenuePerHour,
        baseline: byRph[byRph.length - 1].revenuePerHour || 1,
        sampleSize: topRph.currentPeriodCount,
        entityRef: `service:${topRph.id}`,
        context: { title: topRph.title, rph: topRph.revenuePerHour, pct: topRph.pctOfTotal, price: topRph.price },
      });
    }
  }

  // Partial data: suppress price_increase and concentration
  if (isPartial) return candidates;

  // 2. Price increase signal: service at capacity (>85% of available slots booked)
  for (const svc of servicesWithBookings) {
    if (svc.currentPeriodCount < 20) continue;
    const totalStaffHours = ctx.staff.members.reduce((s, m) => s + m.availableMinutes, 0) / 60;
    const svcHoursUsed = (svc.durationMinutes * svc.currentPeriodCount) / 60;
    // Consider it capacity-constrained if it uses >40% of total staff hours
    if (totalStaffHours > 0 && svcHoursUsed / totalStaffHours > 0.40 && svc.pctOfTotal > 30) {
      candidates.push({
        kind: "price_increase_signal",
        metric: svcHoursUsed / totalStaffHours,
        baseline: 0.30,
        sampleSize: svc.currentPeriodCount,
        entityRef: `service:${svc.id}`,
        context: { title: svc.title, capacityPct: Math.round((svcHoursUsed / totalStaffHours) * 100), price: svc.price, count: svc.currentPeriodCount },
      });
    }
  }

  // 3. Revenue concentration: top 2 services > 70% of revenue (risky if 4+ services)
  if (servicesWithBookings.length >= 4 && ctx.revenue.concentrationTop2Pct > 70) {
    const byRev = [...servicesWithBookings].sort((a, b) => b.revenue - a.revenue);
    candidates.push({
      kind: "revenue_concentration",
      metric: ctx.revenue.concentrationTop2Pct / 100,
      baseline: 0.50,
      sampleSize: paidAppts,
      context: { pct: ctx.revenue.concentrationTop2Pct, top1: byRev[0]?.title, top2: byRev[1]?.title },
    });
  }

  // 4. Revenue trend
  if (ctx.revenue.previousPeriod > 0) {
    const growthPct = ctx.revenue.growthPct;
    if (Math.abs(growthPct) >= 15) {
      candidates.push({
        kind: "revenue_trend",
        metric: growthPct / 100,
        baseline: 0,
        sampleSize: paidAppts,
        context: { growthPct, current: ctx.revenue.currentPeriod, previous: ctx.revenue.previousPeriod },
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
  const paidAppts = ctx.services.services.reduce((s, svc) => s + svc.currentPeriodCount, 0);
  const isPartial = paidAppts < 20;

  const results: ScoredCandidate[] = [];
  for (const c of candidates) {
    let minDelta: number, maxDelta: number;
    switch (c.kind) {
      case "revenue_opportunity": minDelta = 20; maxDelta = 100; break;
      case "price_increase_signal": minDelta = 0.05; maxDelta = 0.30; break;
      case "revenue_concentration": minDelta = 0.10; maxDelta = 0.30; break;
      case "revenue_trend": minDelta = 0.10; maxDelta = 0.40; break;
    }

    const effectSize = computeEffectSize(
      c.kind === "revenue_opportunity" ? c.metric : Math.abs(c.metric),
      c.kind === "revenue_opportunity" ? c.baseline : 0,
      minDelta, maxDelta,
    );
    if (effectSize === 0) continue;

    const confidence = computeConfidence({
      sampleSize: c.sampleSize,
      minSampleRequired: c.kind === "revenue_opportunity" ? 3 : 10,
      consistencyWeeks: 4,
      totalWeeksObserved: 4,
      recencyWeight: 0.7,
      dataCompleteness: isPartial ? 0.5 : 0.9,
    });

    let cappedConfidence = confidence;
    const dq = toDataQuality(cappedConfidence);
    if (dq === "weak") cappedConfidence = Math.min(cappedConfidence, 0.45);

    const priority = Math.round(effectSize * 50 + cappedConfidence * 30 + (c.kind === "price_increase_signal" ? 15 : 5));
    const severity: InsightSeverity =
      c.kind === "revenue_concentration" ? "warning"
      : c.kind === "revenue_trend" && c.metric < 0 ? "warning"
      : "opportunity";

    let revenueImpact: number | undefined;
    if (c.kind === "revenue_opportunity") {
      const svc = ctx.services.services.find((s) => s.id === c.entityRef?.split(":")[1]);
      if (svc) {
        const additionalBookings = Math.round(paidAppts * 0.10);
        revenueImpact = Math.round(additionalBookings * svc.price);
      }
    }

    results.push({
      ...c, confidence: cappedConfidence, effectSize, priority, severity, dataQuality: dq,
      revenueImpact,
    });
  }
  return results;
}

// ── Phase 3: Present ──

function present(scored: ScoredCandidate[], locale: Locale, ctx: BusinessContext): AnalysisResult[] {
  const isHe = locale === "he";
  const currSymbol = ctx.profile.currency === "ILS" ? "₪" : ctx.profile.currency;

  return scored.map((c) => {
    let title: string, summary: string, evidence: string, recommendation: string;

    switch (c.kind) {
      case "revenue_opportunity": {
        const { title: svcTitle, rph, pct } = c.context as Record<string, string | number>;
        title = isHe ? `הזדמנות הכנסה - ${svcTitle}` : `Revenue opportunity - ${svcTitle}`;
        summary = isHe
          ? `"${svcTitle}" מניב ${currSymbol}${rph}/שעה אבל רק ${pct}% מההזמנות`
          : `"${svcTitle}" earns ${currSymbol}${rph}/hr but only ${pct}% of bookings`;
        evidence = isHe
          ? `ההכנסה לשעה של "${svcTitle}" גבוהה מכל שירות אחר אבל הוא מהווה חלק קטן מהפעילות`
          : `"${svcTitle}" has the highest revenue per hour but accounts for a small share of activity`;
        recommendation = isHe
          ? `קדם את "${svcTitle}" -- הוסף לדף הראשי, הריץ מבצע, או הצע ללקוחות קיימים`
          : `Promote "${svcTitle}" -- feature it on your homepage, run a promotion, or suggest to existing clients`;
        break;
      }
      case "price_increase_signal": {
        const { title: svcTitle, capacityPct, price, count } = c.context as Record<string, string | number>;
        title = isHe ? `שירות בתפוסה מלאה - ${svcTitle}` : `Service at capacity - ${svcTitle}`;
        summary = isHe
          ? `"${svcTitle}" צורך ${capacityPct}% מזמן הצוות ומהווה מעל 30% מההזמנות`
          : `"${svcTitle}" uses ${capacityPct}% of staff time and accounts for 30%+ of bookings`;
        evidence = isHe
          ? `${count} הזמנות במחיר ${currSymbol}${price}, ${capacityPct}% ניצול קיבולת`
          : `${count} bookings at ${currSymbol}${price}, ${capacityPct}% capacity usage`;
        recommendation = isHe
          ? `שקול עדכון מחיר ל-"${svcTitle}" -- הביקוש מצביע על כך שהשוק יקבל מחיר גבוה יותר`
          : `Consider a price increase for "${svcTitle}" -- demand indicates the market may accept a higher price`;
        break;
      }
      case "revenue_concentration": {
        const { pct, top1, top2 } = c.context as Record<string, string | number>;
        title = isHe ? "ריכוז הכנסות גבוה" : "High revenue concentration";
        summary = isHe
          ? `${pct}% מההכנסות מגיעות מ-2 שירותים בלבד: "${top1}" ו-"${top2}"`
          : `${pct}% of revenue comes from just 2 services: "${top1}" and "${top2}"`;
        evidence = isHe
          ? `מתוך ${ctx.services.services.length} שירותים פעילים, 2 שירותים שולטים ב-${pct}% מההכנסות`
          : `Out of ${ctx.services.services.length} active services, 2 dominate with ${pct}% of revenue`;
        recommendation = isHe
          ? "גוון את הפורטפוליו -- קדם שירותים אחרים כדי להפחית סיכון"
          : "Diversify your portfolio -- promote other services to reduce risk";
        break;
      }
      case "revenue_trend": {
        const { growthPct, current, previous } = c.context as Record<string, number>;
        const isGrowth = growthPct > 0;
        title = isHe
          ? isGrowth ? "הכנסות בעלייה" : "הכנסות בירידה"
          : isGrowth ? "Revenue growing" : "Revenue declining";
        summary = isHe
          ? `${Math.abs(growthPct)}% ${isGrowth ? "עלייה" : "ירידה"} בהכנסות: ${currSymbol}${previous} → ${currSymbol}${current}`
          : `${Math.abs(growthPct)}% ${isGrowth ? "increase" : "decrease"} in revenue: ${currSymbol}${previous} → ${currSymbol}${current}`;
        evidence = isHe
          ? `${currSymbol}${current} ב-30 יום האחרונים לעומת ${currSymbol}${previous} בתקופה הקודמת`
          : `${currSymbol}${current} in last 30 days vs ${currSymbol}${previous} in previous period`;
        recommendation = isGrowth
          ? (isHe ? "כל הכבוד! שמור על הקצב ושקול להרחיב את ההצעה" : "Great momentum! Maintain the pace and consider expanding your offerings")
          : (isHe ? "בדוק מה גורם לירידה -- מחירים, תחרות, עונתיות?" : "Investigate the cause -- pricing, competition, seasonality?");
        break;
      }
    }

    return {
      id: `${MODULE}:${c.kind}${c.entityRef ? `:${c.entityRef}` : ""}`,
      module: MODULE,
      category: "revenue" as const,
      severity: c.severity,
      claimType: c.kind,
      entityRef: c.entityRef,
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
        { label: isHe ? "הכנסה חודשית" : "Monthly revenue", value: `${currSymbol}${ctx.revenue.currentPeriod}` },
        { label: isHe ? "צמיחה" : "Growth", value: `${ctx.revenue.growthPct}%` },
      ],
      requiresHumanReview: c.dataQuality === "weak" || c.kind === "price_increase_signal" || c.confidence < 0.45,
      dataQuality: c.dataQuality,
      action: { label: isHe ? "צפה בשירותים" : "View services", href: "/dashboard/services" },
    };
  });
}

// ── Exported analyzer ──

export function analyzeRevenue(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const candidates = detect(ctx);
  const scored = score(candidates, ctx);
  return present(scored, locale, ctx);
}
