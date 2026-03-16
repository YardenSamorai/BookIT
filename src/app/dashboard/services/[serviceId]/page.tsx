import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getServiceById } from "@/lib/db/queries/services";
import { getServiceCategories } from "@/lib/db/queries/services";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceEditPage } from "@/components/services/service-edit-page";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";
import { getBusinessLocale } from "@/lib/db/queries/business";


interface Props {
  params: Promise<{ serviceId: string }>;
}

export default async function EditServicePage({ params }: Props) {
  const { serviceId } = await params;
  const { businessId } = await requireBusinessOwner();

  const [service, categories, locale] = await Promise.all([
    getServiceById(serviceId),
    getServiceCategories(businessId),
    getBusinessLocale(businessId),
  ]);

  if (!service || service.businessId !== businessId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/services"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="me-1 size-4" />
          {t(locale, "common.back")}
        </Link>
        <PageHeader
          title={t(locale, "svc.edit_title", { title: service.title })}
          description={t(locale, "svc.edit_subtitle")}
        />
      </div>
      <ServiceEditPage service={service} categories={categories} />
    </div>
  );
}
