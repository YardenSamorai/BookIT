"use client";

import { Render, type Data } from "@puckeditor/core";
import { puckConfig } from "@/lib/puck/puck-config";
import { PuckBusinessProvider } from "@/lib/puck/puck-data-context";
import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { SiteReviews } from "./site-reviews";
import { WhatsAppButton } from "./whatsapp-button";
import { getDir, type Locale } from "@/lib/i18n";
import type { SiteTheme } from "@/lib/themes/presets";
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
  const { business, services, staff, hours, reviews, ratingStats } = data;

  const businessCtx = {
    businessName: business.name,
    slug: business.slug,
    primaryColor: business.primaryColor,
    secondaryColor: business.secondaryColor,
    logoUrl: business.logoUrl,
    coverImageUrl: business.coverImageUrl,
    currency: business.currency,
    bookingUrl,
    services: services as unknown as Array<Record<string, unknown>>,
    staff: staff as unknown as Array<Record<string, unknown>>,
    hours: hours as unknown as Array<Record<string, unknown>>,
    theme,
    locale,
  };

  return (
    <PuckBusinessProvider value={businessCtx}>
      <div className={`min-h-screen bg-white ${theme.font}`} dir={getDir(locale)}>
        <SiteNav
          businessName={business.name}
          slug={business.slug}
          logoUrl={business.logoUrl}
          bookingUrl={bookingUrl}
          theme={theme}
          locale={locale}
        />

        <Render config={puckConfig} data={puckData} />

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
