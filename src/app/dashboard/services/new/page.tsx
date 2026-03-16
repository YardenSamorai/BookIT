import { requireBusinessOwner } from "@/lib/auth/guards";
import { getServiceCategories } from "@/lib/db/queries/services";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceFormPage } from "@/components/services/service-form-page";

export default async function NewServicePage() {
  const { businessId } = await requireBusinessOwner();
  const [categories, staff, locale] = await Promise.all([
    getServiceCategories(businessId),
    getStaffMembers(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "svc.new_service")}
        description={t(locale, "svc.new_service_desc")}
      />
      <ServiceFormPage categories={categories} staff={staff} />
    </div>
  );
}
