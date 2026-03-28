"use client";

import { useState, useCallback } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { AnimatePresence, motion } from "framer-motion";
import { EditorSidebar, type EditorView } from "./editor-sidebar";
import { DesignView } from "./design-view";
import { ContentView } from "./content-view";
import { DetailsView } from "./details-view";
import { SitePreviewPanel } from "./site-preview-panel";
import { AutoSaveIndicator } from "./auto-save-indicator";
import { WelcomeOverlay } from "./welcome-overlay";
import { FirstPublishBanner } from "./first-publish-banner";
import { useAutoSave, combineSaveStatuses } from "@/hooks/use-auto-save";
import {
  updateSiteBrand,
  updateThemePreset,
  updateFontFamily,
  updateSiteSections,
  updateSocialLinks,
  updateSiteSeo,
} from "@/actions/site-editor";
import type { InferSelectModel } from "drizzle-orm";
import type { businesses, siteConfigs, services, staffMembers, businessHours, products } from "@/lib/db/schema";
import type { SiteSection, SocialLinks } from "@/lib/db/schema/site-config";

type Business = InferSelectModel<typeof businesses>;
type SiteConfig = InferSelectModel<typeof siteConfigs>;
type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;
type HoursRow = InferSelectModel<typeof businessHours>;
type Product = InferSelectModel<typeof products>;

interface SiteEditorShellProps {
  business: Business;
  siteConfig: SiteConfig | null;
  services: Service[];
  staff: StaffMember[];
  hours: HoursRow[];
  products: Product[];
  maxGalleryImages?: number;
}

const DEFAULT_SECTIONS: SiteSection[] = [
  { type: "hero", enabled: true, order: 0, layout: "centered", content: {} },
  { type: "about", enabled: true, order: 1, layout: "image-left", content: {} },
  { type: "services", enabled: true, order: 2, layout: "grid", content: {} },
  { type: "team", enabled: true, order: 3, layout: "cards", content: {} },
  { type: "gallery", enabled: false, order: 4, layout: "grid", content: {} },
  { type: "testimonials", enabled: false, order: 5, layout: "cards", content: {} },
  { type: "cta_banner", enabled: false, order: 6, layout: "centered", content: {} },
  { type: "booking", enabled: true, order: 7, layout: "default", content: {} },
  { type: "products", enabled: false, order: 8, layout: "carousel", content: {} },
  { type: "contact", enabled: true, order: 9, layout: "split", content: {} },
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

const VIEW_ORDER: EditorView[] = ["design", "content", "details"];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 16 : -16,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -16 : 16,
    opacity: 0,
  }),
};

