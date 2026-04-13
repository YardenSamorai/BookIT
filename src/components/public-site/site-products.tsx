"use client";

import { useState, useRef, useCallback } from "react";
import { t, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils/currencies";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/lib/db/schema";
import type { SiteTheme } from "@/lib/themes/presets";
import { CreditCard, ExternalLink, ShoppingBag, Wallet, Plus } from "lucide-react";
import { PackagePurchaseButton } from "./package-purchase-button";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { useCart } from "./cart/cart-context";

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
  layout: "cards" | "showcase" | "list" | "minimal";
  columns: number;
  showPrices: boolean;
  showDescriptions: boolean;
  showImages: boolean;
  marquee: boolean;
  marqueeSpeed: "slow" | "medium" | "fast";
}

const SPEED_SECONDS_PER_ITEM: Record<string, number> = {
  slow: 4,
  medium: 2.5,
  fast: 1.2,
};

function parseDisplayOpts(content: Record<string, unknown>): DisplayOpts {
  const raw = (content.layout as string) ?? "cards";
  const valid = ["cards", "showcase", "list", "minimal"] as const;
  const layout = (valid.includes(raw as any) ? raw : raw === "carousel" ? "cards" : "cards") as DisplayOpts["layout"];
  const speed = (content.marquee_speed as string) || (content.carousel_speed as string) || "medium";
  return {
    layout,
    columns: typeof content.columns === "number" ? content.columns : 4,
    showPrices: content.show_prices !== false,
    showDescriptions: content.show_descriptions !== false,
    showImages: layout === "minimal" ? false : content.show_images !== false,
    marquee: content.marquee === true || raw === "carousel",
    marqueeSpeed: (["slow", "medium", "fast"].includes(speed) ? speed : "medium") as DisplayOpts["marqueeSpeed"],
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
      <div className={opts.marquee ? "px-0" : "mx-auto max-w-6xl px-4 sm:px-6"}>
        <div className={`mb-6 text-center sm:mb-12 ${opts.marquee ? "px-4 sm:px-6" : ""}`}>
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
  const CardComponent = opts.layout === "showcase" ? ProductShowcaseCard
    : opts.layout === "list" ? ProductListRow
    : opts.layout === "minimal" ? ProductMinimalRow
    : ProductCard;

  if (opts.marquee) {
    return (
      <ProductMarquee
        products={products}
        currency={currency}
        bookingUrl={bookingUrl}
        theme={theme}
        locale={locale}
        businessId={businessId}
        opts={opts}
        CardComponent={CardComponent}
      />
    );
  }

  if (opts.layout === "showcase") {
    const showcaseCols: Record<number, string> = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-3" };
    const colClass = showcaseCols[opts.columns] ?? showcaseCols[3];
    return (
      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 ${colClass}`}>
        {products.map((product) => (
          <ProductShowcaseCard
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

function CardAddToCartButton({
  card,
  locale,
  accentColor,
}: {
  card: CardTemplate;
  locale: Locale;
  accentColor: string;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={() =>
        addItem({
          productId: `card-${card.id}`,
          title: card.name,
          price: Number(card.price),
          image: null,
        })
      }
      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
      style={{ backgroundColor: accentColor }}
    >
      <Plus className="size-4" />
      {t(locale, "cart.add" as never)}
    </button>
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

              <CardAddToCartButton
                card={card}
                locale={locale}
                accentColor={theme.secondaryColor || "#6366f1"}
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

  const canAddToCart = !isPackageProduct && !!product.price && Number(product.price) > 0;

  return { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps, canAddToCart };
}

function AddToCartButton({
  product,
  locale,
  accentColor,
  size = "sm",
}: {
  product: Product;
  locale: Locale;
  accentColor: string;
  size?: "sm" | "lg";
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem({
          productId: product.id,
          title: product.title,
          price: Number(product.price),
          image: product.images?.[0] ?? null,
        });
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97] ${
        size === "lg" ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
      }`}
      style={{ backgroundColor: accentColor }}
    >
      <Plus className={size === "lg" ? "size-4" : "size-3.5"} />
      {t(locale, "cart.add" as never)}
    </button>
  );
}

function ProductCard({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps, canAddToCart } =
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

        <div className="flex-1" />

        <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3">
          {opts.showPrices && price && (
            <span
              className="inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-white sm:text-sm"
              style={{ backgroundColor: theme.secondaryColor }}
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

          {canAddToCart && (
            <AddToCartButton product={product} locale={locale} accentColor={theme.secondaryColor} />
          )}
        </div>
      </div>
    </Wrapper>
  );
}

function ProductListRow({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps, canAddToCart } =
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

      <div className="flex shrink-0 items-center gap-2">
        {opts.showPrices && price && (
          <span
            className="inline-block rounded-lg px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: theme.secondaryColor }}
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
        {canAddToCart && (
          <AddToCartButton product={product} locale={locale} accentColor={theme.secondaryColor} />
        )}
      </div>
    </Wrapper>
  );
}

function ProductMinimalRow({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { price, isPackageProduct, ctaUrl, linkProps, canAddToCart } =
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

      <div className="flex shrink-0 items-center gap-2">
        {opts.showPrices && price && (
          <span
            className="text-sm font-bold"
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

        {canAddToCart && (
          <AddToCartButton product={product} locale={locale} accentColor={theme.secondaryColor} />
        )}
      </div>
    </Wrapper>
  );
}

function ProductShowcaseCard({ product, currency, bookingUrl, theme, locale, businessId, opts }: ProductItemProps) {
  const { image, price, isPackageProduct, ctaUrl, ctaLabel, linkProps, canAddToCart } =
    useProductHelpers(product, currency, bookingUrl, locale);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {opts.showImages && (
        <div
          className="relative aspect-square overflow-hidden"
          style={{ backgroundColor: "#ffffff" }}
        >
          {image ? (
            <img
              src={image}
              alt={product.title}
              className="size-full object-contain p-6 drop-shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-2deg]"
              loading="lazy"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              {isPackageProduct ? (
                <CreditCard className="size-16 text-gray-300" />
              ) : (
                <span className="text-6xl font-black text-gray-200">
                  {product.title.charAt(0)}
                </span>
              )}
            </div>
          )}

          {isPackageProduct && (
            <div className="absolute start-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-md backdrop-blur-sm">
              <CreditCard className="size-3.5" />
              {t(locale, "pkg.customer_title" as never)}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col border-t border-gray-100 bg-gradient-to-b from-white to-gray-50/50 p-5 sm:p-6">
        <h3
          className="text-xl font-bold tracking-tight"
          style={{ color: "var(--section-heading, #111827)" }}
        >
          {product.title}
        </h3>

        {opts.showDescriptions && product.description && (
          <p
            className="mt-2 text-sm leading-relaxed line-clamp-3"
            style={{ color: "var(--section-body, #6b7280)" }}
          >
            {product.description}
          </p>
        )}

        <div className="flex-1" />

        <div className="mt-5 flex items-end justify-between gap-4">
          {opts.showPrices && price ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {t(locale, "pub.price" as never)}
              </p>
              <p className="text-2xl font-black text-gray-900">{price}</p>
            </div>
          ) : (
            <div />
          )}

          {isPackageProduct ? (
            <PackagePurchaseButton
              productId={product.id}
              businessId={businessId}
              color={theme.secondaryColor}
            />
          ) : ctaUrl ? (
            <a
              {...linkProps}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-gray-800 hover:shadow-lg active:scale-[0.97]"
            >
              {ctaLabel}
            </a>
          ) : canAddToCart ? (
            <AddToCartButton product={product} locale={locale} accentColor={theme.secondaryColor} size="lg" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

const MARQUEE_ITEM_WIDTH: Record<DisplayOpts["layout"], string> = {
  cards: "w-56 sm:w-72",
  showcase: "w-72 sm:w-80",
  list: "w-72 sm:w-96",
  minimal: "w-56 sm:w-72",
};

function ProductMarquee({
  products,
  currency,
  bookingUrl,
  theme,
  locale,
  businessId,
  opts,
  CardComponent,
}: {
  products: Product[];
  currency: string;
  bookingUrl: string;
  theme: SiteTheme;
  locale: Locale;
  businessId: string;
  opts: DisplayOpts;
  CardComponent: React.ComponentType<ProductItemProps>;
}) {
  const DRAG_THRESHOLD = 6;
  const doubled = [...products, ...products];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    pending: false,
    active: false,
    startX: 0,
    startY: 0,
    offset: 0,
    pointerId: -1,
  });
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const freezeStrip = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    drag.current.offset = matrix.m41;
    el.style.animation = "none";
    el.style.transform = `translateX(${matrix.m41}px)`;
  }, []);

  const resumeStrip = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      const el = stripRef.current;
      if (!el) return;
      el.style.animation = "";
      el.style.transform = "";
    }, 2000);
  }, []);

  const handleDown = useCallback((e: React.PointerEvent) => {
    const tag = (e.target as HTMLElement).closest("button, a, input, [role='button']");
    if (tag) return;

    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    drag.current.pending = true;
    drag.current.active = false;
    drag.current.startX = e.clientX;
    drag.current.startY = e.clientY;
    drag.current.pointerId = e.pointerId;
    freezeStrip();
  }, [freezeStrip]);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.pending && !drag.current.active) return;

    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;

    if (drag.current.pending && !drag.current.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.current.pending = false;
      drag.current.active = true;
      wrapperRef.current?.setPointerCapture(e.pointerId);
    }

    const el = stripRef.current;
    if (!el) return;
    el.style.transform = `translateX(${drag.current.offset + dx}px)`;
  }, []);

  const handleUp = useCallback((e: React.PointerEvent) => {
    const wasDragging = drag.current.active;
    drag.current.pending = false;
    drag.current.active = false;

    if (wasDragging) {
      const el = stripRef.current;
      if (el) {
        const matrix = new DOMMatrix(getComputedStyle(el).transform);
        drag.current.offset = matrix.m41;
      }
      try { wrapperRef.current?.releasePointerCapture(e.pointerId); } catch {}
    }

    resumeStrip();
  }, [resumeStrip]);

  const dur = Math.max(products.length * (SPEED_SECONDS_PER_ITEM[opts.marqueeSpeed] ?? 2.5), 8);
  const widthClass = MARQUEE_ITEM_WIDTH[opts.layout] ?? MARQUEE_ITEM_WIDTH.cards;

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden"
      style={{ touchAction: "pan-y" }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <div className="absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none sm:w-20 rtl:bg-gradient-to-l" />
      <div className="absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none sm:w-20 rtl:bg-gradient-to-r" />

      <div
        ref={stripRef}
        className="flex prod-marquee-strip gap-4 sm:gap-6 py-2"
        style={{ cursor: "grab" }}
      >
        {doubled.map((product, i) => (
          <div key={`${product.id}-${i}`} className={`${widthClass} shrink-0`}>
            <CardComponent
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
        @keyframes prod-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .prod-marquee-strip {
          animation: prod-marquee ${dur}s linear infinite;
        }
        .prod-marquee-strip:hover {
          animation-play-state: paused;
        }
        [dir="rtl"] .prod-marquee-strip {
          animation-name: prod-marquee-rtl;
        }
        @keyframes prod-marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}
