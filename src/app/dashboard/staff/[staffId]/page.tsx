import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getStaffMemberById } from "@/lib/db/queries/staff";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { StaffFormPage } from "@/components/staff/staff-form-page";

interface Props {
  params: Promise<{ staffId: string }>;
}

export default async function StaffDetailPage({ params }: Props) {
  const { businessId } = await requireBusinessOwner();
  const { staffId } = await params;

  const [member, locale] = await Promise.all([
    getStaffMemberById(staffId),
    getBusinessLocale(businessId),
  ]);

  if (!member) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "staff.edit", { name: member.name })}
        description={t(locale, "staff.edit_subtitle")}
      />
      <StaffFormPage
        defaultValues={{
          id: member.id,
          name: member.name,
          phone: member.phone ?? "",
          notifyOwner: member.notifyOwner,
          roleTitle: member.roleTitle ?? "",
          bio: member.bio ?? "",
          imageUrl: member.imageUrl ?? "",
          isActive: member.isActive,
        }}
      />
    </div>
  );
}
