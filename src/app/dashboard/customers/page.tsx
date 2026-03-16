import { requireBusinessOwner } from "@/lib/auth/guards";
import { getCustomersForBusiness } from "@/lib/db/queries/customers";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerList } from "@/components/customers/customer-list";

export default async function CustomersPage() {
  const { businessId } = await requireBusinessOwner();
  const [customers, locale] = await Promise.all([
    getCustomersForBusiness(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "cust.title")}
        description={t(locale, "cust.subtitle")}
      />
      <CustomerList customers={customers} />
    </div>
  );
}
