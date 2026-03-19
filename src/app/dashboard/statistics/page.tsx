import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getStatisticsData } from "@/lib/db/queries/statistics";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { StatisticsCharts } from "@/components/statistics/statistics-charts";

export default async function StatisticsPage() {
  const { businessId } = await requireBusinessOwner();
  const locale = await getBusinessLocale(businessId);
  const data = await getStatisticsData(businessId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "stats.title")}
        description={t(locale, "stats.subtitle")}
      />
      <StatisticsCharts data={data} locale={locale} />
    </div>
  );
}
