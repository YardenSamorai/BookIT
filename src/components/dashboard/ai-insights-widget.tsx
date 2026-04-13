import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Info,
  ArrowRight,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Locale } from "@/lib/i18n";
import type { AnalysisResult, InsightSeverity } from "@/lib/ai/types";

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { icon: typeof Sparkles; iconColor: string; bgColor: string; borderColor: string }
> = {
  critical: {
    icon: AlertTriangle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  warning: {
    icon: ShieldAlert,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  opportunity: {
    icon: Lightbulb,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  info: {
    icon: Info,
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

function ConfidenceDot({ score }: { score: number }) {
  const color =
    score >= 0.7 ? "bg-green-500" : score >= 0.45 ? "bg-amber-500" : "bg-gray-400";
  return <span className={`inline-block size-2 rounded-full ${color}`} title={`${Math.round(score * 100)}% confidence`} />;
}

export function AiInsightsWidget({
  insights,
  locale,
}: {
  insights: AnalysisResult[];
  locale: Locale;
}) {
  const k = (key: string) => key as Parameters<typeof t>[1];

  if (insights.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gray-100">
            <Sparkles className="size-6 text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t(locale, k("ai.no_insights"))}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-violet-50/80 to-blue-50/80 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500">
              <Sparkles className="size-4 text-white" />
            </div>
            {t(locale, k("ai.insights_title"))}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          {t(locale, k("ai.insights_subtitle"))}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {insights.map((insight) => {
            const cfg = SEVERITY_CONFIG[insight.severity];
            const Icon = cfg.icon;

            return (
              <div key={insight.id} className="flex gap-3 px-5 py-3.5">
                <div
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${cfg.bgColor}`}
                >
                  <Icon className={`size-4 ${cfg.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {insight.title}
                      </p>
                      <ConfidenceDot score={insight.confidenceScore} />
                      {insight.requiresHumanReview && (
                        <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-700" title={locale === "he" ? "דורש בדיקה" : "Needs review"}>
                          {locale === "he" ? "לבדיקה" : "Review"}
                        </span>
                      )}
                    </div>
                    {insight.estimatedRevenueImpact != null && (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${cfg.borderColor} ${cfg.iconColor}`}
                      >
                        {insight.estimatedRevenueImpact > 0 ? "+" : ""}
                        {insight.estimatedRevenueImpact.toLocaleString()}{" "}
                        {locale === "he" ? "₪" : "ILS"}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {insight.summary}
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-700">
                    {insight.recommendation}
                  </p>
                  {insight.supportingMetrics.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {insight.supportingMetrics.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                        >
                          <span className="font-medium">{m.label}:</span> {m.value}
                          {m.periodLabel && (
                            <span className="text-gray-400">({m.periodLabel})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {insight.action.label}
                      <ArrowRight className="size-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AiInsightsTeaser({ locale }: { locale: Locale }) {
  const k = (key: string) => key as Parameters<typeof t>[1];

  return (
    <Card className="border-dashed bg-gradient-to-r from-violet-50/50 to-blue-50/50">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center sm:flex-row sm:text-start">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
          <Lock className="size-5 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {t(locale, k("ai.upgrade_title"))}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(locale, k("ai.upgrade_desc"))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
