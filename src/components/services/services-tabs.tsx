"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ServiceList } from "./service-list";
import { CategoryList } from "./category-list";
import { PackageList } from "./package-list";
import type { InferSelectModel } from "drizzle-orm";
import type { services, serviceCategories, servicePackages, staffMembers } from "@/lib/db/schema";
import { useT } from "@/lib/i18n/locale-context";

type Service = InferSelectModel<typeof services>;
type Category = InferSelectModel<typeof serviceCategories>;
type Package = InferSelectModel<typeof servicePackages>;
type StaffMember = InferSelectModel<typeof staffMembers>;

interface ServicesTabsProps {
  services: Service[];
  categories: Category[];
  packages: Package[];
  staff: StaffMember[];
  serviceStaffLinks: Array<{ serviceId: string; staffId: string }>;
}

export function ServicesTabs({ services, categories, packages, staff, serviceStaffLinks }: ServicesTabsProps) {
  const t = useT();

  return (
    <Tabs defaultValue="services">
      <TabsList>
        <TabsTrigger value="services">{t("svc.tab_services")}</TabsTrigger>
        <TabsTrigger value="categories">{t("svc.tab_categories")}</TabsTrigger>
        <TabsTrigger value="packages">{t("svc.tab_packages")}</TabsTrigger>
      </TabsList>

      <TabsContent value="services" className="mt-6">
        <ServiceList services={services} categories={categories} staff={staff} serviceStaffLinks={serviceStaffLinks} />
      </TabsContent>

      <TabsContent value="categories" className="mt-6">
        <CategoryList categories={categories} />
      </TabsContent>

      <TabsContent value="packages" className="mt-6">
        <PackageList packages={packages} services={services} />
      </TabsContent>
    </Tabs>
  );
}
