"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/currencies";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/lib/db/schema";
import type { SiteTheme } from "@/lib/themes/presets";
import { CreditCard, ExternalLink, ShoppingBag, Wallet } from "lucide-react";
import { PackagePurchaseButton } from "./package-purchase-button";
import { CardPurchaseButton } from "./card-purchase-button";
import { LocaleProvider } from "@/lib/i18n/locale-context";

type Product = InferSelectModel<typeof products>;

interface CardTemplate {
  id: string;
  name: string;
  description: string | null;
  sessionCount: number;
  price: string;
  expirationDays: number | null;
  services?: Array<{ serviceId: string; serviceName: string }>;
}

interface SiteProductsProps {
  products: Product[];
  currency: string;
  content: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  bookingUrl: string;
  locale: Locale;
  businessId: string;
  cardTemplates?: CardTemplate[];
}

interface DisplayOpts {
  layout: "cards" | "list" | "minimal" | "carousel";
  columns: number;
  showPrices: boolean;
  showDescriptions: boolean;
  showImages: boolean;
  carouselSpeed: "slow" | "medium" | "fast";
}

const SPEED_SECONDS_PER_ITEM: Record<string, number> = {
  slow: 4,
  medium: 2.5,
  fast: 1.2,
};

function parseDisplayOpts(content: Record<string, unknown>): DisplayOpts {
  const layout = (content.layout as string) ?? "cards";
  const valid = ["cards", "list", "minimal", "carousel"] as const;
  const speed = (content.carousel_speed as string) ?? "medium";
  return {
    layout: (valid.includes(layout as any) ? layout : "cards") as DisplayOpts["layout"],
    columns: typeof content.columns === "number" ? content.columns : 4,
    showPrices: content.show_prices !== false,
    showDescriptions: content.show_descriptions !== false,
    showImages: layout === "minimal" ? false : content.show_images !== false,
    carouselSpeed: (["slow", "medium", "fast"].includes(speed) ? speed : "medium") as DisplayOpts["carouselSpeed"],
  };
}

