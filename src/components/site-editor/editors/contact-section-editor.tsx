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

interface ContactSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function ContactSectionEditor({ content, onChange }: ContactSectionEditorProps) {
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("contact_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? "Contact & Hours"}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("contact_editor.title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("contact_editor.map_url")}</Label>
        <Input
          value={(content.map_embed_url as string) ?? ""}
          onChange={(e) => onChange({ map_embed_url: e.target.value })}
          placeholder="https://www.google.com/maps/embed?pb=..."
        />
        <p className="text-xs text-muted-foreground">
          {t("contact_editor.map_helper")}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t("contact_editor.layout")}</Label>
        <Select
          value={(content.layout as string) ?? "split"}
          onValueChange={(v) => v && onChange({ layout: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="split">{t("contact_editor.split")}</SelectItem>
            <SelectItem value="stacked">{t("contact_editor.stacked")}</SelectItem>
            <SelectItem value="with_map">{t("contact_editor.info_map")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("contact_editor.auto_desc")}
      </p>
    </div>
  );
}
