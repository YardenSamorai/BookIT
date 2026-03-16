import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { getWeekAppointments } from "@/lib/db/queries/appointments";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";

function getWeekStart(offset: number): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + offset * 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { businessId } = await requireBusinessOwner();
  const params = await searchParams;
  const weekOffset = parseInt(params.week ?? "0", 10) || 0;
  const weekStart = getWeekStart(weekOffset);

  const [staff, appointments, locale] = await Promise.all([
    getStaffMembers(businessId),
    getWeekAppointments(businessId, weekStart),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "cal.title")}
        description={t(locale, "cal.subtitle")}
      />
      <CalendarView
        staff={staff}
        appointments={appointments}
        weekStartIso={weekStart.toISOString()}
        weekOffset={weekOffset}
      />
    </div>
  );
}
