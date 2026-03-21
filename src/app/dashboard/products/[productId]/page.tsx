import { notFound } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getProductById } from "@/lib/db/queries/products";
import { getServicePackages } from "@/lib/db/queries/services";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ProductFormPage } from "@/components/products/product-form-page";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { businessId } = await requireBusinessOwner();
  const { productId } = await params;

  const [product, locale, packages] = await Promise.all([
    getProductById(productId, businessId),
    getBusinessLocale(businessId),
    getServicePackages(businessId),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "prod.edit")}
        description={t(locale, "prod.edit_desc")}
      />
      <ProductFormPage businessId={businessId} product={product} servicePackages={packages} />
    </div>
  );
}
