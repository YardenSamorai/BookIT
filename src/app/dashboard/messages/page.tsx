import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, notificationPreferences, users } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getNotificationLogs, getNotificationStats, cleanupMisattributedLogs } from "@/lib/db/queries/notifications";
import { getLimitsForPlan, type PlanType } from "@/lib/plans/limits";
import { getOrCreateTemplates } from "@/lib/notifications/templates";
import { t, type Locale } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { MessagesPageClient } from "@/components/messages/messages-page-client";

export default async function MessagesPage() {
  const { businessId } = await requireBusinessOwner();

  // Clean up any misattributed synced messages (lightweight, idempotent)
  cleanupMisattributedLogs(businessId).catch(() => {});

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

  const uniquePhones = [...new Set(logs.map((l) => l.recipient).filter(Boolean))];
  let phoneToName: Record<string, string> = {};
  if (uniquePhones.length > 0) {
    const stripPhone = (p: string) => p.replace(/^whatsapp:/, "").replace(/[\s\-()]/g, "");
    const toVariants = (p: string): string[] => {
      const clean = stripPhone(p);
      const variants = [clean];
      if (clean.startsWith("+972")) {
        variants.push("0" + clean.slice(4));
        variants.push(clean.slice(1)); // 972...
      } else if (clean.startsWith("972")) {
        variants.push("+" + clean);
        variants.push("0" + clean.slice(3));
      } else if (clean.startsWith("0") && !clean.startsWith("00")) {
        variants.push("+972" + clean.slice(1));
        variants.push("972" + clean.slice(1));
      }
      return variants;
    };

    const allVariants = new Set<string>();
    const recipientToVariants = new Map<string, string[]>();
    for (const raw of uniquePhones) {
      const v = toVariants(raw);
      recipientToVariants.set(raw, v);
      v.forEach((x) => allVariants.add(x));
    }

    const matched = await db
      .select({ phone: users.phone, name: users.name })
      .from(users)
      .where(inArray(users.phone, [...allVariants]));

    const dbPhoneMap = new Map(matched.filter((u) => u.phone).map((u) => [u.phone!, u.name]));

    for (const raw of uniquePhones) {
      const clean = stripPhone(raw);
      const variants = recipientToVariants.get(raw) ?? [clean];
      for (const v of variants) {
        const name = dbPhoneMap.get(v);
        if (name) {
          phoneToName[clean] = name;
          break;
        }
      }
    }
  }

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
        phoneToName={phoneToName}
      />
    </div>
  );
}
