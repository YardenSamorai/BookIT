import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { getServices, getServiceStaffLinks } from "@/lib/db/queries/services";
import { getCalendarData } from "@/lib/db/queries/calendar-data";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarShell } from "@/components/calendar/calendar-shell";

function getMonthRange(year: number, month: number) {
  const first = new Date(year, month, 1);
  const dow = first.getDay();
  const rangeStart = new Date(first);
  rangeStart.setDate(rangeStart.getDate() - dow);
  rangeStart.setHours(0, 0, 0, 0);

  const last = new Date(year, month + 1, 0);
  const endDow = last.getDay();
  const rangeEnd = new Date(last);
  rangeEnd.setDate(rangeEnd.getDate() + (6 - endDow) + 1);
  rangeEnd.setHours(0, 0, 0, 0);

  return { rangeStart, rangeEnd, firstOfMonth: first };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { businessId } = await requireBusinessOwner();
  const params = await searchParams;

  const view = (params.view === "day" || params.view === "month") ? params.view : "week";
  const baseDate = params.date ? new Date(params.date) : new Date();
  if (isNaN(baseDate.getTime())) baseDate.setTime(Date.now());

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const { rangeStart, rangeEnd } = getMonthRange(year, month);

  const [staff, servicesList, serviceStaffLinks, calendarData, locale] =
    await Promise.all([
      getStaffMembers(businessId),
      getServices(businessId, { includeAutoManaged: true }),
      getServiceStaffLinks(businessId),
      getCalendarData(businessId, rangeStart, rangeEnd),
      getBusinessLocale(businessId),
    ]);

  const activeServices = servicesList
    .filter((s) => s.isActive)
    .map((s) => ({ id: s.id, title: s.title, durationMinutes: s.durationMinutes }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "cal.title")}
        description={t(locale, "cal.subtitle")}
      />
      <CalendarShell
        staff={staff}
        services={activeServices}
        serviceStaffLinks={serviceStaffLinks}
        businessId={businessId}
        appointments={calendarData.appointments}
        classInstances={calendarData.classInstances}
        staffSchedules={calendarData.staffSchedules}
        staffBlockedSlots={calendarData.staffBlockedSlots}
        staffTimeOff={calendarData.staffTimeOff}
        businessHours={calendarData.businessHours}
        initialView={view}
        initialDate={baseDate.toISOString()}
      />
    </div>
  );
}
