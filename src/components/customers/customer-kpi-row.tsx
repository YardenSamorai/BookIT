"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CheckCircle, CreditCard, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { CustomerProfile } from "@/lib/db/queries/customers";

interface Props {
  customer: CustomerProfile;
}

export function CustomerKpiRow({ customer }: Props) {
  const t = useT();

  const unpaid = parseFloat(customer.unpaidBalance) || 0;
  const lastVisit = customer.lastVisitDate
    ? getRelativeDate(new Date(customer.lastVisitDate), t)
    : t("cust.never");

  const kpis = [
    {
      icon: <Calendar className="size-4 text-blue-500" />,
      label: t("cust.upcoming_appointments"),
      value: String(customer.upcomingAppointments),
      alert: false,
    },
    {
      icon: <CheckCircle className="size-4 text-green-500" />,
      label: t("cust.total_visits"),
      value: String(customer.totalVisits),
      alert: false,
    },
    {
      icon: <CreditCard className="size-4 text-purple-500" />,
      label: t("cust.active_cards"),
      value: String(customer.activeCards),
      alert: false,
    },
    {
      icon: <DollarSign className={`size-4 ${unpaid > 0 ? "text-red-500" : "text-muted-foreground"}`} />,
      label: t("cust.unpaid_balance"),
      value: unpaid > 0 ? `₪${unpaid.toFixed(0)}` : "₪0",
      alert: unpaid > 0,
    },
    {
      icon: <Clock className="size-4 text-muted-foreground" />,
      label: t("cust.last_visit"),
      value: lastVisit,
      alert: false,
    },
    {
      icon: <AlertTriangle className={`size-4 ${customer.noShowCount >= 3 ? "text-orange-500" : "text-muted-foreground"}`} />,
      label: t("cust.no_show_count"),
      value: String(customer.noShowCount),
      alert: customer.noShowCount >= 3,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="relative">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              {kpi.icon}
              <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{kpi.value}</p>
            {kpi.alert && (
              <span className="absolute top-2 end-2 size-2 rounded-full bg-red-500" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getRelativeDate(
  date: Date,
  t: (key: Parameters<ReturnType<typeof import("@/lib/i18n/locale-context").useT>>[0], vars?: Record<string, string | number>) => string
): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("cust.today");
  if (diffDays < 60) return t("cust.days_ago", { n: diffDays });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
