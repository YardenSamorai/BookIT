"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SectionEditorView } from "./section-editor-view";
import type { SiteSection } from "@/lib/db/schema/site-config";

interface ContentViewProps {
  sections: SiteSection[];
  editingIndex: number | null;
  onEditSection: (index: number | null) => void;
  onToggleEnabled: (index: number, enabled: boolean) => void;
  onContentChange: (index: number, patch: Record<string, unknown>) => void;
  onMove: (from: number, to: number) => void;
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

type SectionStatus = "complete" | "incomplete" | "disabled";

function getSectionStatus(section: SiteSection): SectionStatus {
  if (!section.enabled) return "disabled";
  const c = section.content;
  switch (section.type) {
    case "hero":
      return (c.headline as string)?.length > 0 ? "complete" : "incomplete";
    case "about":
      return (c.description as string)?.length > 0 ? "complete" : "incomplete";
    case "gallery": {
      const imgs = Array.isArray(c.images) ? c.images : [];
      return imgs.some((i: any) => !!i?.url) ? "complete" : "incomplete";
    }
    case "testimonials": {
      const items = Array.isArray(c.testimonials) ? c.testimonials : [];
      return items.length > 0 ? "complete" : "incomplete";
    }
    case "cta_banner":
      return (c.title as string)?.length > 0 ? "complete" : "incomplete";
    case "services":
    case "team":
    case "contact":
    case "booking":
      return "complete";
    default:
      return "complete";
  }
}

function getSectionSummary(section: SiteSection, t: (key: any, vars?: Record<string, string | number>) => string): string {
  const c = section.content;
  switch (section.type) {
    case "hero": {
      const h = (c.headline as string) ?? "";
      return h ? truncate(h, 40) : t("summary.no_headline");
    }
    case "about": {
      const d = (c.description as string) ?? "";
      return d ? truncate(d, 40) : t("summary.no_description");
    }
    case "services":
      return t("summary.auto_services");
    case "team":
      return t("summary.auto_team");
    case "gallery": {
      const imgs = Array.isArray(c.images) ? c.images : [];
      const count = imgs.filter((i: any) => !!i?.url).length;
      return count > 0
        ? t("summary.gallery_count", { count })
        : t("summary.no_images");
    }
    case "testimonials": {
      const items = Array.isArray(c.testimonials) ? c.testimonials : [];
      return items.length > 0
        ? t("summary.testimonial_count", { count: items.length })
        : t("summary.no_testimonials");
    }
    case "cta_banner":
      return (c.title as string) ?? t("summary.not_configured");
    case "products":
      return t("summary.auto_products");
    case "booking":
      return t("summary.auto_booking");
    case "contact":
      return t("summary.auto_contact");
    default:
      return "";
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

const STATUS_COLORS: Record<SectionStatus, string> = {
  complete: "bg-emerald-500",
  incomplete: "bg-amber-400",
  disabled: "bg-gray-300",
};

export function ContentView({
  sections,
  editingIndex,
  onEditSection,
  onToggleEnabled,
  onContentChange,
  onMove,
  extraEditorProps,
}: ContentViewProps) {
  const t = useT();

  if (editingIndex !== null) {
    const section = sections[editingIndex];
    if (!section) {
      onEditSection(null);
      return null;
    }
    return (
      <motion.div
        key="section-editor"
        initial={{ x: 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 16, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionEditorView
          section={section}
          sectionIndex={editingIndex}
          onBack={() => onEditSection(null)}
          onToggleEnabled={(enabled) => onToggleEnabled(editingIndex, enabled)}
          onContentChange={(patch) => onContentChange(editingIndex, patch)}
          extraEditorProps={extraEditorProps}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="section-list"
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -16, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2"
    >
      {sections.map((section, index) => {
        const Icon = SECTION_ICONS[section.type] ?? LayoutTemplate;
        const labelKey = SECTION_LABEL_KEYS[section.type];
        const label = labelKey ? t(labelKey as any) : section.type;
        const status = getSectionStatus(section);
        const summary = getSectionSummary(section, t);

        return (
          <div
            key={section.type}
            onClick={() => onEditSection(index)}
            className={cn(
              "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-200",
              "hover:shadow-sm hover:-translate-y-px",
              section.enabled
                ? "border-border bg-card"
                : "border-border/50 bg-muted/30"
            )}
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />

            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", !section.enabled && "text-muted-foreground")}>
                {label}
              </p>
              <p className={cn(
                "text-xs truncate",
                status === "incomplete" ? "text-amber-600" : "text-muted-foreground"
              )}>
                {summary}
              </p>
            </div>

            {/* Status dot */}
            <div
              className={cn(
                "size-2 shrink-0 rounded-full transition-colors duration-300",
                STATUS_COLORS[status]
              )}
            />

            {/* Reorder buttons */}
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                disabled={index === 0}
                onClick={() => onMove(index, index - 1)}
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                disabled={index === sections.length - 1}
                onClick={() => onMove(index, index + 1)}
              >
                <ChevronDown className="size-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
