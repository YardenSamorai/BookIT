import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getAppointmentDetail } from "@/lib/db/queries/appointments";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { businessId } = await requireBusinessOwner();
  const { appointmentId } = await params;

  const [appointment, locale] = await Promise.all([
    getAppointmentDetail(appointmentId, businessId),
    getBusinessLocale(businessId),
  ]);

  if (!appointment) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "apt.detail_title")}
        description={t(locale, "apt.detail_subtitle")}
      />
      <AppointmentDetail appointment={appointment} />
    </div>
  );
}
