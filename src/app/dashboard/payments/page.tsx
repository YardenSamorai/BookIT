import { requireBusinessOwner } from "@/lib/auth/guards";
import { getPaymentData } from "@/lib/db/queries/dashboard";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/currencies";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PaymentTable } from "@/components/payments/payment-table";
import { DollarSign, TrendingUp, CalendarDays } from "lucide-react";

export default async function PaymentsPage() {
  const { businessId } = await requireBusinessOwner();

  const [data, locale] = await Promise.all([
    getPaymentData(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "pay.title")}
        description={t(locale, "pay.subtitle")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={t(locale, "pay.total_revenue")}
          value={formatPrice(data.totalRevenue, data.currency)}
          icon={DollarSign}
        />
        <StatsCard
          title={t(locale, "pay.month_revenue")}
          value={formatPrice(data.monthRevenue, data.currency)}
          icon={TrendingUp}
        />
        <StatsCard
          title={t(locale, "pay.avg_per_apt")}
          value={formatPrice(data.avgPerAppointment, data.currency)}
          icon={CalendarDays}
        />
      </div>

      <PaymentTable
        transactions={data.transactions}
        currency={data.currency}
      />
    </div>
  );
}
