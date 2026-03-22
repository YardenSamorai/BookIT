"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale-context";
import { CustomerHeader } from "./customer-header";
import { CustomerMobileBar } from "./customer-mobile-bar";
import { CustomerKpiRow } from "./customer-kpi-row";
import { EditProfileSheet } from "./edit-profile-sheet";
import { OverviewTab } from "./tabs/overview-tab";
import { AppointmentsTab } from "./tabs/appointments-tab";
import { CardsTab } from "./tabs/cards-tab";
import { FinancialTab } from "./tabs/financial-tab";
import { NotesTab } from "./tabs/notes-tab";
import { ProfileTab } from "./tabs/profile-tab";
import type { CustomerProfile as CustomerProfileType, CustomerActivity, FinancialActivityRow, CustomerPackageRow } from "@/lib/db/queries/customers";
import type { CustomerCardRow, CardTemplateRow } from "@/lib/db/queries/cards";
import type { InferSelectModel } from "drizzle-orm";
import type { servicePackages } from "@/lib/db/schema";

type ServicePackage = InferSelectModel<typeof servicePackages>;

interface Props {
  customer: CustomerProfileType;
  businessId: string;
  activities: CustomerActivity[];
  financialActivity: FinancialActivityRow[];
  customerCards: CustomerCardRow[];
  cardTemplates: CardTemplateRow[];
  customerPackages: CustomerPackageRow[];
  servicePackages: ServicePackage[];
}

export function CustomerProfileView({
  customer,
  businessId,
  activities,
  financialActivity,
  customerCards,
  cardTemplates,
  customerPackages,
  servicePackages: svcPkgs,
}: Props) {
  const t = useT();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);

  const refresh = () => router.refresh();

  const handleBook = () => {
    // For now, this can be extended to open a booking dialog
  };

  const handleAssignCard = () => {
    setActiveTab("cards");
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <CustomerHeader
        customer={customer}
        onEdit={() => setEditOpen(true)}
        onBook={handleBook}
        onAssignCard={handleAssignCard}
        onSwitchTab={setActiveTab}
        onRefresh={refresh}
      />

      <CustomerKpiRow customer={customer} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-full md:w-auto inline-flex whitespace-nowrap">
            <TabsTrigger value="overview" className="min-w-fit">{t("cust.tab_overview")}</TabsTrigger>
            <TabsTrigger value="appointments" className="min-w-fit">{t("cust.tab_appointments")}</TabsTrigger>
            <TabsTrigger value="cards" className="min-w-fit">{t("cust.tab_cards")}</TabsTrigger>
            <TabsTrigger value="financial" className="min-w-fit">{t("cust.tab_financial")}</TabsTrigger>
            <TabsTrigger value="notes" className="min-w-fit">{t("cust.tab_notes")}</TabsTrigger>
            <TabsTrigger value="profile" className="min-w-fit">{t("cust.tab_profile")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            customer={customer}
            activities={activities}
            financialActivity={financialActivity}
            customerCards={customerCards}
            onSwitchTab={setActiveTab}
            onEdit={() => setEditOpen(true)}
          />
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <AppointmentsTab customer={customer} onBook={handleBook} />
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <CardsTab
            customerId={customer.id}
            cards={customerCards}
            cardTemplates={cardTemplates}
            customerPackages={customerPackages}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <FinancialTab
            financialActivity={financialActivity}
            customerCards={customerCards}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesTab
            customer={customer}
            businessId={businessId}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab customer={customer} onEdit={() => setEditOpen(true)} />
        </TabsContent>
      </Tabs>

      <CustomerMobileBar
        customer={customer}
        onEdit={() => setEditOpen(true)}
        onBook={handleBook}
        onAssignCard={handleAssignCard}
        onSwitchTab={setActiveTab}
      />

      <EditProfileSheet
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onRefresh={refresh}
      />
    </div>
  );
}
