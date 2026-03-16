"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CtaSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function CtaSectionEditor({ content, onChange }: CtaSectionEditorProps) {
  const t = useT();
  const bgStyle = (content.bg_style as string) ?? "gradient";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("cta_editor.headline")}</Label>
        <Input
          value={(content.headline as string) ?? "Ready to book your next appointment?"}
          onChange={(e) => onChange({ headline: e.target.value })}
          placeholder={t("cta_editor.headline_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("cta_editor.subtitle")}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("cta_editor.subtitle_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("cta_editor.button_text")}</Label>
        <Input
          value={(content.button_text as string) ?? "Book Now"}
          onChange={(e) => onChange({ button_text: e.target.value })}
          placeholder={t("cta_editor.button_text_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("cta_editor.button_link")}</Label>
        <Input
          value={(content.button_link as string) ?? "#services"}
          onChange={(e) => onChange({ button_link: e.target.value })}
          placeholder={t("cta_editor.button_link_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("cta_editor.bg_style")}</Label>
        <Select
          value={bgStyle}
          onValueChange={(v) => v && onChange({ bg_style: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient">{t("cta_editor.gradient")}</SelectItem>
            <SelectItem value="solid">{t("cta_editor.solid")}</SelectItem>
            <SelectItem value="image">{t("cta_editor.image")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bgStyle === "image" && (
        <div className="space-y-2">
          <Label>{t("cta_editor.bg_image")}</Label>
          <ImageUpload
            value={(content.bg_image as string) ?? ""}
            onChange={(url) => onChange({ bg_image: url })}
            folder="cta"
            aspectRatio="banner"
            placeholder={t("cta_editor.bg_image")}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("cta_editor.layout")}</Label>
        <Select
          value={(content.layout as string) ?? "centered"}
          onValueChange={(v) => v && onChange({ layout: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="centered">{t("cta_editor.centered")}</SelectItem>
            <SelectItem value="left">{t("cta_editor.left")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
