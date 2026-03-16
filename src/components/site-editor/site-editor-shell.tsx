"use client";

import { useState, useCallback } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BrandEditor } from "./brand-editor";
import { SectionManager } from "./section-manager";
import { ThemePresetSelector } from "./theme-preset-selector";
import { SocialLinksEditor } from "./social-links-editor";
import { SitePreviewPanel } from "./site-preview-panel";
import type { ThemePreset } from "@/lib/themes/presets";
import type { InferSelectModel } from "drizzle-orm";
import type { businesses, siteConfigs, services, staffMembers, businessHours } from "@/lib/db/schema";
import type { SiteSection, SocialLinks } from "@/lib/db/schema/site-config";

type Business = InferSelectModel<typeof businesses>;
type SiteConfig = InferSelectModel<typeof siteConfigs>;
type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;
type HoursRow = InferSelectModel<typeof businessHours>;

interface SiteEditorShellProps {
  business: Business;
  siteConfig: SiteConfig | null;
  services: Service[];
  staff: StaffMember[];
  hours: HoursRow[];
}

const DEFAULT_SECTIONS: SiteSection[] = [
  { type: "hero", enabled: true, order: 0, layout: "center", content: {} },
  { type: "about", enabled: true, order: 1, layout: "default", content: {} },
  { type: "services", enabled: true, order: 2, layout: "grid", content: {} },
  { type: "gallery", enabled: false, order: 3, layout: "grid", content: {} },
  { type: "testimonials", enabled: false, order: 4, layout: "cards", content: {} },
  { type: "team", enabled: true, order: 5, layout: "default", content: {} },
  { type: "cta_banner", enabled: false, order: 6, layout: "centered", content: {} },
  { type: "contact", enabled: true, order: 7, layout: "split", content: {} },
];

function ensureAllSections(existing: SiteSection[]): SiteSection[] {
  const types = new Set(existing.map((s) => s.type));
  const missing = DEFAULT_SECTIONS.filter((s) => !types.has(s.type));
  if (missing.length === 0) return existing;
  return [
    ...existing,
    ...missing.map((s, i) => ({ ...s, order: existing.length + i })),
  ];
}

export function SiteEditorShell({
  business: initialBusiness,
  siteConfig,
  services: serviceList,
  staff,
  hours,
}: SiteEditorShellProps) {
  const t = useT();

  const [brand, setBrand] = useState({
    primaryColor: initialBusiness.primaryColor,
    secondaryColor: initialBusiness.secondaryColor,
    logoUrl: initialBusiness.logoUrl ?? "",
    coverImageUrl: initialBusiness.coverImageUrl ?? "",
  });

  const [sections, setSections] = useState<SiteSection[]>(
    ensureAllSections(siteConfig?.sections ?? DEFAULT_SECTIONS)
  );

  const [themePresetId, setThemePresetId] = useState(
    siteConfig?.themePreset ?? "modern"
  );

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(
    (siteConfig?.socialLinks as SocialLinks) ?? {}
  );

  const updateBrand = useCallback((patch: Partial<typeof brand>) => {
    setBrand((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSection = useCallback((index: number, patch: Partial<SiteSection>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  }, []);

  const updateSectionContent = useCallback(
    (index: number, contentPatch: Record<string, unknown>) => {
      setSections((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, content: { ...s.content, ...contentPatch } } : s
        )
      );
    },
    []
  );

  const moveSection = useCallback((from: number, to: number) => {
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  function handlePresetSelect(preset: ThemePreset) {
    setThemePresetId(preset.id);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_480px]">
      <div className="space-y-6">
        <Tabs defaultValue="brand">
          <TabsList>
            <TabsTrigger value="brand">{t("editor.tab_brand")}</TabsTrigger>
            <TabsTrigger value="theme">{t("editor.tab_theme")}</TabsTrigger>
            <TabsTrigger value="sections">{t("editor.tab_sections")}</TabsTrigger>
            <TabsTrigger value="social">{t("editor.tab_social")}</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="mt-6">
            <BrandEditor
              brand={brand}
              updateBrand={updateBrand}
              published={initialBusiness.published}
            />
          </TabsContent>

          <TabsContent value="theme" className="mt-6">
            <ThemePresetSelector
              currentPresetId={themePresetId}
              onPresetSelect={handlePresetSelect}
            />
          </TabsContent>

          <TabsContent value="sections" className="mt-6">
            <SectionManager
              sections={sections}
              updateSection={updateSection}
              updateSectionContent={updateSectionContent}
              moveSection={moveSection}
            />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <SocialLinksEditor
              links={socialLinks}
              onChange={setSocialLinks}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden xl:block">
        <SitePreviewPanel
          brand={brand}
          businessName={initialBusiness.name}
          sections={sections}
          services={serviceList}
          staff={staff}
          hours={hours}
          currency={initialBusiness.currency}
          themePresetId={themePresetId}
        />
      </div>
    </div>
  );
}
