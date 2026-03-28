"use client";

import { useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import type { services } from "@/lib/db/schema";
import type { SiteTheme } from "@/lib/themes/presets";
import { Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/utils/currencies";
import { t, type Locale } from "@/lib/i18n";
import { AnimatedStagger } from "./animated-section";

type Service = InferSelectModel<typeof services>;

interface SiteServicesProps {
  services: Service[];
  currency: string;
  content?: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  bookingUrl: string;
  locale: Locale;
}

const DEFAULT_H = "var(--section-heading, #111827)";
const DEFAULT_B = "var(--section-body, #6b7280)";
const DEFAULT_M = "var(--section-body, #9ca3af)";

interface SvcColors {
  H: string;
  B: string;
  M: string;
  btnStyle: React.CSSProperties;
}

export function SiteServices({
  services: serviceList,
  currency,
  content = {},
  theme,
  sectionIndex,
  bookingUrl,
  locale,
}: SiteServicesProps) {
  const [showAll, setShowAll] = useState(false);

  if (serviceList.length === 0) return null;

  const title = (content.title as string) || t(locale, "pub.our_services");
  const subtitle =
    (content.subtitle as string) ||
    t(locale, "pub.services_subtitle");
  const showPrices = content.show_prices !== false;
  const showDuration = content.show_duration !== false;
  const cardLayout = (content.card_layout as string) || "grid";
  const primaryCount = (content.primary_count as number) ?? 0;

  const hasSplit = primaryCount > 0 && primaryCount < serviceList.length;
  const visibleServices = hasSplit && !showAll
    ? serviceList.slice(0, primaryCount)
    : serviceList;
  const hiddenCount = hasSplit ? serviceList.length - primaryCount : 0;

  const customTitleColor = content.title_color as string | undefined;
  const customSubtitleColor = content.subtitle_color as string | undefined;
  const customBtnBg = content.btn_bg_color as string | undefined;
  const customBtnText = content.btn_text_color as string | undefined;

  const colors: SvcColors = {
    H: customTitleColor || DEFAULT_H,
    B: customSubtitleColor || DEFAULT_B,
    M: customSubtitleColor || DEFAULT_M,
    btnStyle: {
      ...(customBtnBg
        ? { backgroundColor: customBtnBg, background: customBtnBg }
        : theme.preset.buttonStyle === "outline"
          ? { borderColor: theme.secondaryColor, color: theme.secondaryColor }
          : theme.preset.buttonStyle === "gradient"
            ? { background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})` }
            : { backgroundColor: theme.secondaryColor }),
      ...(customBtnText ? { color: customBtnText } : {}),
    },
  };

  const moreLabel = locale === "he" ? "לעוד שירותים" : "More services";
  const lessLabel = locale === "he" ? "פחות שירותים" : "Less services";

  return (
    <section
      id="services"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: colors.H }}
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md" style={{ color: colors.B }}>{subtitle}</p>
        </div>

        {cardLayout === "list" ? (
          <AnimatedStagger className="mt-8 space-y-3 sm:mt-12 sm:space-y-4">
            {visibleServices.map((svc) => (
              <ServiceListItem
                key={svc.id}
                service={svc}
                theme={theme}
                currency={currency}
                showPrices={showPrices}
                showDuration={showDuration}
                bookingUrl={`${bookingUrl}?service=${svc.id}`}
                locale={locale}
                colors={colors}
              />
            ))}
          </AnimatedStagger>
        ) : cardLayout === "compact" ? (
          <AnimatedStagger className="mt-8 grid gap-2 sm:mt-12 sm:grid-cols-2 sm:gap-3">
            {visibleServices.map((svc) => (
              <ServiceCompact
                key={svc.id}
                service={svc}
                theme={theme}
                currency={currency}
                showPrices={showPrices}
                showDuration={showDuration}
                bookingUrl={`${bookingUrl}?service=${svc.id}`}
                locale={locale}
                colors={colors}
              />
            ))}
          </AnimatedStagger>
        ) : (
          <>
            <AnimatedStagger className="mt-8 space-y-3 sm:hidden">
              {visibleServices.map((svc) => (
                <ServiceMobileCard
                  key={svc.id}
                  service={svc}
                  theme={theme}
                  currency={currency}
                  showPrices={showPrices}
                  showDuration={showDuration}
                  bookingUrl={`${bookingUrl}?service=${svc.id}`}
                  locale={locale}
                  colors={colors}
              />
            ))}
            </AnimatedStagger>
            <AnimatedStagger className="mt-12 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
              {visibleServices.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  theme={theme}
                  currency={currency}
                  showPrices={showPrices}
                  showDuration={showDuration}
                  bookingUrl={`${bookingUrl}?service=${svc.id}`}
                  locale={locale}
                  colors={colors}
              />
            ))}
            </AnimatedStagger>
          </>
        )}

        {hasSplit && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-all ${theme.buttonClasses}`}
              style={colors.btnStyle}
            >
              {showAll ? (
                <>
                  {lessLabel}
                  <ChevronUp className="size-4" />
                </>
              ) : (
                <>
                  {moreLabel} ({hiddenCount})
                  <ChevronDown className="size-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceCard({
  service: svc,
  theme,
  currency,
  showPrices,
  showDuration,
  bookingUrl,
  locale,
  colors,
}: {
  service: Service;
  theme: SiteTheme;
  currency: string;
  showPrices: boolean;
  showDuration: boolean;
  bookingUrl: string;
  locale: Locale;
  colors: SvcColors;
}) {
  const priceDisplay = svc.price
    ? formatPrice(svc.price, currency)
    : svc.paymentMode === "FREE"
      ? t(locale, "common.free")
      : svc.paymentMode === "CONTACT_FOR_PRICE"
        ? t(locale, "pub.contact_price")
        : t(locale, "pub.on_site");

  return (
    <div
      className={`group relative flex flex-col overflow-hidden ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}
    >
      {svc.imageUrl && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={svc.imageUrl}
            alt={svc.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {showPrices && (
            <span
              className={`absolute right-3 top-3 ${theme.radius.full} px-3 py-1 text-sm font-semibold text-white shadow`}
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {priceDisplay}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between">
          <h3 className={`text-lg font-semibold ${theme.font}`} style={{ color: colors.H }}>{svc.title}</h3>
          {showPrices && !svc.imageUrl && (
            <span
              className={`whitespace-nowrap ${theme.radius.full} px-3 py-1 text-sm font-semibold text-white`}
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {priceDisplay}
            </span>
          )}
        </div>

        {svc.description && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.B }}>
            {svc.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-5 text-sm" style={{ color: colors.M }}>
          {showDuration && (
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {svc.durationMinutes} {t(locale, "common.min")}
            </span>
          )}
          {svc.isGroup && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
              <Users className="size-3" />
              {t(locale, "svc.group_badge")}
            </span>
          )}
        </div>

        <a
          href={bookingUrl}
          className={`mt-4 block w-full py-2.5 text-center text-sm ${theme.buttonClasses}`}
          style={colors.btnStyle}
        >
          {t(locale, "pub.book_now")}
        </a>
      </div>
    </div>
  );
}

function ServiceListItem({
  service: svc,
  theme,
  currency,
  showPrices,
  showDuration,
  bookingUrl,
  locale,
  colors,
}: {
  service: Service;
  theme: SiteTheme;
  currency: string;
  showPrices: boolean;
  showDuration: boolean;
  bookingUrl: string;
  locale: Locale;
  colors: SvcColors;
}) {
  const priceDisplay = svc.price
    ? formatPrice(svc.price, currency)
    : svc.paymentMode === "FREE"
      ? t(locale, "common.free")
      : t(locale, "pub.on_site");

  return (
    <div
      className={`flex items-center gap-4 p-4 ${theme.radius.md} ${theme.card} ${theme.cardHover} transition-all`}
    >
      {svc.imageUrl && (
        <img
          src={svc.imageUrl}
          alt={svc.title}
          className={`size-20 shrink-0 object-cover ${theme.imageRadius}`}
        />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold" style={{ color: colors.H }}>{svc.title}</h3>
        {svc.description && (
          <p className="mt-0.5 truncate text-sm" style={{ color: colors.B }}>{svc.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-sm" style={{ color: colors.M }}>
          {showDuration && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {svc.durationMinutes} {t(locale, "common.min")}
            </span>
          )}
          {showPrices && <span className="font-medium" style={{ color: colors.H }}>{priceDisplay}</span>}
        </div>
      </div>
      <a
        href={bookingUrl}
        className={`shrink-0 px-5 py-2 text-sm ${theme.buttonClasses}`}
        style={colors.btnStyle}
      >
        {t(locale, "pub.book")}
      </a>
    </div>
  );
}

function ServiceMobileCard({
  service: svc,
  theme,
  currency,
  showPrices,
  showDuration,
  bookingUrl,
  locale,
  colors,
}: {
  service: Service;
  theme: SiteTheme;
  currency: string;
  showPrices: boolean;
  showDuration: boolean;
  bookingUrl: string;
  locale: Locale;
  colors: SvcColors;
}) {
  const priceDisplay = svc.price
    ? formatPrice(svc.price, currency)
    : svc.paymentMode === "FREE"
      ? t(locale, "common.free")
      : svc.paymentMode === "CONTACT_FOR_PRICE"
        ? t(locale, "pub.contact_price")
        : t(locale, "pub.on_site");

  return (
    <a
      href={bookingUrl}
      className={`flex items-center gap-3 p-3 ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}
    >
      {svc.imageUrl ? (
        <img
          src={svc.imageUrl}
          alt={svc.title}
          className={`size-16 shrink-0 object-cover ${theme.imageRadius}`}
        />
      ) : (
        <div
          className={`flex size-16 shrink-0 items-center justify-center ${theme.imageRadius} text-lg font-bold text-white`}
          style={{ backgroundColor: theme.secondaryColor }}
        >
          {svc.title.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold" style={{ color: colors.H }}>{svc.title}</h3>
          {showPrices && (
            <span
              className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              {priceDisplay}
            </span>
          )}
        </div>
        {svc.description && (
          <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: colors.B }}>{svc.description}</p>
        )}
        {showDuration && (
          <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: colors.M }}>
            <Clock className="size-3" />
            {svc.durationMinutes} {t(locale, "common.min")}
          </div>
        )}
      </div>
    </a>
  );
}

function ServiceCompact({
  service: svc,
  theme,
  currency,
  showPrices,
  showDuration,
  bookingUrl,
  locale,
  colors,
}: {
  service: Service;
  theme: SiteTheme;
  currency: string;
  showPrices: boolean;
  showDuration: boolean;
  bookingUrl: string;
  locale: Locale;
  colors: SvcColors;
}) {
  const priceDisplay = svc.price
    ? formatPrice(svc.price, currency)
    : svc.paymentMode === "FREE"
      ? t(locale, "common.free")
      : "";

  return (
    <a
      href={bookingUrl}
      className={`flex items-center justify-between gap-3 p-3 ${theme.radius.md} ${theme.card} ${theme.cardHover} cursor-pointer transition-all`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: colors.H }}>{svc.title}</p>
        <p className="text-xs" style={{ color: colors.M }}>
          {showDuration && `${svc.durationMinutes} ${t(locale, "common.min")}`}
          {showDuration && showPrices && priceDisplay && " · "}
          {showPrices && priceDisplay}
        </p>
      </div>
      <div
        className={`shrink-0 ${theme.radius.full} px-2 py-0.5 text-[10px] font-semibold`}
        style={colors.btnStyle}
      >
        {t(locale, "pub.book")}
      </div>
    </a>
  );
}
