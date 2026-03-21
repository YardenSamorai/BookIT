import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessHours } from "@/lib/db/queries/business-hours";
import { t, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const { businessId } = await requireBusinessOwner();

  const [business, hours] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    }),
    getBusinessHours(businessId),
  ]);

  if (!business) {
    return null;
  }

  const locale = (business.language ?? "he") as Locale;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "settings.title")}
        description={t(locale, "settings.subtitle")}
      />
      <SettingsTabs business={business} hours={hours} />
    </div>
  );
}
