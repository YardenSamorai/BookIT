import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getServices } from "@/lib/db/queries/services";
import { getCardTemplateById } from "@/lib/db/queries/cards";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CardTemplateForm } from "@/components/cards/card-template-form";
import { notFound } from "next/navigation";

export default async function EditCardTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { businessId } = await requireBusinessOwner();

  const [locale, template, serviceList] = await Promise.all([
    getBusinessLocale(businessId),
    getCardTemplateById(id),
    getServices(businessId, { includeAutoManaged: true }),
  ]);

  if (!template || template.businessId !== businessId) {
    notFound();
  }

  const activeServices = serviceList.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <PageHeader title={t(locale, "card.edit")} />
      <CardTemplateForm
        businessId={businessId}
        services={activeServices}
        template={template}
      />
    </div>
  );
}
