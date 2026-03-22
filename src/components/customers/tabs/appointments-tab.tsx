"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerProfile } from "@/lib/db/queries/customers";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const PAY_STATUS_COLORS: Record<string, string> = {
  PAID: "text-green-600",
  UNPAID: "text-red-600",
  ON_SITE: "text-blue-600",
  FREE: "text-gray-500",
  PACKAGE: "text-purple-600",
  DEPOSIT_PAID: "text-amber-600",
  REFUNDED: "text-gray-500",
};

interface Props {
  customer: CustomerProfile;
  onBook: () => void;
}

export function AppointmentsTab({ customer, onBook }: Props) {
  const t = useT();
  const locale = useLocale();
  const now = new Date();

  const upcoming = customer.appointments.filter(
    (a) => new Date(a.startTime) > now && a.status !== "CANCELLED"
  );
  const past = customer.appointments.filter(
    (a) => new Date(a.startTime) <= now || a.status === "CANCELLED"
  );

  if (customer.appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Calendar className="size-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("cust.no_appointments")}</p>
        <Button size="sm" onClick={onBook}>
          {t("cust.book_first")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t("cust.upcoming_section")} ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {t("cust.past_section")} ({past.length})
          </h3>
          <div className="space-y-2">
            {past.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} locale={locale} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentRow({
  apt,
  locale,
  t,
}: {
  apt: CustomerProfile["appointments"][number];
  locale: string;
  t: ReturnType<typeof useT>;
}) {
  const dateStr = new Date(apt.startTime).toLocaleDateString(
    locale === "he" ? "he-IL" : "en-US",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div className="rounded-lg border p-3">
      {/* Mobile: card layout */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{apt.serviceName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span>{apt.staffName}</span>
            <span>{dateStr}</span>
            {apt.paymentAmount && (
              <span className={PAY_STATUS_COLORS[apt.paymentStatus] ?? ""}>
                ₪{parseFloat(apt.paymentAmount).toFixed(0)} · {apt.paymentStatus}
              </span>
            )}
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[apt.status] ?? ""}`}
        >
          {t(`dash.status_${apt.status.toLowerCase()}` as Parameters<typeof t>[0])}
        </span>
      </div>
    </div>
  );
}
