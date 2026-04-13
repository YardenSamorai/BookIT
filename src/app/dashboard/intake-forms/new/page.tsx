import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { IntakeFormBuilder } from "@/components/intake-forms/intake-form-builder";

export default async function NewIntakeFormPage() {
  const { businessId } = await requireBusinessOwner();
  const locale = await getBusinessLocale(businessId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "intake.create" as never)}
        description={t(locale, "intake.subtitle" as never)}
      />
      <IntakeFormBuilder />
    </div>
  );
}
