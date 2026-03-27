"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettingsForm } from "./general-settings-form";
import { HoursSettingsForm } from "./hours-settings-form";
import { IntegrationsTab } from "./integrations-tab";
import { SubdomainSettings } from "./subdomain-settings";
import { useT } from "@/lib/i18n/locale-context";
import { Link2 } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { businesses, businessHours } from "@/lib/db/schema";

type Business = InferSelectModel<typeof businesses>;
type BusinessHoursRow = InferSelectModel<typeof businessHours>;

interface CalendarConnection {
  id: string;
  staffId: string | null;
  googleEmail: string;
  createdAt: Date;
}

interface StaffMember {
  id: string;
  name: string;
}

interface SettingsTabsProps {
  business: Business;
  hours: BusinessHoursRow[];
  calendarConnections: CalendarConnection[];
  staff: StaffMember[];
}

export function SettingsTabs({ business, hours, calendarConnections, staff }: SettingsTabsProps) {
  const t = useT();

  return (
    <Tabs defaultValue="general">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
        <TabsTrigger value="hours">{t("settings.business_hours")}</TabsTrigger>
        <TabsTrigger value="integrations" className="gap-1.5">
          <Link2 className="size-3.5" />
          {t("settings.integrations" as never)}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6 space-y-6">
        <GeneralSettingsForm business={business} />
        <SubdomainSettings
          currentSubdomain={business.customSubdomain}
          status={business.subdomainStatus}
          slug={business.slug}
        />
      </TabsContent>

      <TabsContent value="hours" className="mt-6">
        <HoursSettingsForm hours={hours} />
      </TabsContent>

      <TabsContent value="integrations" className="mt-6">
        <IntegrationsTab connections={calendarConnections} staff={staff} />
      </TabsContent>
    </Tabs>
  );
}
