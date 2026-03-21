import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, siteConfigs, services, staffMembers, products } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessHours } from "@/lib/db/queries/business-hours";
import { t, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { SiteEditorSwitch } from "@/components/site-editor/site-editor-switch";
import { buildSiteTheme } from "@/lib/themes/presets";
import { migrateSectionsToPuck } from "@/lib/puck/migrate-sections";
import type { Data } from "@puckeditor/core";
import type { SiteSection } from "@/lib/db/schema/site-config";

export default async function SiteEditorPage() {
  const { businessId } = await requireBusinessOwner();

  const [business, siteConfig, serviceList, staffList, hours, productList] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    }),
    db.query.siteConfigs.findFirst({
      where: eq(siteConfigs.businessId, businessId),
    }),
    db.query.services.findMany({
      where: eq(services.businessId, businessId),
    }),
    db.query.staffMembers.findMany({
      where: eq(staffMembers.businessId, businessId),
    }),
    getBusinessHours(businessId),
    db.query.products.findMany({
      where: eq(products.businessId, businessId),
    }),
  ]);

  if (!business) return null;

  const locale = (business.language ?? "he") as Locale;
  const activeServices = serviceList.filter((s) => s.isActive);
  const activeStaff = staffList.filter((s) => s.isActive);
  const activeProducts = productList.filter((p) => p.isVisible);

  const theme = buildSiteTheme(
    siteConfig?.themePreset ?? "modern",
    business.primaryColor,
    business.secondaryColor
  );

  const existingPuckData = siteConfig?.puckData as Data | null;
  const puckData: Data = existingPuckData ??
    migrateSectionsToPuck((siteConfig?.sections as SiteSection[]) ?? []);

  const businessData = {
    businessId,
    businessName: business.name,
    slug: business.slug,
    primaryColor: business.primaryColor,
    secondaryColor: business.secondaryColor,
    logoUrl: business.logoUrl,
    coverImageUrl: business.coverImageUrl,
    currency: business.currency,
    bookingUrl: `/b/${business.slug}/book`,
    services: activeServices as unknown as Array<Record<string, unknown>>,
    staff: activeStaff as unknown as Array<Record<string, unknown>>,
    hours: hours as unknown as Array<Record<string, unknown>>,
    products: activeProducts as unknown as Array<Record<string, unknown>>,
    theme,
    locale,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "editor.title")}
        description={t(locale, "editor.subtitle")}
      />
      <SiteEditorSwitch
        business={business}
        siteConfig={siteConfig ?? null}
        services={activeServices}
        staff={activeStaff}
        hours={hours}
        puckData={puckData}
        businessData={businessData}
      />
    </div>
  );
}
