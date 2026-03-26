import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getClassSchedules } from "@/lib/db/queries/classes";
import { getServices } from "@/lib/db/queries/services";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ClassScheduleList } from "@/components/classes/class-schedule-list";

export default async function ClassesPage() {
  const { businessId } = await requireBusinessOwner();
  const locale = await getBusinessLocale(businessId);
  const [schedules, allServices, allStaff] = await Promise.all([
    getClassSchedules(businessId),
    getServices(businessId, { includeAutoManaged: true }),
    getStaffMembers(businessId),
  ]);

  const serializableServices = allServices.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    isGroup: s.isGroup,
    durationMinutes: s.durationMinutes,
    autoManaged: s.autoManaged,
    maxParticipants: s.maxParticipants,
    paymentMode: s.paymentMode,
    approvalType: s.approvalType,
    price: s.price,
    depositAmount: s.depositAmount,
    cancelHoursBefore: s.cancelHoursBefore,
    rescheduleHoursBefore: s.rescheduleHoursBefore,
  }));

  const serializableStaff = allStaff.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "cls.title")}
        description={t(locale, "cls.subtitle")}
      />
      <ClassScheduleList
        businessId={businessId}
        schedules={schedules}
        services={serializableServices}
        staff={serializableStaff}
      />
    </div>
  );
}
