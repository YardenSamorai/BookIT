import type { BusinessContext } from "./business-context";
import type { AnalysisResult, Analyzer, Locale } from "./types";
import { analyzeDeadHours } from "./analyzers/dead-hours";
import { analyzeCancellations } from "./analyzers/cancellation-intel";
import { analyzeSchedule } from "./analyzers/schedule-optimizer";
import { analyzeDemand } from "./analyzers/demand-forecaster";
import { analyzeRevenue } from "./analyzers/revenue-optimizer";
import { analyzeCustomers } from "./analyzers/customer-intel";

const MAX_RESULTS = 8;

const ANALYZERS: Analyzer[] = [
  analyzeDeadHours,
  analyzeCancellations,
  analyzeSchedule,
  analyzeDemand,
  analyzeRevenue,
  analyzeCustomers,
];

// ── 1. Collect ──

function collect(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const all: AnalysisResult[] = [];
  for (const analyze of ANALYZERS) {
    try {
      all.push(...analyze(ctx, locale));
    } catch {
      // Module failure must not crash the pipeline
    }
  }
  return all;
}

// ── 2. Deduplicate ──
// Semantically dedup by (claimType, entityRef, contextKey).
// If two results share all three, keep the one with higher effectSize.

function deduplicate(results: AnalysisResult[]): AnalysisResult[] {
  const seen = new Map<string, AnalysisResult>();
  for (const r of results) {
    const key = `${r.claimType}|${r.entityRef ?? ""}|${r.contextKey ?? ""}`;
    const existing = seen.get(key);
    if (!existing || r.effectSize > existing.effectSize) {
      seen.set(key, r);
    }
  }
  return [...seen.values()];
}

// ── 3. Normalize ──
// Per-module percentile normalization with small-N stabilization.
// For 1 result: clamp to 50. For 2: clamp to [35,65]. For 3: [20,80].

function normalize(results: AnalysisResult[]): AnalysisResult[] {
  const byModule = new Map<string, AnalysisResult[]>();
  for (const r of results) {
    const arr = byModule.get(r.module) ?? [];
    arr.push(r);
    byModule.set(r.module, arr);
  }

  const normalized: AnalysisResult[] = [];
  for (const [, group] of byModule) {
    if (group.length === 0) continue;

    if (group.length === 1) {
      normalized.push({ ...group[0], priorityScore: 50 });
      continue;
    }

    const sorted = [...group].sort((a, b) => a.priorityScore - b.priorityScore);
    const n = sorted.length;

    let floor: number, ceil: number;
    if (n === 2) { floor = 35; ceil = 65; }
    else if (n === 3) { floor = 20; ceil = 80; }
    else { floor = 10; ceil = 90; }

    const minP = sorted[0].priorityScore;
    const maxP = sorted[n - 1].priorityScore;
    const range = maxP - minP || 1;

    for (const r of sorted) {
      const pctl = (r.priorityScore - minP) / range;
      const normalizedScore = Math.round(floor + pctl * (ceil - floor));
      normalized.push({ ...r, priorityScore: normalizedScore });
    }
  }
  return normalized;
}

// ── 4. Composite rank ──

function compositeScore(r: AnalysisResult): number {
  return (
    r.priorityScore * 0.35 +
    r.effectSize * 100 * 0.25 +
    r.confidenceScore * 100 * 0.25 +
    Math.min((r.estimatedRevenueImpact ?? 0) / 500, 100) * 0.15
  );
}

// ── 5. Category diversity ──
// Ensure at least 1 result from each category present, up to MAX_RESULTS.

function diverseTopN(results: AnalysisResult[], limit: number): AnalysisResult[] {
  const ranked = [...results].sort((a, b) => compositeScore(b) - compositeScore(a));
  if (ranked.length <= limit) return ranked;

  const categories = new Set(ranked.map((r) => r.category));
  const picked: AnalysisResult[] = [];
  const usedIds = new Set<string>();

  // First pass: pick top from each category
  for (const cat of categories) {
    const top = ranked.find((r) => r.category === cat && !usedIds.has(r.id));
    if (top) {
      picked.push(top);
      usedIds.add(top.id);
    }
  }

  // Second pass: fill remaining slots by composite score
  for (const r of ranked) {
    if (picked.length >= limit) break;
    if (!usedIds.has(r.id)) {
      picked.push(r);
      usedIds.add(r.id);
    }
  }

  return picked;
}

// ── Public API ──

export function orchestrate(ctx: BusinessContext, locale: Locale): AnalysisResult[] {
  const raw = collect(ctx, locale);
  const deduped = deduplicate(raw);
  const normed = normalize(deduped);
  const final = diverseTopN(normed, MAX_RESULTS);
  return final;
}
