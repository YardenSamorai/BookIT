export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import {
  getCustomerProfile,
  getCustomerPackages,
  getCustomerActivities,
  getCustomerFinancialActivity,
} from "@/lib/db/queries/customers";
import { getServicePackages } from "@/lib/db/queries/services";
import { getCustomerCards, getCardTemplates } from "@/lib/db/queries/cards";
import { CustomerProfileView } from "@/components/customers/customer-profile";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const { businessId } = await requireBusinessOwner();

  const [
    customer,
    customerPkgs,
    servicePkgs,
    customerCardsList,
    cardTemplatesList,
    activities,
    financialActivity,
  ] = await Promise.all([
    getCustomerProfile(customerId, businessId),
    getCustomerPackages(customerId, businessId),
    getServicePackages(businessId),
    getCustomerCards(customerId, businessId),
    getCardTemplates(businessId),
    getCustomerActivities(customerId, businessId, 20, 0),
    getCustomerFinancialActivity(customerId, businessId),
  ]);

  if (!customer) notFound();

  return (
    <CustomerProfileView
      customer={customer}
      businessId={businessId}
      activities={activities}
      financialActivity={financialActivity}
      customerCards={customerCardsList}
      cardTemplates={cardTemplatesList}
      customerPackages={customerPkgs}
      servicePackages={servicePkgs}
    />
  );
}
