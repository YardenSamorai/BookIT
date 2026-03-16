import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getCustomerDetail } from "@/lib/db/queries/customers";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerDetailView } from "@/components/customers/customer-detail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const { businessId } = await requireBusinessOwner();
  const [customer, locale] = await Promise.all([
    getCustomerDetail(customerId, businessId),
    getBusinessLocale(businessId),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        description={t(locale, "cust.detail")}
      />
      <CustomerDetailView customer={customer} businessId={businessId} />
    </div>
  );
}
