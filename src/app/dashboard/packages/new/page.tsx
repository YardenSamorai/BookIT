import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getServices } from "@/lib/db/queries/services";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CardTemplateForm } from "@/components/cards/card-template-form";

export default async function NewCardTemplatePage() {
  const { businessId } = await requireBusinessOwner();
  const [locale, serviceList] = await Promise.all([
    getBusinessLocale(businessId),
    getServices(businessId),
  ]);

  const activeServices = serviceList.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "card.new")}
      />
      <CardTemplateForm
        businessId={businessId}
        services={activeServices}
      />
    </div>
  );
}