function applyProductOrder(items: Product[], order: unknown): Product[] {
  if (!Array.isArray(order) || order.length === 0) return items;
  const byId = new Map(items.map((p) => [p.id, p]));
  const result: Product[] = [];
  for (const id of order) {
    const p = byId.get(id as string);
    if (p) { result.push(p); byId.delete(id as string); }
  }
  for (const p of byId.values()) result.push(p);
  return result;
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
  cardTemplates = [],
}: SiteProductsProps) {
  const heading =
    (typeof content?.heading === "string" && content.heading) ||
    t(locale, "pub.our_products");
  const subtitle =
    typeof content?.subtitle === "string" ? content.subtitle : "";
  const bgClass = sectionIndex % 2 === 0 ? "bg-white" : "bg-gray-50";
  const opts = parseDisplayOpts(content);
  const sortedProducts = applyProductOrder(productList, content.product_order);

  const purchasableCards = (cardTemplates ?? []).filter((c) => c);
  const hasProducts = sortedProducts.length > 0;
  const hasCards = purchasableCards.length > 0;

  if (!hasProducts && !hasCards) return null;

  const showTabs = hasProducts && hasCards;

  return (
    <section id="products" className={`${bgClass} py-12 sm:py-24`}>
      <div className={opts.layout === "carousel" ? "px-0" : "mx-auto max-w-6xl px-4 sm:px-6"}>
        <div className={`mb-6 text-center sm:mb-12 ${opts.layout === "carousel" ? "px-4 sm:px-6" : ""}`}>
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: "var(--section-heading, #111827)" }}
          >
            {heading}
          </h2>
          {subtitle && (
            <p
              className="mx-auto mt-2 max-w-2xl text-sm sm:mt-4 sm:text-base"
              style={{ color: "var(--section-body, #4b5563)" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {showTabs ? (
          <TabbedContent
            products={sortedProducts}
            cards={purchasableCards}
            currency={currency}
            bookingUrl={bookingUrl}
            theme={theme}
            locale={locale}
            businessId={businessId}
            opts={opts}
          />
        ) : hasProducts ? (
          <ProductGrid
            products={sortedProducts}
            currency={currency}
            bookingUrl={bookingUrl}
            theme={theme}
            locale={locale}
            businessId={businessId}
            opts={opts}
          />
        ) : (
          <LocaleProvider locale={locale}>
            <CardsGrid
              cards={purchasableCards}
              theme={theme}
              locale={locale}
              businessId={businessId}
            />
          </LocaleProvider>
        )}
      </div>
    </section>
  );
}

function TabbedContent({
  products,
  cards,
  currency,
  bookingUrl,
  theme,
  locale,
  businessId,
  opts,
}: {
  products: Product[];
  cards: CardTemplate[];
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
  opts: DisplayOpts;
}) {
  const [tab, setTab] = useState<"products" | "cards">("products");

  return (
    <div>
      <div className="mb-6 flex justify-center sm:mb-8">
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all sm:px-6 sm:py-2 ${
              tab === "products"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShoppingBag className="me-1.5 inline-block size-3.5 sm:size-4" />
            {t(locale, "pub.products_tab")}
          </button>
          <button
            type="button"
            onClick={() => setTab("cards")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all sm:px-6 sm:py-2 ${
              tab === "cards"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Wallet className="me-1.5 inline-block size-3.5 sm:size-4" />
            {t(locale, "pub.cards_tab")}
          </button>
        </div>
      </div>

      {tab === "products" ? (
        <ProductGrid
          products={products}
          currency={currency}
          bookingUrl={bookingUrl}
          theme={theme}
          locale={locale}
          businessId={businessId}
          opts={opts}
        />
      ) : (
        <LocaleProvider locale={locale}>
          <CardsGrid
            cards={cards}
            theme={theme}
            locale={locale}
            businessId={businessId}
          />
        </LocaleProvider>
      )}
    </div>
  );
}

const COL_CLASSES: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-3 xl:grid-cols-4",
};

function ProductGrid({
  products,
  currency,
  bookingUrl,
  theme,
  locale,
  businessId,
  opts,
}: {
  products: Product[];
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
  opts: DisplayOpts;
}) {
  if (opts.layout === "list") {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductListRow
            key={product.id}
            product={product}
            currency={currency}
            bookingUrl={bookingUrl}
            theme={theme}
            locale={locale}
            businessId={businessId}
            opts={opts}
          />
        ))}
      </div>
    );
  }

  if (opts.layout === "minimal") {
    return (
      <div className="mx-auto max-w-6xl divide-y px-4 sm:px-6">
        {products.map((product) => (
          <ProductMinimalRow
            key={product.id}
            product={product}
            currency={currency}
            bookingUrl={bookingUrl}
            theme={theme}
            locale={locale}
            businessId={businessId}
            opts={opts}
          />
        ))}
      </div>
    );
  }

  if (opts.layout === "carousel") {
    return <ProductCarousel products={products} currency={currency} bookingUrl={bookingUrl} theme={theme} locale={locale} businessId={businessId} opts={opts} />;
  }

  const colClass = COL_CLASSES[opts.columns] ?? COL_CLASSES[4];
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-6 ${colClass}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currency={currency}
          bookingUrl={bookingUrl}
          theme={theme}
          locale={locale}
          businessId={businessId}
          opts={opts}
        />
      ))}
    </div>
  );
}

