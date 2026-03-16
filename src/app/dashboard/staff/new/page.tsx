import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { StaffFormPage } from "@/components/staff/staff-form-page";

export default async function NewStaffPage() {
  const { businessId } = await requireBusinessOwner();
  const locale = await getBusinessLocale(businessId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "staff.new_member")}
        description={t(locale, "staff.new_member_desc")}
      />
      <StaffFormPage />
    </div>
  );
}
