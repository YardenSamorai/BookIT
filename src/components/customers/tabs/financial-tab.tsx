"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, DollarSign } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { FinancialActivityRow } from "@/lib/db/queries/customers";
import type { CustomerCardRow } from "@/lib/db/queries/cards";

const PAY_BADGE: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  UNPAID: { label: "Unpaid", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  ON_SITE: { label: "On-Site", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  FREE: { label: "Free", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  PACKAGE: { label: "Package", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  DEPOSIT_PAID: { label: "Deposit", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  REFUNDED: { label: "Refunded", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

interface Props {
  financialActivity: FinancialActivityRow[];
  customerCards: CustomerCardRow[];
}

export function FinancialTab({ financialActivity, customerCards }: Props) {
  const t = useT();
  const locale = useLocale();

  const totalPaidAppointments = financialActivity
    .filter((r) => r.type === "appointment" && r.paymentStatus === "PAID" && r.amount)
    .reduce((sum, r) => sum + parseFloat(r.amount!), 0);

  const totalPaidCards = customerCards
    .filter((c) => c.paymentStatus === "PAID")
    .reduce((sum, c) => sum + parseFloat(c.templateSnapshotPrice), 0);

  const totalPaid = totalPaidAppointments + totalPaidCards;

  const totalUnpaid = financialActivity
    .filter(
      (r) =>
        r.type === "appointment" &&
        r.paymentStatus === "UNPAID" &&
        r.status !== "CANCELLED" &&
        r.amount &&
        parseFloat(r.amount) > 0
    )
    .reduce((sum, r) => sum + parseFloat(r.amount!), 0);

  const cardCount = customerCards.length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("cust.total_paid")}</p>
            <p className="text-lg font-bold text-green-600 tabular-nums">₪{totalPaid.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("cust.total_unpaid")}</p>
            <p className={`text-lg font-bold tabular-nums ${totalUnpaid > 0 ? "text-red-600" : "text-muted-foreground"}`}>
              ₪{totalUnpaid.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">{t("cust.card_purchases")}</p>
            <p className="text-lg font-bold tabular-nums">{cardCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity list */}
      {financialActivity.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <DollarSign className="size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("cust.no_financial")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {financialActivity.map((item) => {
            const badge = PAY_BADGE[item.paymentStatus] ?? PAY_BADGE.UNPAID;
            const dateStr = new Date(item.date).toLocaleDateString(
              locale === "he" ? "he-IL" : "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <div key={`${item.type}-${item.id}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.type === "card" ? (
                      <CreditCard className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Calendar className="size-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{dateStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.amount && (
                      <span className="text-sm font-medium tabular-nums">
                        ₪{parseFloat(item.amount).toFixed(0)}
                      </span>
                    )}
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
