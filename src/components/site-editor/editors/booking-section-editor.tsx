"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookingSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function BookingSectionEditor({ content, onChange }: BookingSectionEditorProps) {
  const t = useT();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("booking_editor.title" as any)}</Label>
        <Input
          value={(content.title as string) ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("booking_editor.title_ph" as any)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("booking_editor.subtitle" as any)}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("booking_editor.subtitle_ph" as any)}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("booking_editor.button_text" as any)}</Label>
        <Input
          value={(content.button_text as string) ?? ""}
          onChange={(e) => onChange({ button_text: e.target.value })}
          placeholder={t("booking_editor.button_text_ph" as any)}
        />
      </div>
    </div>
  );
}
