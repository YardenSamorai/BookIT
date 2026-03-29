import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, siteConfigs, services, staffMembers, products } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessHours } from "@/lib/db/queries/business-hours";
import { getLimitsForPlan, type PlanType } from "@/lib/plans/limits";
import { t, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { SiteEditorShell } from "@/components/site-editor/site-editor-shell";

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
      orderBy: [asc(services.sortOrder), asc(services.createdAt)],
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

  const planLimits = getLimitsForPlan(business.subscriptionPlan as PlanType);
  const maxGalleryImages = business.galleryQuotaOverride ?? planLimits.maxGalleryImages;
  const allThemePresets = planLimits.allThemePresets;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "editor.title")}
        description={t(locale, "editor.subtitle")}
      />
      <SiteEditorShell
        business={business}
        siteConfig={siteConfig ?? null}
        services={activeServices}
        staff={activeStaff}
        hours={hours}
        products={activeProducts}
        maxGalleryImages={maxGalleryImages}
        allThemePresets={allThemePresets}
      />
    </div>
  );
}
