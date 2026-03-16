import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ProductFormPage } from "@/components/products/product-form-page";

export default async function NewProductPage() {
  const { businessId } = await requireBusinessOwner();
  const locale = await getBusinessLocale(businessId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "prod.new")}
        description={t(locale, "prod.new_desc")}
      />
      <ProductFormPage businessId={businessId} />
    </div>
  );
}
