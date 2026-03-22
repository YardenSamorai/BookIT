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

  const purchasableCards = (cardTemplates ?? []).filter((c) => c);
  const hasProducts = productList.length > 0;
  const hasCards = purchasableCards.length > 0;

  if (!hasProducts && !hasCards) return null;

  const showTabs = hasProducts && hasCards;

  return (
    <section id="products" className={`${bgClass} py-12 sm:py-24`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 text-center sm:mb-12">
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
            products={productList}
            cards={purchasableCards}
            currency={currency}
            bookingUrl={bookingUrl}
            theme={theme}
            locale={locale}
            businessId={businessId}
          />
        ) : hasProducts ? (
          <ProductGrid
            products={productList}
            currency={currency}
            bookingUrl={bookingUrl}
            theme={theme}
            locale={locale}
            businessId={businessId}
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
}: {
  products: Product[];
  cards: CardTemplate[];
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
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

function ProductGrid({
  products,
  currency,
  bookingUrl,
  theme,
  locale,
  businessId,
}: {
  products: Product[];
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
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

  return (
    <Wrapper
      {...linkProps}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
    >
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

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3
          className="text-sm font-semibold sm:text-base"
          style={{ color: "var(--section-heading, #111827)" }}
        >
          {product.title}
        </h3>

        {product.description && (
          <p
            className="mt-0.5 line-clamp-1 text-[11px] sm:text-xs"
            style={{ color: "var(--section-body, #6b7280)" }}
          >
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
