import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getCardTemplates, getBusinessCustomerCards, getBusinessCardUsageHistory, getCardAnalytics } from "@/lib/db/queries/cards";
import { getBusinessLocale, isModuleEnabled } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CardsDashboard } from "@/components/cards/cards-dashboard";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function PackagesPage() {
  const { businessId } = await requireBusinessOwner();
  if (!(await isModuleEnabled(businessId, "packages"))) redirect("/dashboard");

  const [templates, customerCards, usageHistory, analytics, locale] =
    await Promise.all([
      getCardTemplates(businessId, true),
      getBusinessCustomerCards(businessId),
      getBusinessCardUsageHistory(businessId, 100),
      getCardAnalytics(businessId),
      getBusinessLocale(businessId),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "card.title")}
        description={t(locale, "card.subtitle")}
      >
        <Link
          href="/dashboard/packages/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="size-4" />
          {t(locale, "card.new")}
        </Link>
      </PageHeader>
      <CardsDashboard
        templates={templates}
        customerCards={customerCards}
        usageHistory={usageHistory}
        analytics={analytics}
      />
    </div>
  );
}
