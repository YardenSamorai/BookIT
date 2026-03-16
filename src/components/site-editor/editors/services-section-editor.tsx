"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      <p className="text-xs text-muted-foreground">
        {t("svc_editor.auto_desc")}
      </p>
    </div>
  );
}
