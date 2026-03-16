import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getAppointmentsForBusiness } from "@/lib/db/queries/appointments";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { AppointmentList } from "@/components/appointments/appointment-list";

export default async function AppointmentsPage() {
  const { businessId } = await requireBusinessOwner();

  const [appointmentList, locale] = await Promise.all([
    getAppointmentsForBusiness(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "apt.title")}
        description={t(locale, "apt.subtitle")}
      />
      <AppointmentList appointments={appointmentList} />
    </div>
  );
}
