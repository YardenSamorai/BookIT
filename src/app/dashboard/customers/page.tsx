import { requireBusinessOwner } from "@/lib/auth/guards";
import { getCustomersForBusiness } from "@/lib/db/queries/customers";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getStaffMembers } from "@/lib/db/queries/staff";
import { getServices, getServiceStaffLinks } from "@/lib/db/queries/services";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerList } from "@/components/customers/customer-list";

export default async function CustomersPage() {
  const { businessId } = await requireBusinessOwner();
  const [customers, staffList, servicesList, serviceStaffLinks, locale] = await Promise.all([
    getCustomersForBusiness(businessId),
    getStaffMembers(businessId),
    getServices(businessId),
    getServiceStaffLinks(businessId),
    getBusinessLocale(businessId),
  ]);

  const activeServices = servicesList
    .filter((s) => s.isActive)
    .map((s) => ({ id: s.id, title: s.title, durationMinutes: s.durationMinutes, isGroup: s.isGroup }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "cust.title")}
        description={t(locale, "cust.subtitle")}
      />
      <CustomerList
        customers={customers}
        businessId={businessId}
        staff={staffList.map((s) => ({ id: s.id, name: s.name }))}
        services={activeServices}
        serviceStaffLinks={serviceStaffLinks}
      />
    </div>
  );
}
