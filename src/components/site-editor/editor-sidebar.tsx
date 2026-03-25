"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Palette, LayoutList, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PublishArea } from "./publish-area";
import type { SiteSection, SocialLinks } from "@/lib/db/schema/site-config";

export type EditorView = "design" | "content" | "details";

interface EditorSidebarProps {
  activeView: EditorView;
  onViewChange: (view: EditorView) => void;
  published: boolean;
  slug: string;
  brand: { logoUrl: string; coverImageUrl: string };
  sections: SiteSection[];
  socialLinks: SocialLinks;
  seo: { metaTitle: string; metaDescription: string };
  staffCount: number;
  onNavigate: (view: EditorView, sectionIndex?: number) => void;
}

const NAV_ITEMS: { id: EditorView; icon: React.ElementType; labelKey: string }[] = [
  { id: "design", icon: Palette, labelKey: "editor.nav_design" },
  { id: "content", icon: LayoutList, labelKey: "editor.nav_content" },
  { id: "details", icon: FileText, labelKey: "editor.nav_details" },
];

export function EditorSidebar({
  activeView,
  onViewChange,
  published,
  slug,
  brand,
  sections,
  socialLinks,
  seo,
  staffCount,
  onNavigate,
}: EditorSidebarProps) {
  const t = useT();

  return (
    <div className="flex h-full flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", duration: 0.25, bounce: 0.1 }}
                />
              )}
              <item.icon className="relative size-4" />
              <span className="relative hidden lg:inline">{t(item.labelKey as any)}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3">
        <PublishArea
          published={published}
          slug={slug}
          brand={brand}
          sections={sections}
          socialLinks={socialLinks}
          seo={seo}
          staffCount={staffCount}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
