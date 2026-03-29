import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getProducts } from "@/lib/db/queries/products";
import { getBusinessLocale, getBusinessCurrency, isModuleEnabled } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ProductList } from "@/components/products/product-list";
import { CreateProductButton } from "@/components/products/create-product-button";

export default async function ProductsPage() {
  const { businessId } = await requireBusinessOwner();
  if (!(await isModuleEnabled(businessId, "products"))) redirect("/dashboard");

  const [productList, locale, currency] = await Promise.all([
    getProducts(businessId),
    getBusinessLocale(businessId),
    getBusinessCurrency(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "prod.title")}
        description={t(locale, "prod.subtitle")}
      >
        <CreateProductButton />
      </PageHeader>
      <ProductList
        products={productList}
        businessId={businessId}
        currency={currency}
      />
    </div>
  );
}
