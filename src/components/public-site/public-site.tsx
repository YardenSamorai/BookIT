import type { PublicBusinessData } from "@/lib/db/queries/public-site";
import { buildSiteTheme } from "@/lib/themes/presets";
import { getDir, type Locale } from "@/lib/i18n";
import { SiteHero } from "./site-hero";
import { SiteAbout } from "./site-about";
import { SiteServices } from "./site-services";
import { SiteTeam } from "./site-team";
import { SiteGallery } from "./site-gallery";
import { SiteTestimonials } from "./site-testimonials";
import { SiteCtaBanner } from "./site-cta-banner";
import { SiteProducts } from "./site-products";
import { SiteContact } from "./site-contact";
import { SiteReviews } from "./site-reviews";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";
import { WhatsAppButton } from "./whatsapp-button";
import { PuckPublicRenderer } from "./puck-public-renderer";

interface PublicSiteProps {
  data: PublicBusinessData;
  locale: Locale;
}

export function PublicSite({ data, locale }: PublicSiteProps) {
  const { business, services, staff, hours, siteConfig, products, reviews, ratingStats } = data;
  const sections = siteConfig?.sections ?? [];
  const bookingUrl = `/b/${business.slug}/book`;
  const socialLinks = siteConfig?.socialLinks ?? {};
  const puckData = (siteConfig as any)?.puckData;

  const theme = buildSiteTheme(
    siteConfig?.themePreset ?? "modern",
    business.primaryColor,
    business.secondaryColor
  );

  if (puckData?.content?.length > 0) {
    return (
      <PuckPublicRenderer
        data={data}
        puckData={puckData}
        theme={theme}
        locale={locale}
        bookingUrl={bookingUrl}
        socialLinks={socialLinks}
      />
    );
  }

  const enabledSections = sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  let sectionIndex = 0;

  return (
    <div className={`min-h-screen bg-white ${theme.font}`} dir={getDir(locale)}>
      <SiteNav
        businessName={business.name}
        slug={business.slug}
        logoUrl={business.logoUrl}
        bookingUrl={bookingUrl}
        theme={theme}
        locale={locale}
      />

      {enabledSections.map((section) => {
        const idx = sectionIndex++;
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
      })}

      {ratingStats.totalReviews > 0 && (
        <SiteReviews
          reviews={reviews}
          avgRating={ratingStats.avgRating}
          totalReviews={ratingStats.totalReviews}
          theme={theme}
          sectionIndex={enabledSections.length}
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
  );
}
