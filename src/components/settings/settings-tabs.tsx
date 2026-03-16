"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GeneralSettingsForm } from "./general-settings-form";
import { HoursSettingsForm } from "./hours-settings-form";
import { useT } from "@/lib/i18n/locale-context";
import type { InferSelectModel } from "drizzle-orm";
import type { businesses, businessHours } from "@/lib/db/schema";

type Business = InferSelectModel<typeof businesses>;
type BusinessHoursRow = InferSelectModel<typeof businessHours>;

interface SettingsTabsProps {
  business: Business;
  hours: BusinessHoursRow[];
}

export function SettingsTabs({ business, hours }: SettingsTabsProps) {
  const t = useT();

  return (
    <Tabs defaultValue="general">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="general">{t("settings.general")}</TabsTrigger>
        <TabsTrigger value="hours">{t("settings.business_hours")}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6">
        <GeneralSettingsForm business={business} />
      </TabsContent>

      <TabsContent value="hours" className="mt-6">
        <HoursSettingsForm hours={hours} />
      </TabsContent>
    </Tabs>
  );
}
