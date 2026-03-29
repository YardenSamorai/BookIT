import type { PublicBusinessData } from "@/lib/db/queries/public-site";
import { buildSiteTheme } from "@/lib/themes/presets";
import { getGoogleFontUrl, getSiteFont } from "@/lib/themes/fonts";
import { getDir, type Locale } from "@/lib/i18n";
import { SiteHero } from "./site-hero";
import { SiteAbout } from "./site-about";
import { SiteServices } from "./site-services";
import { SiteTeam } from "./site-team";
import { SiteGallery } from "./site-gallery";
import { SiteTestimonials } from "./site-testimonials";
import { SiteCtaBanner } from "./site-cta-banner";
import { SiteBooking } from "./site-booking";
import { SiteProducts } from "./site-products";
import { SiteContact } from "./site-contact";
import { SiteReviews } from "./site-reviews";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";
import { WhatsAppButton } from "./whatsapp-button";
import { UpcomingAppointmentBar } from "./upcoming-appointment-bar";
import { AnimatedSection } from "./animated-section";

interface PublicSiteProps {
  data: PublicBusinessData;
  locale: Locale;
  basePath?: string;
}

export function PublicSite({ data, locale, basePath }: PublicSiteProps) {
  const { business, services, staff, hours, siteConfig, products, reviews, ratingStats, cardTemplates } = data;
  const sections = siteConfig?.sections ?? [];
  const resolvedBase = basePath ?? `/b/${business.slug}`;
  const bookingUrl = `${resolvedBase}/book`;
  const socialLinks = siteConfig?.socialLinks ?? {};

  const fontId = siteConfig?.fontFamily as string | null;
  const siteFont = fontId ? getSiteFont(fontId) : null;
  const googleFontUrl = fontId ? getGoogleFontUrl(fontId) : null;

  const theme = buildSiteTheme(
    siteConfig?.themePreset ?? "modern",
    business.primaryColor,
    business.secondaryColor,
    siteFont?.tailwindClass ?? null
  );

  const enabledSections = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  let sectionIndex = 0;

  return (
    <div className={`min-h-screen bg-white ${theme.font}`} dir={getDir(locale)}>
      {googleFontUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={googleFontUrl} />
      )}
      <SiteNav
        businessName={business.displayName || business.name}
        slug={business.slug}
        logoUrl={business.logoUrl}
        bookingUrl={bookingUrl}
        basePath={resolvedBase}
        theme={theme}
        locale={locale}
        enabledSections={enabledSections.map((s) => s.type)}
      />

      {enabledSections.map((section) => {
        const idx = sectionIndex++;
        const isHero = section.type === "hero";

        const inner = (() => {
          switch (section.type) {
            case "hero":
              return (
                <SiteHero
                  key="hero"
                  businessName={business.name}
                  coverImageUrl={business.coverImageUrl}
                  content={section.content}
                  theme={theme}
                  locale={locale}
                />
              );
            case "about":
              return (
                <SiteAbout
                  key="about"
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  locale={locale}
                />
              );
            case "services":
              return (
                <SiteServices
                  key="services"
                  services={services}
                  currency={business.currency}
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  bookingUrl={bookingUrl}
                  locale={locale}
                />
              );
            case "team":
              return (
                <SiteTeam
                  key="team"
                  staff={staff}
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  locale={locale}
                />
              );
            case "gallery":
              return (
                <SiteGallery
                  key="gallery"
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  locale={locale}
                />
              );
            case "testimonials":
              return (
                <SiteTestimonials
                  key="testimonials"
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  locale={locale}
                />
              );
            case "cta_banner":
              return (
                <SiteCtaBanner
                  key="cta_banner"
                  content={section.content}
                  theme={theme}
                  bookingUrl={bookingUrl}
                  locale={locale}
                />
              );
            case "booking":
              return (
                <SiteBooking
                  key="booking"
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  bookingUrl={bookingUrl}
                  locale={locale}
                />
              );
            case "products":
              return (
                <SiteProducts
                  key="products"
                  products={products}
                  currency={business.currency}
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  bookingUrl={bookingUrl}
                  locale={locale}
                  businessId={business.id}
                  cardTemplates={cardTemplates}
                />
              );
            case "contact":
              return (
                <SiteContact
                  key="contact"
                  business={business}
                  hours={hours}
                  content={section.content}
                  theme={theme}
                  sectionIndex={idx}
                  locale={locale}
                />
              );
            default:
              return null;
          }
        })();

        if (!inner) return null;

        return (
          <AnimatedSection
            key={section.type}
            animation={isHero ? "fade-in" : "fade-up"}
          >
            {inner}
          </AnimatedSection>
        );
      })}

      {ratingStats.totalReviews > 0 && (
        <AnimatedSection>
          <SiteReviews
            reviews={reviews}
            avgRating={ratingStats.avgRating}
            totalReviews={ratingStats.totalReviews}
            theme={theme}
            sectionIndex={enabledSections.length}
            locale={locale}
          />
        </AnimatedSection>
      )}

      <SiteFooter
        businessName={business.name}
        theme={theme}
        socialLinks={socialLinks}
        locale={locale}
        removeBranding={business.brandingRemoved || business.subscriptionPlan === "PRO"}
      />

      {socialLinks.whatsapp && (
        <WhatsAppButton phone={socialLinks.whatsapp} locale={locale} />
      )}

      <UpcomingAppointmentBar
        businessId={business.id}
        myAppointmentsUrl={`${resolvedBase}/my-appointments`}
        secondaryColor={business.secondaryColor}
        locale={locale}
      />
    </div>
  );
}