function CardsGrid({
  cards,
  theme,
  locale,
  businessId,
}: {
  cards: CardTemplate[];
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const pricePerSession =
          card.sessionCount > 0
            ? (Number(card.price) / card.sessionCount).toFixed(0)
            : "0";

        return (
          <div
            key={card.id}
            className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="size-5 text-primary" />
                </div>
                <span
                  className="rounded-full px-3 py-1 text-sm font-bold text-white"
                  style={{
                    backgroundColor: theme.secondaryColor || "#6366f1",
                  }}
                >
                  ₪{card.price}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold text-gray-900">
                {card.name}
              </h3>

              {card.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {card.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">
                  {card.sessionCount} {t(locale, "card.sessions")}
                </span>
                <span className="text-gray-300">·</span>
                <span>
                  ₪{pricePerSession} {t(locale, "card.per_session")}
                </span>
                {card.expirationDays ? (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>
                      {t(locale, "card.expires_in", {
                        n: String(card.expirationDays),
                      })}
                    </span>
                  </>
                ) : null}
              </div>

              {(card.services?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {card.services!.map((svc) => (
                    <span
                      key={svc.serviceId}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] text-gray-600"
                    >
                      {svc.serviceName}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex-1" />

              <CardPurchaseButton
                cardTemplateId={card.id}
                businessId={businessId}
                color={theme.secondaryColor || "#6366f1"}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ProductItemProps {
  product: Product;
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
  opts: DisplayOpts;
}

function useProductHelpers(product: Product, currency: string, bookingUrl: string, locale: Locale) {
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

  const linkProps =
    !isPackageProduct && ctaUrl
      ? {
          href: ctaUrl,
          target:
            product.ctaMode === "EXTERNAL_LINK"
              ? ("_blank" as const)
              : undefined,
          rel:
            product.ctaMode === "EXTERNAL_LINK"
              ? "noopener noreferrer"
              : undefined,
        }
      : {};

  return { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps };
}

function ProductCard({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps } =
    useProductHelpers(product, currency, bookingUrl, locale);

  const Wrapper = !isPackageProduct && ctaUrl ? "a" : "div";

  return (
    <Wrapper
      {...linkProps}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
    >
      {opts.showImages && (
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="size-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
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
      )}

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3
          className="text-sm font-semibold sm:text-base"
          style={{ color: "var(--section-heading, #111827)" }}
        >
          {product.title}
        </h3>

        {opts.showDescriptions && product.description && (
          <p
            className="mt-0.5 line-clamp-1 text-[11px] sm:text-xs"
            style={{ color: "var(--section-body, #6b7280)" }}
          >
            {product.description}
          </p>
        )}

        {opts.showPrices && price && (
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

        {!isPackageProduct && ctaUrl && !(opts.showPrices && price) && (
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

function ProductListRow({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps } =
    useProductHelpers(product, currency, bookingUrl, locale);

  const Wrapper = !isPackageProduct && ctaUrl ? "a" : "div";

  return (
    <Wrapper
      {...linkProps}
      className="group flex items-center gap-4 overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md sm:gap-5 sm:p-4"
    >
      {opts.showImages && (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-50 sm:size-24">
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="size-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {isPackageProduct ? <CreditCard className="size-6" /> : product.title.charAt(0)}
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3
          className="text-sm font-semibold sm:text-base"
          style={{ color: "var(--section-heading, #111827)" }}
        >
          {product.title}
        </h3>
        {opts.showDescriptions && product.description && (
          <p
            className="mt-0.5 line-clamp-2 text-xs sm:text-sm"
            style={{ color: "var(--section-body, #6b7280)" }}
          >
            {product.description}
          </p>
        )}
      </div>

      <div className="shrink-0 text-end">
        {opts.showPrices && price && (
          <span
            className="inline-block rounded-lg px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: theme.secondaryColor }}
          >
            {price}
          </span>
        )}
        {isPackageProduct && (
          <div className="mt-2">
            <PackagePurchaseButton
              productId={product.id}
              businessId={businessId}
              color={theme.secondaryColor}
            />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

function ProductMinimalRow({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { price, isPackageProduct, ctaUrl, linkProps } =
    useProductHelpers(product, currency, bookingUrl, locale);

  const Wrapper = !isPackageProduct && ctaUrl ? "a" : "div";

  return (
    <Wrapper
      {...linkProps}
      className="group flex items-center justify-between gap-4 px-1 py-4 transition-colors hover:bg-gray-50/60"
    >
      <div className="min-w-0 flex-1">
        <h3
          className="text-sm font-semibold sm:text-base"
          style={{ color: "var(--section-heading, #111827)" }}
        >
          {product.title}
        </h3>
        {opts.showDescriptions && product.description && (
          <p
            className="mt-0.5 line-clamp-1 text-xs"
            style={{ color: "var(--section-body, #6b7280)" }}
          >
            {product.description}
          </p>
        )}
      </div>

      {opts.showPrices && price && (
        <span
          className="shrink-0 text-sm font-bold"
          style={{ color: theme.secondaryColor }}
        >
          {price}
        </span>
      )}

      {isPackageProduct && (
        <PackagePurchaseButton
          productId={product.id}
          businessId={businessId}
          color={theme.secondaryColor}
        />
      )}
    </Wrapper>
  );
}

function ProductCarousel({
  products,
  currency,
  bookingUrl,
  theme,
  locale,
  businessId,
  opts,
}: {
  products: Product[];
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
  opts: DisplayOpts;
}) {
  const doubled = [...products, ...products];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none sm:w-20 rtl:bg-gradient-to-l" />
      <div className="absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none sm:w-20 rtl:bg-gradient-to-r" />

      <div className="flex animate-marquee gap-4 sm:gap-6 py-2">
        {doubled.map((product, i) => (
          <div key={`${product.id}-${i}`} className="w-56 shrink-0 sm:w-72">
            <ProductCard
              product={product}
              currency={currency}
              bookingUrl={bookingUrl}
              theme={theme}
              locale={locale}
              businessId={businessId}
              opts={opts}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee ${Math.max(products.length * (SPEED_SECONDS_PER_ITEM[opts.carouselSpeed] ?? 2.5), 8)}s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        [dir="rtl"] .animate-marquee {
          animation-name: marquee-rtl;
        }
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}
