import { requireBusinessOwner } from "@/lib/auth/guards";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { StaffList } from "@/components/staff/staff-list";
import { CreateStaffButton } from "@/components/staff/create-staff-button";

export default async function StaffPage() {
  const { businessId } = await requireBusinessOwner();
  const [staff, locale] = await Promise.all([
    getStaffMembers(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "staff.title")}
        description={t(locale, "staff.subtitle")}
      >
        <CreateStaffButton />
      </PageHeader>
      <StaffList members={staff} />
    </div>
  );
}