export function SiteEditorShell({
  business: initialBusiness,
  siteConfig,
  services: serviceList,
  staff,
  hours,
  products: productList,
  maxGalleryImages = 50,
}: SiteEditorShellProps) {
  const t = useT();

  // Navigation state
  const [activeView, setActiveView] = useState<EditorView>("design");
  const [slideDirection, setSlideDirection] = useState(0);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  // Data state
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

  const [fontId, setFontId] = useState<string | null>(
    (siteConfig?.fontFamily as string) ?? null
  );

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(
    (siteConfig?.socialLinks as SocialLinks) ?? {}
  );

  const [seo, setSeo] = useState({
    metaTitle: siteConfig?.metaTitle ?? "",
    metaDescription: siteConfig?.metaDescription ?? "",
    ogImageUrl: siteConfig?.ogImageUrl ?? "",
  });

  // Auto-save hooks
  const brandSave = useAutoSave(() => updateSiteBrand(brand), [brand]);
  const themeSave = useAutoSave(() => updateThemePreset(themePresetId), [themePresetId]);
  const fontSave = useAutoSave(() => updateFontFamily(fontId), [fontId]);
  const sectionsSave = useAutoSave(() => updateSiteSections(sections), [sections]);
  const socialSave = useAutoSave(() => updateSocialLinks(socialLinks), [socialLinks]);
  const seoSave = useAutoSave(() => updateSiteSeo(seo), [seo]);

  const combinedStatus = combineSaveStatuses(
    brandSave.status,
    themeSave.status,
    fontSave.status,
    sectionsSave.status,
    socialSave.status,
    seoSave.status
  );

  // Callbacks
  const handleViewChange = useCallback((view: EditorView) => {
    const fromIndex = VIEW_ORDER.indexOf(activeView);
    const toIndex = VIEW_ORDER.indexOf(view);
    setSlideDirection(toIndex - fromIndex);
    setActiveView(view);
    setEditingSectionIndex(null);
  }, [activeView]);

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

  const handleChecklistNavigate = useCallback((view: EditorView, sectionIndex?: number) => {
    const fromIndex = VIEW_ORDER.indexOf(activeView);
    const toIndex = VIEW_ORDER.indexOf(view);
    setSlideDirection(toIndex - fromIndex);
    setActiveView(view);
    if (view === "content" && sectionIndex !== undefined && sectionIndex >= 0) {
      setEditingSectionIndex(sectionIndex);
    } else {
      setEditingSectionIndex(null);
    }
  }, [activeView]);

  const moveSection = useCallback((from: number, to: number) => {
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }, []);

  function renderActiveView() {
    switch (activeView) {
      case "design":
        return (
          <DesignView
            brand={brand}
            themePresetId={themePresetId}
            fontId={fontId}
            onBrandChange={updateBrand}
            onThemeChange={setThemePresetId}
            onFontChange={setFontId}
          />
        );
      case "content":
        return (
          <ContentView
            sections={sections}
            editingIndex={editingSectionIndex}
            onEditSection={setEditingSectionIndex}
            onToggleEnabled={(index, enabled) => updateSection(index, { enabled })}
            onContentChange={updateSectionContent}
            onMove={moveSection}
            extraEditorProps={{ products: productList, staff, services: serviceList, coverImageUrl: brand.coverImageUrl, maxGalleryImages }}
          />
        );
      case "details":
        return (
          <DetailsView
            socialLinks={socialLinks}
            onSocialChange={setSocialLinks}
            seo={seo}
            onSeoChange={setSeo}
            businessName={initialBusiness.name}
            slug={initialBusiness.slug}
          />
        );
    }
  }

  return (
    <div className="relative flex h-[calc(100vh-10rem)] gap-0 overflow-hidden rounded-xl border bg-background">
      <WelcomeOverlay onStart={handleViewChange} />
      {/* Sidebar */}
      <div className="hidden w-14 shrink-0 border-e bg-muted/30 md:block lg:w-[200px]">
        <EditorSidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          published={initialBusiness.published}
          slug={initialBusiness.slug}
          brand={{ logoUrl: brand.logoUrl, coverImageUrl: brand.coverImageUrl }}
          sections={sections}
          socialLinks={socialLinks}
          seo={{ metaTitle: seo.metaTitle, metaDescription: seo.metaDescription }}
          staffCount={staff.length}
          onNavigate={handleChecklistNavigate}
        />
      </div>

      {/* Center panel */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar (md:hidden) */}
        <MobileTopBar
          activeView={activeView}
          onViewChange={handleViewChange}
        />

        {/* Auto-save indicator */}
        <div className="flex h-10 shrink-0 items-center justify-end border-b px-4">
          <AutoSaveIndicator status={combinedStatus} />
        </div>

        {/* Center panel content with transitions */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <FirstPublishBanner
            published={initialBusiness.published}
            slug={initialBusiness.slug}
          />
          <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div
              key={activeView + (editingSectionIndex !== null ? `-edit-${editingSectionIndex}` : "")}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Preview panel (xl+) */}
      <div className="hidden w-[480px] shrink-0 border-s xl:block">
        <div className="h-full overflow-y-auto p-4">
          <SitePreviewPanel
            brand={brand}
            businessName={initialBusiness.name}
            sections={sections}
            services={serviceList}
            staff={staff}
            hours={hours}
            products={productList}
            currency={initialBusiness.currency}
            themePresetId={themePresetId}
            fontId={fontId}
            activeSectionType={
              activeView === "content" && editingSectionIndex !== null
                ? sections[editingSectionIndex]?.type ?? null
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

function MobileTopBar({
  activeView,
  onViewChange,
}: {
  activeView: EditorView;
  onViewChange: (view: EditorView) => void;
}) {
  const t = useT();

  const items: { id: EditorView; label: string }[] = [
    { id: "design", label: t("editor.nav_design") },
    { id: "content", label: t("editor.nav_content") },
    { id: "details", label: t("editor.nav_details") },
  ];

  return (
    <div className="flex shrink-0 items-center gap-1 border-b p-1.5 md:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={`flex-1 rounded-md px-2 py-1.5 text-center text-xs font-medium transition-colors ${
            activeView === item.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
