"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils/currencies";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { Receipt } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

interface Transaction {
  id: string;
  date: string;
  serviceTitle: string;
  staffName: string;
  customerName: string;
  amount: string;
  paymentStatus: string;
}

interface PaymentTableProps {
  transactions: Transaction[];
  currency: string;
}

const STATUS_CONFIG: Record<
  string,
  { key: TranslationKey; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PAID: { key: "pay.status_paid", variant: "default" },
  UNPAID: { key: "pay.status_unpaid", variant: "secondary" },
  ON_SITE: { key: "pay.status_on_site", variant: "outline" },
  FREE: { key: "pay.status_free", variant: "secondary" },
  PACKAGE: { key: "pay.status_package", variant: "outline" },
  DEPOSIT_PAID: { key: "pay.status_deposit", variant: "default" },
  REFUNDED: { key: "pay.status_refunded", variant: "destructive" },
};

export function PaymentTable({ transactions, currency }: PaymentTableProps) {
  const t = useT();
  const locale = useLocale();

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Receipt className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("pay.no_transactions")}</p>
            <p className="text-sm text-muted-foreground">
              {t("pay.no_transactions_desc")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("pay.transactions")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-start font-medium">{t("pay.date")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("pay.customer")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("pay.service")}</th>
                <th className="hidden px-4 py-3 text-start font-medium sm:table-cell">
                  {t("apt.staff")}
                </th>
                <th className="px-4 py-3 text-end font-medium">{t("pay.amount")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("pay.payment_status")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const config = STATUS_CONFIG[tx.paymentStatus] ?? STATUS_CONFIG.UNPAID;
                const date = new Date(tx.date);
                const formattedDate = date.toLocaleDateString(
                  locale === "he" ? "he-IL" : "en-US",
                  { month: "short", day: "numeric", year: "numeric" }
                );

                return (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formattedDate}
                    </td>
                    <td className="px-4 py-3">{tx.customerName}</td>
                    <td className="px-4 py-3">{tx.serviceTitle}</td>
                    <td className="hidden px-4 py-3 sm:table-cell text-muted-foreground">
                      {tx.staffName}
                    </td>
                    <td className="px-4 py-3 text-end font-medium">
                      {formatPrice(tx.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Badge variant={config.variant} className="text-xs">
                        {t(config.key)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
