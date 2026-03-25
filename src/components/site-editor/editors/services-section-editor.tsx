"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/onboarding/color-picker";
import { ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServicesSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function ServicesSectionEditor({ content, onChange }: ServicesSectionEditorProps) {
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("svc_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? "Our Services"}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("svc_editor.title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("svc_editor.subtitle")}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("svc_editor.subtitle_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("svc_editor.card_layout")}</Label>
        <Select
          value={(content.card_layout as string) ?? "grid"}
          onValueChange={(v) => v && onChange({ card_layout: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">{t("svc_editor.grid")}</SelectItem>
            <SelectItem value="list">{t("svc_editor.list")}</SelectItem>
            <SelectItem value="compact">{t("svc_editor.compact")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("svc_editor.show_prices")}</Label>
        <Select
          value={String(content.show_prices ?? "true")}
          onValueChange={(v) => v != null && onChange({ show_prices: v === "true" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t("common.yes")}</SelectItem>
            <SelectItem value="false">{t("common.no")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("svc_editor.show_duration")}</Label>
        <Select
          value={String(content.show_duration ?? "true")}
          onValueChange={(v) => v != null && onChange({ show_duration: v === "true" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t("common.yes")}</SelectItem>
            <SelectItem value="false">{t("common.no")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Colors */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
          <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
          {t("hero.custom_colors" as any)}
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorPicker
              label={t("svc_editor.title_color" as any)}
              value={(content.title_color as string) ?? ""}
              onChange={(v) => onChange({ title_color: v })}
            />
            <ColorPicker
              label={t("svc_editor.subtitle_color" as any)}
              value={(content.subtitle_color as string) ?? ""}
              onChange={(v) => onChange({ subtitle_color: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorPicker
              label={t("svc_editor.btn_bg_color" as any)}
              value={(content.btn_bg_color as string) ?? ""}
              onChange={(v) => onChange({ btn_bg_color: v })}
            />
            <ColorPicker
              label={t("svc_editor.btn_text_color" as any)}
              value={(content.btn_text_color as string) ?? ""}
              onChange={(v) => onChange({ btn_text_color: v })}
            />
          </div>
        </div>
      </details>

      <p className="text-xs text-muted-foreground">
        {t("svc_editor.auto_desc")}
      </p>
    </div>
  );
}
