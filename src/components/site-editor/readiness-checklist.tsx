"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SiteSection, SocialLinks } from "@/lib/db/schema/site-config";
import type { EditorView } from "./editor-sidebar";

interface ReadinessChecklistProps {
  brand: {
    logoUrl: string;
    coverImageUrl: string;
  };
  sections: SiteSection[];
  socialLinks: SocialLinks;
  seo: { metaTitle: string; metaDescription: string };
  staffCount: number;
  onNavigate: (view: EditorView, sectionIndex?: number) => void;
}

interface ChecklistItem {
  id: string;
  labelKey: string;
  done: boolean;
  navigateTo: EditorView;
  sectionIndex?: number;
}

export function ReadinessChecklist({
  brand,
  sections,
  socialLinks,
  seo,
  staffCount,
  onNavigate,
}: ReadinessChecklistProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const items = useMemo((): ChecklistItem[] => {
    const heroSection = sections.find((s) => s.type === "hero");
    const aboutSection = sections.find((s) => s.type === "about");
    const gallerySection = sections.find((s) => s.type === "gallery");
    const galleryIndex = sections.findIndex((s) => s.type === "gallery");

    const heroHeadline = (heroSection?.content?.headline as string) ?? "";
    const aboutDesc = (aboutSection?.content?.description as string) ?? "";
    const galleryImages = Array.isArray(gallerySection?.content?.images)
      ? (gallerySection.content.images as unknown[])
      : [];
    const hasSocialLink = Object.values(socialLinks).some(
      (v) => v != null && v !== ""
    );

    return [
      {
        id: "logo",
        labelKey: "readiness.upload_logo",
        done: !!brand.logoUrl,
        navigateTo: "design",
      },
      {
        id: "cover",
        labelKey: "readiness.upload_cover",
        done: !!brand.coverImageUrl,
        navigateTo: "design",
      },
      {
        id: "hero_headline",
        labelKey: "readiness.hero_headline",
        done: heroHeadline.length > 0,
        navigateTo: "content",
        sectionIndex: sections.findIndex((s) => s.type === "hero"),
      },
      {
        id: "about_desc",
        labelKey: "readiness.about_description",
        done: aboutDesc.length > 0,
        navigateTo: "content",
        sectionIndex: sections.findIndex((s) => s.type === "about"),
      },
      {
        id: "has_service",
        labelKey: "readiness.has_service",
        done: true,
        navigateTo: "content",
      },
      {
        id: "has_staff",
        labelKey: "readiness.has_staff",
        done: staffCount > 0,
        navigateTo: "content",
        sectionIndex: sections.findIndex((s) => s.type === "team"),
      },
      {
        id: "gallery_image",
        labelKey: "readiness.gallery_image",
        done:
          !gallerySection?.enabled ||
          galleryImages.some(
            (img) => !!(img as Record<string, unknown>)?.url
          ),
        navigateTo: "content",
        sectionIndex: galleryIndex >= 0 ? galleryIndex : undefined,
      },
      {
        id: "social_link",
        labelKey: "readiness.social_link",
        done: hasSocialLink,
        navigateTo: "details",
      },
      {
        id: "meta_title",
        labelKey: "readiness.meta_title",
        done: seo.metaTitle.length > 0,
        navigateTo: "details",
      },
      {
        id: "meta_desc",
        labelKey: "readiness.meta_description",
        done: seo.metaDescription.length > 0,
        navigateTo: "details",
      },
    ];
  }, [brand, sections, socialLinks, seo, staffCount]);

  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const remaining = items.filter((i) => !i.done);
  const allDone = remaining.length === 0;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-2.5">
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-400 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {allDone ? (
        <p className="text-xs font-medium text-emerald-600">
          {t("readiness.all_done")}
        </p>
      ) : (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between text-xs"
          >
            <span className="font-medium text-muted-foreground">
              {t("readiness.ways_to_improve", { count: remaining.length })}
            </span>
            {expanded ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </button>

          {expanded && (
            <ul className="mt-2 space-y-1">
              {remaining.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.navigateTo, item.sectionIndex)}
                    className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-start text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                    {t(item.labelKey as any)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
