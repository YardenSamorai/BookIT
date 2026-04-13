export type InsightCategory =
  | "scheduling"
  | "revenue"
  | "customers"
  | "operations"
  | "classes";

export type InsightSeverity = "critical" | "warning" | "opportunity" | "info";

export type DataQuality = "strong" | "moderate" | "weak" | "insufficient";

export interface SupportingMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  periodLabel?: string;
}

export interface AnalysisResult {
  id: string;
  module: string;
  category: InsightCategory;
  severity: InsightSeverity;

  claimType: string;
  entityRef?: string;
  contextKey?: string;

  title: string;
  summary: string;
  evidence: string;
  recommendation: string;

  priorityScore: number;
  confidenceScore: number;
  effectSize: number;
  estimatedRevenueImpact?: number;
  timeframe: "immediate" | "this_week" | "this_month" | "long_term";

  supportingMetrics: SupportingMetric[];
  requiresHumanReview: boolean;
  dataQuality: DataQuality;

  action?: {
    label: string;
    href: string;
  };
}

export type Locale = "en" | "he";

export type Analyzer = (
  ctx: import("./business-context").BusinessContext,
  locale: Locale,
) => AnalysisResult[];
