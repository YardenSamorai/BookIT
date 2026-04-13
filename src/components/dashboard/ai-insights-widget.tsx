"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Info,
  ArrowRight,
  Lock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Locale } from "@/lib/i18n";
import type { AnalysisResult, InsightSeverity } from "@/lib/ai/types";

const SEVERITY_CONFIG: Record<
  InsightSeverity,
  { icon: typeof Sparkles; iconColor: string; textColor: string; bgColor: string; borderColor: string; badgeBg: string }
> = {
  critical: {
    icon: AlertTriangle,
    iconColor: "text-red-600",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    badgeBg: "bg-red-100",
  },
  warning: {
    icon: ShieldAlert,
    iconColor: "text-amber-600",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeBg: "bg-amber-100",
  },
  opportunity: {
    icon: Lightbulb,
    iconColor: "text-blue-600",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeBg: "bg-blue-100",
  },
  info: {
    icon: Info,
    iconColor: "text-gray-500",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    badgeBg: "bg-gray-100",
  },
};

const STORAGE_KEY = "ai-insights-collapsed";

export function AiInsightsWidget({
  insights,
  locale,
}: {
  insights: AnalysisResult[];
  locale: Locale;
}) {
  const k = (key: string) => key as Parameters<typeof t>[1];
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }

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

  const criticalCount = insights.filter((i) => i.severity === "critical" || i.severity === "warning").length;

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      {/* Header — always visible, clickable to toggle */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-3.5 bg-gradient-to-r from-violet-50/80 via-blue-50/60 to-transparent border-b transition-colors hover:from-violet-50 hover:via-blue-50/80"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-sm">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="text-start">
            <p className="text-sm font-bold text-gray-900">
              {t(locale, k("ai.insights_title"))}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t(locale, k("ai.insights_subtitle"))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {collapsed && criticalCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              <AlertTriangle className="size-3" />
              {criticalCount}
            </span>
          )}
          {collapsed && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {insights.length} {locale === "he" ? "תובנות" : "insights"}
            </span>
          )}
          <div className="flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            {collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </div>
        </div>
      </button>

      {/* Collapsible content */}
      {!collapsed && (
        <div className="divide-y divide-gray-100">
          {insights.map((insight) => {
            const cfg = SEVERITY_CONFIG[insight.severity];
            const Icon = cfg.icon;

            return (
              <div key={insight.id} className="flex gap-3.5 px-5 py-4 transition-colors hover:bg-gray-50/50">
                <div
                  className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${cfg.bgColor} ${cfg.borderColor} border`}
                >
                  <Icon className={`size-4.5 ${cfg.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900">
                        {insight.title}
                      </p>
                      {insight.requiresHumanReview && (
                        <span className={`shrink-0 rounded-md ${cfg.badgeBg} px-1.5 py-0.5 text-[9px] font-bold ${cfg.textColor}`}>
                          {locale === "he" ? "לבדיקה" : "Review"}
                        </span>
                      )}
                    </div>
                    {insight.estimatedRevenueImpact != null && (
                      <span
                        className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${cfg.borderColor} ${cfg.bgColor} ${cfg.textColor}`}
                      >
                        {insight.estimatedRevenueImpact > 0 ? "+" : ""}
                        {insight.estimatedRevenueImpact.toLocaleString()}
                        {locale === "he" ? "₪" : " ILS"}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-[13px] leading-relaxed text-gray-600">
                    {insight.summary}
                  </p>

                  {/* Recommendation */}
                  <div className={`rounded-lg ${cfg.bgColor} border ${cfg.borderColor} px-3 py-2`}>
                    <p className={`text-xs font-medium ${cfg.textColor}`}>
                      {insight.recommendation}
                    </p>
                  </div>

                  {/* Metrics */}
                  {insight.supportingMetrics.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {insight.supportingMetrics.map((m, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-[11px] text-gray-600"
                        >
                          <span className="font-semibold text-gray-800">{m.label}:</span> {m.value}
                          {m.periodLabel && (
                            <span className="text-gray-400">({m.periodLabel})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action link */}
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className={`mt-0.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${cfg.bgColor} ${cfg.textColor} hover:opacity-80`}
                    >
                      {insight.action.label}
                      <ArrowRight className="size-3 rtl:rotate-180" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
