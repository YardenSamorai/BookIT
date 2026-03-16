"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";

interface AboutSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function AboutSectionEditor({ content, onChange }: AboutSectionEditorProps) {
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("about.section_title")}</Label>
        <Input
          value={(content.title as string) ?? "About Us"}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("about.section_title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("about.description")}</Label>
        <textarea
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={(content.description as string) ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder={t("about.description_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("about.image")}</Label>
        <ImageUpload
          value={(content.image as string) ?? ""}
          onChange={(url) => onChange({ image: url })}
          folder="about"
          aspectRatio="video"
          placeholder={t("about.image_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("about.highlight1")}</Label>
        <Input
          value={(content.highlight_1 as string) ?? ""}
          onChange={(e) => onChange({ highlight_1: e.target.value })}
          placeholder={t("about.highlight1_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("about.highlight2")}</Label>
        <Input
          value={(content.highlight_2 as string) ?? ""}
          onChange={(e) => onChange({ highlight_2: e.target.value })}
          placeholder={t("about.highlight2_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("about.highlight3")}</Label>
        <Input
          value={(content.highlight_3 as string) ?? ""}
          onChange={(e) => onChange({ highlight_3: e.target.value })}
          placeholder={t("about.highlight3_ph")}
        />
      </div>
    </div>
  );
}
