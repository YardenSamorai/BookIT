"use client";

import { CreditCard, DollarSign, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n/locale-context";

interface CardAnalyticsProps {
  data: {
    activeCards: number;
    totalRevenue: string;
    sessionsUsedThisMonth: number;
    avgUsageRate: string;
  };
}

export function CardAnalytics({ data }: CardAnalyticsProps) {
  const t = useT();

  const stats = [
    {
      label: t("card.analytics_active"),
      value: String(data.activeCards),
      icon: CreditCard,
    },
    {
      label: t("card.analytics_revenue"),
      value: `₪${Number(data.totalRevenue).toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: t("card.analytics_sessions_month"),
      value: String(data.sessionsUsedThisMonth),
      icon: Calendar,
    },
    {
      label: t("card.analytics_avg_usage"),
      value: `${data.avgUsageRate}%`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
