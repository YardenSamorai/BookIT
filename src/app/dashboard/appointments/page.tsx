import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getAppointmentsForBusiness } from "@/lib/db/queries/appointments";
import { getServices } from "@/lib/db/queries/services";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { AppointmentList } from "@/components/appointments/appointment-list";

export default async function AppointmentsPage() {
  const { businessId } = await requireBusinessOwner();

  const [appointmentList, locale, servicesList, staffList] = await Promise.all([
    getAppointmentsForBusiness(businessId),
    getBusinessLocale(businessId),
    getServices(businessId),
    getStaffMembers(businessId),
  ]);

  const servicesForImport = servicesList.map((s) => ({
    id: s.id,
    name: s.title,
    durationMinutes: s.durationMinutes,
    price: s.price,
  }));

  const staffForImport = staffList.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "apt.title")}
        description={t(locale, "apt.subtitle")}
      />
      <AppointmentList
        appointments={appointmentList}
        services={servicesForImport}
        staff={staffForImport}
      />
    </div>
  );
}
