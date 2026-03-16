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

interface TeamSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function TeamSectionEditor({ content, onChange }: TeamSectionEditorProps) {
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("team_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? "Meet Our Team"}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("team_editor.title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("team_editor.subtitle")}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("team_editor.subtitle_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("team_editor.card_style")}</Label>
        <Select
          value={(content.card_style as string) ?? "photo"}
          onValueChange={(v) => v && onChange({ card_style: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="photo">{t("team_editor.photo_card")}</SelectItem>
            <SelectItem value="avatar">{t("team_editor.avatar_bio")}</SelectItem>
            <SelectItem value="minimal">{t("team_editor.minimal")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("team_editor.show_bio")}</Label>
        <Select
          value={String(content.show_bio ?? "true")}
          onValueChange={(v) => v != null && onChange({ show_bio: v === "true" })}
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
        {t("team_editor.auto_desc")}
      </p>
    </div>
  );
}
