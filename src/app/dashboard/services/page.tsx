import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { isModuleEnabled, getBusinessLocale } from "@/lib/db/queries/business";
import { getServices, getServiceCategories, getServicePackages, getServiceStaffLinks } from "@/lib/db/queries/services";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ServicesTabs } from "@/components/services/services-tabs";
import { CreateServiceButton } from "@/components/services/create-service-button";

export default async function ServicesPage() {
  const { businessId } = await requireBusinessOwner();
  if (!(await isModuleEnabled(businessId, "services"))) redirect("/dashboard");

  const [serviceList, categories, packages, staff, serviceStaffLinks, locale] = await Promise.all([
    getServices(businessId),
    getServiceCategories(businessId),
    getServicePackages(businessId),
    getStaffMembers(businessId),
    getServiceStaffLinks(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "svc.title")}
        description={t(locale, "svc.subtitle")}
      >
        <CreateServiceButton />
      </PageHeader>
      <ServicesTabs
        services={serviceList}
        categories={categories}
        packages={packages}
        staff={staff}
        serviceStaffLinks={serviceStaffLinks}
      />
    </div>
  );
}
