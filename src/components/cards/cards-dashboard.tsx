"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardTemplateList } from "./card-template-list";
import { CustomerCardsList } from "./customer-cards-list";
import { CardUsageTable } from "./card-usage-table";
import { CardAnalytics } from "./card-analytics";
import { useT } from "@/lib/i18n/locale-context";
import type { CardTemplateRow } from "@/lib/db/queries/cards";
import type { BusinessCustomerCardRow } from "@/lib/db/queries/cards";

interface CardsDashboardProps {
  templates: CardTemplateRow[];
  customerCards: BusinessCustomerCardRow[];
  usageHistory: Array<{
    id: string;
    action: string;
    deltaSessions: number;
    actorType: string;
    notes: string | null;
    createdAt: Date;
    cardName: string;
    customerName: string | null;
    serviceName: string | null;
  }>;
  analytics: {
    activeCards: number;
    totalRevenue: string;
    sessionsUsedThisMonth: number;
    avgUsageRate: string;
  };
}

export function CardsDashboard({
  templates,
  customerCards,
  usageHistory,
  analytics,
}: CardsDashboardProps) {
  const t = useT();

  return (
    <Tabs defaultValue="templates">
      <TabsList>
        <TabsTrigger value="templates">{t("card.tab_templates")}</TabsTrigger>
        <TabsTrigger value="customer-cards">{t("card.tab_customer_cards")}</TabsTrigger>
        <TabsTrigger value="usage">{t("card.tab_usage_history")}</TabsTrigger>
        <TabsTrigger value="analytics">{t("card.tab_analytics")}</TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="mt-6">
        <CardTemplateList templates={templates} />
      </TabsContent>

      <TabsContent value="customer-cards" className="mt-6">
        <CustomerCardsList cards={customerCards} />
      </TabsContent>

      <TabsContent value="usage" className="mt-6">
        <CardUsageTable entries={usageHistory} />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <CardAnalytics data={analytics} />
      </TabsContent>
    </Tabs>
  );
}
