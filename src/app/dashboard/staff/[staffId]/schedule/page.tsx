import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getStaffMemberById, getStaffSchedule, getStaffTimeOff, getStaffBlockedSlots } from "@/lib/db/queries/staff";
import { PageHeader } from "@/components/shared/page-header";
import { StaffScheduleForm } from "@/components/staff/staff-schedule-form";
import { StaffTimeOffList } from "@/components/staff/staff-time-off-list";
import { StaffBlockedSlots } from "@/components/staff/staff-blocked-slots";
import { t } from "@/lib/i18n";

const locale = "he";

interface Props {
  params: Promise<{ staffId: string }>;
}

export default async function StaffSchedulePage({ params }: Props) {
  await requireBusinessOwner();
  const { staffId } = await params;

  const member = await getStaffMemberById(staffId);
  if (!member) {
    notFound();
  }

  const [schedule, timeOff, blockedSlots] = await Promise.all([
    getStaffSchedule(staffId),
    getStaffTimeOff(staffId),
    getStaffBlockedSlots(staffId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title={t(locale, "staff.schedule_title", { name: member.name })}
        description={t(locale, "staff.schedule_subtitle")}
      />
      <StaffScheduleForm staffId={staffId} schedule={schedule} />
      <StaffTimeOffList staffId={staffId} timeOff={timeOff} />
      <StaffBlockedSlots staffId={staffId} blockedSlots={blockedSlots} />
    </div>
  );
}
