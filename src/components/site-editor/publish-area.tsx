"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Eye } from "lucide-react";
import { toggleSitePublished } from "@/actions/site-editor";
import { ReadinessChecklist } from "./readiness-checklist";
import type { SiteSection, SocialLinks } from "@/lib/db/schema/site-config";
import type { EditorView } from "./editor-sidebar";

interface PublishAreaProps {
  published: boolean;
  slug: string;
  brand: { logoUrl: string; coverImageUrl: string };
  sections: SiteSection[];
  socialLinks: SocialLinks;
  seo: { metaTitle: string; metaDescription: string };
  staffCount: number;
  onNavigate: (view: EditorView, sectionIndex?: number) => void;
}

export function PublishArea({
  published: initialPublished,
  slug,
  brand,
  sections,
  socialLinks,
  seo,
  staffCount,
  onNavigate,
}: PublishAreaProps) {
  const t = useT();
  const [published, setPublished] = useState(initialPublished);
  const [toggling, setToggling] = useState(false);

  const siteUrl = `/b/${slug}`;

  async function handleToggle(checked: boolean) {
    setToggling(true);
    const result = await toggleSitePublished(!!checked);
    if (result.success) {
      setPublished(!!checked);
    }
    setToggling(false);
  }

  return (
    <div className="space-y-3 border-t pt-3">
      <ReadinessChecklist
        brand={brand}
        sections={sections}
        socialLinks={socialLinks}
        seo={seo}
        staffCount={staffCount}
        onNavigate={onNavigate}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={published}
            onCheckedChange={handleToggle}
            disabled={toggling}
          />
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Globe className="size-3.5" />
            {published ? t("editor.published") : t("editor.draft")}
          </span>
        </div>
      </div>

      {published ? (
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => window.open(siteUrl, "_blank")}
        >
          {t("editor.view_site")}
          <ExternalLink className="ms-2 size-3.5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(siteUrl, "_blank")}
        >
          {t("editor.preview_draft")}
          <Eye className="ms-2 size-3.5" />
        </Button>
      )}
    </div>
  );
}
