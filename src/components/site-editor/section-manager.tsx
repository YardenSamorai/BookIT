"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Save,
  Image,
  Users,
  Phone,
  LayoutTemplate,
  Sparkles,
  Type,
  Images,
  MessageSquareQuote,
  Megaphone,
  CalendarCheck,
} from "lucide-react";
import { HeroSectionEditor } from "./editors/hero-section-editor";
import { AboutSectionEditor } from "./editors/about-section-editor";
import { ServicesSectionEditor } from "./editors/services-section-editor";
import { TeamSectionEditor } from "./editors/team-section-editor";
import { ContactSectionEditor } from "./editors/contact-section-editor";
import { GallerySectionEditor } from "./editors/gallery-section-editor";
import { TestimonialsSectionEditor } from "./editors/testimonials-section-editor";
import { CtaSectionEditor } from "./editors/cta-section-editor";
import { updateSiteSections } from "@/actions/site-editor";
import type { SiteSection } from "@/lib/db/schema/site-config";

interface SectionManagerProps {
  sections: SiteSection[];
  updateSection: (index: number, patch: Partial<SiteSection>) => void;
  updateSectionContent: (index: number, contentPatch: Record<string, unknown>) => void;
  moveSection: (from: number, to: number) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Image className="size-4" />,
  about: <Type className="size-4" />,
  services: <LayoutTemplate className="size-4" />,
  team: <Users className="size-4" />,
  gallery: <Images className="size-4" />,
  testimonials: <MessageSquareQuote className="size-4" />,
  cta_banner: <Megaphone className="size-4" />,
  products: <Sparkles className="size-4" />,
  booking: <CalendarCheck className="size-4" />,
  contact: <Phone className="size-4" />,
};

const SECTION_LABEL_KEYS: Record<string, "section.hero" | "section.about" | "section.services" | "section.team" | "section.gallery" | "section.testimonials" | "section.cta_banner" | "section.products" | "section.booking" | "section.contact"> = {
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

export function SectionManager({
  sections,
  updateSection,
  updateSectionContent,
  moveSection,
}: SectionManagerProps) {
  const t = useT();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");

  async function handleSave() {
    setSaving(true);
    setStatus("");
    const result = await updateSiteSections(sections);
    setStatus(result.success ? "success" : "error");
    setSaving(false);
  }

  function renderEditor(section: SiteSection, index: number) {
    const props = {
      content: section.content,
      onChange: (patch: Record<string, unknown>) => updateSectionContent(index, patch),
    };

    switch (section.type) {
      case "hero":
        return <HeroSectionEditor {...props} />;
      case "about":
        return <AboutSectionEditor {...props} />;
      case "services":
        return <ServicesSectionEditor {...props} />;
      case "team":
        return <TeamSectionEditor {...props} />;
      case "gallery":
        return <GallerySectionEditor {...props} />;
      case "testimonials":
        return <TestimonialsSectionEditor {...props} />;
      case "cta_banner":
        return <CtaSectionEditor {...props} />;
      case "contact":
        return <ContactSectionEditor {...props} />;
      default:
        return <p className="text-sm text-muted-foreground">{t("editor.no_editor")}</p>;
    }
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const icon = SECTION_ICONS[section.type] ?? <LayoutTemplate className="size-4" />;
        const labelKey = SECTION_LABEL_KEYS[section.type];
        const label = labelKey ? t(labelKey) : section.type;
        const isExpanded = expanded === index;

        return (
          <Card key={section.type} className="overflow-hidden">
            <CardHeader className="cursor-pointer p-4" onClick={() => setExpanded(isExpanded ? null : index)}>
              <div className="flex items-center gap-3">
                <GripVertical className="size-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {icon}
                  <CardTitle className="text-base">{label}</CardTitle>
                </div>

                {!section.enabled && (
                  <Badge variant="secondary" className="ms-2 text-xs">
                    {t("common.hidden")}
                  </Badge>
                )}

                <div className="ms-auto flex items-center gap-2">
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={(checked) =>
                      updateSection(index, { enabled: !!checked })
                    }
                    onClick={(e) => e.stopPropagation()}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(index, index - 1);
                    }}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    disabled={index === sections.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSection(index, index + 1);
                    }}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="border-t px-4 pt-4">
                {renderEditor(section, index)}
              </CardContent>
            )}
          </Card>
        );
      })}

      {status === "success" && (
        <p className="text-sm text-emerald-600">{t("editor.sections_saved")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-destructive">{t("editor.sections_failed")}</p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
        {t("editor.save_sections")}
      </Button>
    </div>
  );
}
