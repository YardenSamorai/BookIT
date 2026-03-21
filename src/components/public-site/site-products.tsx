import { t, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/currencies";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/lib/db/schema";
import type { SiteTheme } from "@/lib/themes/presets";
import { CreditCard, ExternalLink, ShoppingBag } from "lucide-react";
import { PackagePurchaseButton } from "./package-purchase-button";

type Product = InferSelectModel<typeof products>;

interface SiteProductsProps {
  products: Product[];
  currency: string;
  content: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  bookingUrl: string;
  locale: Locale;
  businessId: string;
}

export function SiteProducts({
  products: productList,
  currency,
  content,
  theme,
  sectionIndex,
  bookingUrl,
  locale,
  businessId,
}: SiteProductsProps) {
  const heading =
    (typeof content?.heading === "string" && content.heading) ||
    t(locale, "pub.our_products");
  const subtitle =
    typeof content?.subtitle === "string" ? content.subtitle : "";
  const bgClass = sectionIndex % 2 === 0 ? "bg-white" : "bg-gray-50";

  if (productList.length === 0) return null;

  return (
    <section id="products" className={`${bgClass} py-12 sm:py-24`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 text-center sm:mb-12">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight text-gray-900`}
          >
            {heading}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:mt-4 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {productList.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              bookingUrl={bookingUrl}
              theme={theme}
              locale={locale}
              businessId={businessId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({
  product,
  currency,
  bookingUrl,
  theme,
  locale,
  businessId,
}: {
  product: Product;
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
}) {
  const image = product.images?.[0];
  const price = product.price ? formatPrice(product.price, currency) : null;
  const isPackageProduct = !!product.servicePackageId;

  const ctaUrl =
    product.ctaMode === "EXTERNAL_LINK"
      ? product.externalUrl
      : product.ctaMode === "BOOK_SERVICE"
        ? bookingUrl
        : null;
  const ctaLabel =
    product.ctaText ||
    (product.ctaMode === "BOOK_SERVICE"
      ? t(locale, "pub.book_now")
      : t(locale, "pub.learn_more"));

  const Wrapper = !isPackageProduct && ctaUrl ? "a" : "div";
  const linkProps = !isPackageProduct && ctaUrl
    ? {
        href: ctaUrl,
        target: product.ctaMode === "EXTERNAL_LINK" ? ("_blank" as const) : undefined,
        rel: product.ctaMode === "EXTERNAL_LINK" ? "noopener noreferrer" : undefined,
      }
    : {};

  return (
    <Wrapper
      {...linkProps}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={product.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-3xl font-bold text-white sm:text-4xl"
            style={{ backgroundColor: theme.secondaryColor }}
          >
            {isPackageProduct ? (
              <CreditCard className="size-10 sm:size-12" />
            ) : (
              product.title.charAt(0)
            )}
          </div>
        )}
        {isPackageProduct && (
          <div className="absolute start-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow-sm backdrop-blur sm:text-xs">
            <CreditCard className="size-3" />
            {t(locale, "pkg.customer_title" as never)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
          {product.title}
        </h3>

        {product.description && (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 sm:text-xs">
            {product.description}
          </p>
        )}

        {price && (
          <div className="mt-2 sm:mt-3">
            <span
              className="inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-white sm:text-sm"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {price}
            </span>
          </div>
        )}

        {isPackageProduct && (
          <PackagePurchaseButton
            productId={product.id}
            businessId={businessId}
            color={theme.secondaryColor}
          />
        )}

        {!isPackageProduct && ctaUrl && !price && (
          <div className="mt-2 sm:mt-3">
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white sm:text-sm"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {product.ctaMode === "EXTERNAL_LINK" ? (
                <ExternalLink className="size-3" />
              ) : (
                <ShoppingBag className="size-3" />
              )}
              {ctaLabel}
            </span>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
