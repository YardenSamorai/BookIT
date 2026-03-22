"use client";

import { useMemo } from "react";
import { Render, type Data } from "@puckeditor/core";
import { buildPuckConfig } from "@/lib/puck/puck-config";
import { PuckBusinessProvider } from "@/lib/puck/puck-data-context";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { SiteReviews } from "./site-reviews";
import { WhatsAppButton } from "./whatsapp-button";
import { getDir, type Locale } from "@/lib/i18n";
import type { SiteTheme } from "@/lib/themes/presets";
import { COLOR_PALETTES } from "@/lib/themes/presets";
import type { PublicBusinessData } from "@/lib/db/queries/public-site";

interface PuckPublicRendererProps {
  data: PublicBusinessData;
  puckData: Data;
  theme: SiteTheme;
  locale: Locale;
  bookingUrl: string;
  socialLinks: Record<string, string>;
}

export function PuckPublicRenderer({
  data,
  puckData,
  theme,
  locale,
  bookingUrl,
  socialLinks,
}: PuckPublicRendererProps) {
  const { business, services, staff, hours, products, reviews, ratingStats, cardTemplates } = data;

  const config = useMemo(() => buildPuckConfig(locale as "he" | "en"), [locale]);

  const businessCtx = {
    businessId: business.id,
    businessName: business.name,
    slug: business.slug,
    primaryColor: business.primaryColor,
    secondaryColor: business.secondaryColor,
    logoUrl: business.logoUrl,
    coverImageUrl: business.coverImageUrl,
    phone: business.phone,
    email: business.email,
    address: business.address,
    currency: business.currency,
    bookingUrl,
    services: services as unknown as Array<Record<string, unknown>>,
    staff: staff as unknown as Array<Record<string, unknown>>,
    hours: hours as unknown as Array<Record<string, unknown>>,
    products: (products ?? []) as unknown as Array<Record<string, unknown>>,
    cardTemplates: (cardTemplates ?? []) as unknown as Array<Record<string, unknown>>,
    theme,
    locale,
  };

  const paletteId = (puckData.root?.props as Record<string, unknown>)?.color_palette as string | undefined;
  const palette = paletteId ? COLOR_PALETTES.find((p) => p.id === paletteId) : undefined;

  const rootStyle: React.CSSProperties & Record<string, string> = {};
  if (palette) {
    rootStyle.backgroundColor = palette.colors.background;
    rootStyle["--section-heading"] = palette.colors.heading;
    rootStyle["--section-body"] = palette.colors.textMuted;
    rootStyle["--palette-primary"] = palette.colors.primary;
    rootStyle["--palette-secondary"] = palette.colors.secondary;
    rootStyle["--palette-accent"] = palette.colors.accent;
    rootStyle["--palette-surface"] = palette.colors.surface;
    rootStyle["--palette-text"] = palette.colors.text;
    rootStyle["--palette-bg"] = palette.colors.background;
  }

  return (
    <PuckBusinessProvider value={businessCtx}>
      <div
        className={`min-h-screen ${palette ? "" : "bg-white"} ${theme.font}`}
        dir={getDir(locale)}
        style={palette ? rootStyle : undefined}
      >
        <SiteNav
          businessName={business.name}
          slug={business.slug}
          logoUrl={business.logoUrl}
          bookingUrl={bookingUrl}
          theme={theme}
          locale={locale}
        />

        <Render config={config} data={puckData} />

        {ratingStats.totalReviews > 0 && (
          <SiteReviews
            reviews={reviews}
            avgRating={ratingStats.avgRating}
            totalReviews={ratingStats.totalReviews}
            theme={theme}
            sectionIndex={puckData.content?.length ?? 0}
            locale={locale}
          />
        )}

        <SiteFooter
          businessName={business.name}
          theme={theme}
          socialLinks={socialLinks}
          locale={locale}
        />

        {socialLinks.whatsapp && (
          <WhatsAppButton phone={socialLinks.whatsapp} locale={locale} />
        )}
      </div>
    </PuckBusinessProvider>
  );
}
