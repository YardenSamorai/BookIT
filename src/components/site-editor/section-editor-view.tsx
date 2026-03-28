"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Image,
  Type,
  LayoutTemplate,
  Users,
  Images,
  MessageSquareQuote,
  Megaphone,
  Sparkles,
  CalendarCheck,
  Phone,
} from "lucide-react";
import { HeroSectionEditor } from "./editors/hero-section-editor";
import { AboutSectionEditor } from "./editors/about-section-editor";
import { ServicesSectionEditor } from "./editors/services-section-editor";
import { TeamSectionEditor } from "./editors/team-section-editor";
import { ContactSectionEditor } from "./editors/contact-section-editor";
import { GallerySectionEditor } from "./editors/gallery-section-editor";
import { TestimonialsSectionEditor } from "./editors/testimonials-section-editor";
import { CtaSectionEditor } from "./editors/cta-section-editor";
import { ProductsSectionEditor } from "./editors/products-section-editor";
import { BookingSectionEditor } from "./editors/booking-section-editor";
import type { SiteSection } from "@/lib/db/schema/site-config";

interface SectionEditorViewProps {
  section: SiteSection;
  sectionIndex: number;
  onBack: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onContentChange: (patch: Record<string, unknown>) => void;
  extraEditorProps?: Record<string, unknown>;
}

const SECTION_ICONS: Record<string, React.ElementType> = {
  hero: Image,
  about: Type,
  services: LayoutTemplate,
  team: Users,
  gallery: Images,
  testimonials: MessageSquareQuote,
  cta_banner: Megaphone,
  products: Sparkles,
  booking: CalendarCheck,
  contact: Phone,
};

const SECTION_LABEL_KEYS: Record<string, string> = {
  hero: "section.hero",
  about: "section.about",
  services: "section.services",
  team: "section.team",
  gallery: "section.gallery",
  testimonials: "section.testimonials",
  cta_banner: "section.cta_banner",
  products: "section.products",
  booking: "section.booking",
  contact: "section.contact",
};

export function SectionEditorView({
  section,
  sectionIndex,
  onBack,
  onToggleEnabled,
  onContentChange,
  extraEditorProps,
}: SectionEditorViewProps) {
  const t = useT();
  const Icon = SECTION_ICONS[section.type] ?? LayoutTemplate;
  const labelKey = SECTION_LABEL_KEYS[section.type];
  const label = labelKey ? t(labelKey as any) : section.type;

  const editorProps = {
    content: section.content,
    onChange: onContentChange,
  };

  function renderEditor() {
    switch (section.type) {
      case "hero":
        return <HeroSectionEditor {...editorProps} coverImageUrl={(extraEditorProps?.coverImageUrl as string) ?? ""} />;
      case "about":
        return <AboutSectionEditor {...editorProps} />;
      case "services":
        return <ServicesSectionEditor {...editorProps} services={(extraEditorProps?.services ?? []) as any[]} />;
      case "team":
        return <TeamSectionEditor {...editorProps} staffCount={(extraEditorProps?.staff as unknown[] ?? []).length} />;
      case "gallery":
        return <GallerySectionEditor {...editorProps} maxImages={(extraEditorProps?.maxGalleryImages as number) ?? 50} />;
      case "testimonials":
        return <TestimonialsSectionEditor {...editorProps} />;
      case "cta_banner":
        return <CtaSectionEditor {...editorProps} />;
      case "contact":
        return <ContactSectionEditor {...editorProps} />;
      case "products":
        return <ProductsSectionEditor {...editorProps} products={(extraEditorProps?.products ?? []) as any[]} />;
      case "booking":
        return <BookingSectionEditor {...editorProps} />;
      default:
        return (
          <p className="text-sm text-muted-foreground">{t("editor.no_editor")}</p>
        );
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-4" />
            {t("editor.back_to_content")}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {section.enabled ? t("editor.visible_on_site") : t("editor.hidden_section")}
          </span>
          <Switch
            checked={section.enabled}
            onCheckedChange={(checked) => onToggleEnabled(!!checked)}
          />
        </div>
      </div>

      {/* Title bar */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Icon className="size-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">{label}</h3>
      </div>

      {/* Editor */}
      <div>{renderEditor()}</div>
    </div>
  );
}
