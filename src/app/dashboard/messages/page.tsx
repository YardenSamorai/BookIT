import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, notificationPreferences } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getNotificationLogs, getNotificationStats } from "@/lib/db/queries/notifications";
import { getLimitsForPlan, type PlanType } from "@/lib/plans/limits";
import { getOrCreateTemplates } from "@/lib/notifications/templates";
import { t, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { MessagesPageClient } from "@/components/messages/messages-page-client";

export default async function MessagesPage() {
  const { businessId } = await requireBusinessOwner();

  const [business, logs, stats, notifPrefs] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { language: true, subscriptionPlan: true, phone: true },
    }),
    getNotificationLogs(businessId, 500),
    getNotificationStats(businessId),
    db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.businessId, businessId),
    }),
  ]);

  const locale = (business?.language ?? "he") as Locale;
  const plan = (business?.subscriptionPlan as PlanType) ?? "FREE";
  const limits = getLimitsForPlan(plan);

  const templates = await getOrCreateTemplates(businessId, locale as "en" | "he");

  const prefs = {
    whatsappEnabled: notifPrefs?.whatsappEnabled ?? true,
    smsBookingEnabled: notifPrefs?.smsBookingEnabled ?? false,
    reminderHoursBefore: notifPrefs?.reminderHoursBefore ?? 24,
    reminderHoursBefore2: notifPrefs?.reminderHoursBefore2 ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "msg.title" as never)}
        description={t(locale, "msg.subtitle" as never)}
      />
      <MessagesPageClient
        logs={logs}
        stats={stats}
        prefs={prefs}
        templates={templates}
        whatsappAllowed={limits.whatsappNotifications}
        businessPhone={business?.phone ?? ""}
        locale={locale}
      />
    </div>
  );
}
