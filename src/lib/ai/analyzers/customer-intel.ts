import type { BusinessContext } from "../business-context";
import type { AnalysisResult, InsightSeverity, Locale } from "../types";
import { computeConfidence, computeEffectSize, toDataQuality } from "../confidence";

const MODULE = "customer_intel";

// ── Phase 1: Detect ──

type CandidateKind = "customer_retention" | "vip_at_risk" | "low_return_rate" | "customer_churn";

interface Candidate {
  kind: CandidateKind;
  metric: number;
  baseline: number;
  sampleSize: number;
  context: Record<string, unknown>;
}

function detect(ctx: BusinessContext): Candidate[] {
  const totalCustomers = ctx.customers.totalCustomers;

  // Hard gate
  if (totalCustomers < 15) return [];

  const isPartial = totalCustomers < 30;
  const candidates: Candidate[] = [];
  const { segments, returnRate30d, vipAtRisk } = ctx.customers;

  // 1. Customer retention overview (always emitted for partial+)
  if (segments.atRisk > 0 || segments.churned > 0) {
    const atRiskPct = totalCustomers > 0 ? segments.atRisk / totalCustomers : 0;
    candidates.push({
      kind: "customer_retention",
      metric: atRiskPct,
      baseline: 0.10,
      sampleSize: totalCustomers,
      context: {
        vip: segments.vip, regular: segments.regular, atRisk: segments.atRisk,
        churned: segments.churned, newRecent: segments.newRecent,
      },
    });
  }

  // Partial data: suppress churn trends and vipAtRisk
  if (isPartial) return candidates;

  // 2. VIP at-risk (VIP customers who haven't visited in 30+ days)
  if (vipAtRisk.length > 0) {
    candidates.push({
      kind: "vip_at_risk",
      metric: vipAtRisk.length,
      baseline: 0,
      sampleSize: segments.vip || 1,
      context: { customers: vipAtRisk, vipTotal: segments.vip },
    });
  }

  // 3. Low return rate
  if (returnRate30d < 40 && totalCustomers >= 20) {
    candidates.push({
      kind: "low_return_rate",
      metric: returnRate30d / 100,
      baseline: 0.50,
      sampleSize: totalCustomers,
      context: { returnRate: returnRate30d, newCustomers: ctx.customers.newCustomers30d },
    });
  }

  // 4. Churn spike
  if (segments.churned >= 3) {
    const churnPct = segments.churned / totalCustomers;
    if (churnPct >= 0.10) {
      candidates.push({
        kind: "customer_churn",
        metric: churnPct,
        baseline: 0.05,
        sampleSize: totalCustomers,
        context: { churned: segments.churned, pct: Math.round(churnPct * 100) },
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
  const totalCustomers = ctx.customers.totalCustomers;
  const isPartial = totalCustomers < 30;

  const results: ScoredCandidate[] = [];
  for (const c of candidates) {
    let minDelta: number, maxDelta: number;
    switch (c.kind) {
      case "customer_retention": minDelta = 0.05; maxDelta = 0.25; break;
      case "vip_at_risk": minDelta = 1; maxDelta = 5; break;
      case "low_return_rate": minDelta = 0.05; maxDelta = 0.30; break;
      case "customer_churn": minDelta = 0.03; maxDelta = 0.15; break;
    }

    const effectSize = computeEffectSize(
      c.kind === "vip_at_risk" ? c.metric : Math.abs(c.metric - c.baseline),
      0,
      minDelta,
      maxDelta,
    );
    if (effectSize === 0) continue;

    const confidence = computeConfidence({
      sampleSize: c.sampleSize,
      minSampleRequired: c.kind === "vip_at_risk" ? 5 : 10,
      consistencyWeeks: 4,
      totalWeeksObserved: 4,
      recencyWeight: 0.6,
      dataCompleteness: isPartial ? 0.5 : 0.85,
    });

    let cappedConfidence = confidence;
    const dq = toDataQuality(cappedConfidence);
    if (dq === "weak") cappedConfidence = Math.min(cappedConfidence, 0.45);

    const priority = Math.round(effectSize * 50 + cappedConfidence * 30 + (c.kind === "vip_at_risk" ? 15 : 5));
    const severity: InsightSeverity =
      c.kind === "vip_at_risk" ? "warning"
      : c.kind === "customer_churn" ? "warning"
      : c.kind === "low_return_rate" ? "opportunity"
      : "info";

    results.push({ ...c, confidence: cappedConfidence, effectSize, priority, severity, dataQuality: dq });
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
      case "customer_retention": {
        const { vip, regular, atRisk, churned, newRecent } = c.context as Record<string, number>;
        title = isHe ? "סקירת נאמנות לקוחות" : "Customer loyalty overview";
        summary = isHe
          ? `${atRisk} לקוחות בסיכון, ${churned} נטשו. ${vip} VIP, ${regular} קבועים, ${newRecent} חדשים`
          : `${atRisk} at-risk, ${churned} churned. ${vip} VIP, ${regular} regular, ${newRecent} new`;
        evidence = isHe
          ? `${ctx.customers.totalCustomers} לקוחות סה"כ. שיעור חזרה: ${ctx.customers.returnRate30d}%`
          : `${ctx.customers.totalCustomers} total customers. Return rate: ${ctx.customers.returnRate30d}%`;
        recommendation = isHe
          ? "צור קשר עם לקוחות בסיכון -- שלח הודעה אישית או הצעה מיוחדת"
          : "Reach out to at-risk customers -- send a personal message or special offer";
        break;
      }
      case "vip_at_risk": {
        const customers = c.context.customers as Array<{ name: string; lastVisit: string; totalSpend: number }>;
        const vipTotal = c.context.vipTotal as number;
        const names = customers.slice(0, 3).map((c) => c.name).join(", ");
        title = isHe ? "לקוחות VIP בסיכון" : "VIP customers at risk";
        summary = isHe
          ? `${customers.length} לקוחות VIP לא ביקרו 30+ יום${customers.length > 3 ? ` (כולל ${names}...)` : ` (${names})`}`
          : `${customers.length} VIP customers haven't visited in 30+ days${customers.length > 3 ? ` (including ${names}...)` : ` (${names})`}`;
        evidence = isHe
          ? `${customers.length} מתוך ${vipTotal} לקוחות VIP לא חזרו. הוצאה ממוצעת: ${currSymbol}${Math.round(customers.reduce((s, c) => s + c.totalSpend, 0) / customers.length)}`
          : `${customers.length} of ${vipTotal} VIPs haven't returned. Avg spend: ${currSymbol}${Math.round(customers.reduce((s, c) => s + c.totalSpend, 0) / customers.length)}`;
        recommendation = isHe
          ? "צור קשר אישי עם הלקוחות הללו -- הצע הטבה VIP או בדוק מה קרה"
          : "Personally reach out to these customers -- offer a VIP perk or check what happened";
        break;
      }
      case "low_return_rate": {
        const { returnRate, newCustomers } = c.context as Record<string, number>;
        title = isHe ? "שיעור חזרה נמוך" : "Low return rate";
        summary = isHe
          ? `רק ${returnRate}% מהלקוחות חוזרים לביקור נוסף`
          : `Only ${returnRate}% of customers return for a second visit`;
        evidence = isHe
          ? `${newCustomers} לקוחות חדשים ב-30 יום, שיעור חזרה ${returnRate}%`
          : `${newCustomers} new customers in 30 days, ${returnRate}% return rate`;
        recommendation = isHe
          ? "שקול מערכת נאמנות, תזכורת מעקב אחרי ביקור ראשון, או הצעה מיוחדת ללקוחות חדשים"
          : "Consider a loyalty program, follow-up reminder after first visit, or special offer for new customers";
        break;
      }
      case "customer_churn": {
        const { churned, pct } = c.context as Record<string, number>;
        title = isHe ? "עלייה בנטישת לקוחות" : "Customer churn rising";
        summary = isHe
          ? `${churned} לקוחות (${pct}%) לא חזרו יותר מ-60 יום`
          : `${churned} customers (${pct}%) haven't returned in 60+ days`;
        evidence = isHe
          ? `${pct}% מבסיס הלקוחות סווגו כנוטשים (ללא ביקור 60+ יום)`
          : `${pct}% of customer base classified as churned (no visit in 60+ days)`;
        recommendation = isHe
          ? "נתח למה לקוחות עוזבים -- בדוק שביעות רצון, מחירים, ותחרות"
          : "Analyze why customers leave -- check satisfaction, pricing, and competition";
        break;
      }
    }

    return {
      id: `${MODULE}:${c.kind}`,
      module: MODULE,
      category: "customers" as const,
      severity: c.severity,
      claimType: c.kind,
      title,
      summary,
      evidence,
      recommendation,
      priorityScore: c.priority,
      confidenceScore: c.confidence,
      effectSize: c.effectSize,
      timeframe: "this_month" as const,
      supportingMetrics: [
        { label: isHe ? "לקוחות" : "Customers", value: String(ctx.customers.totalCustomers) },
        { label: isHe ? "שיעור חזרה" : "Return rate", value: `${ctx.customers.returnRate30d}%`, periodLabel: "30d" },
      ],
      requiresHumanReview: c.dataQuality === "weak" || c.confidence < 0.45,
      dataQuality: c.dataQuality,
      action: { label: isHe ? "צפה בלקוחות" : "View customers", href: "/dashboard/customers" },
    };
  });
}

// ── Exported analyzer ──

export function analyzeCustomers(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const candidates = detect(ctx);
  const scored = score(candidates, ctx);
  return present(scored, locale, ctx);
}
