"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Save, RotateCcw } from "lucide-react";
import { SITE_FONTS, type SiteFont } from "@/lib/themes/fonts";
import { updateFontFamily } from "@/actions/site-editor";
import { useLocale } from "@/lib/i18n/locale-context";

interface FontSelectorProps {
  currentFontId: string | null;
}

export function FontSelector({ currentFontId }: FontSelectorProps) {
  const t = useT();
  const locale = useLocale();
  const [selected, setSelected] = useState<string | null>(currentFontId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isHebrew = locale === "he";
  const filteredFonts = SITE_FONTS.filter(
    (f) => isHebrew ? f.supportsHebrew : true
  );

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await updateFontFamily(selected);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editor.font_family")}</CardTitle>
        <CardDescription>{t("editor.font_family_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setSaved(false);
            }}
            className={`relative flex items-center gap-3 rounded-xl border-2 p-3 text-start transition-all ${
              selected === null
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-muted hover:border-muted-foreground/30"
            }`}
          >
            {selected === null && (
              <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                <Check className="size-3" />
              </div>
            )}
            <RotateCcw className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{t("editor.font_default")}</p>
              <p className="text-xs text-muted-foreground">{t("editor.font_from_theme")}</p>
            </div>
          </button>

          {filteredFonts.map((font) => (
            <FontOption
              key={font.id}
              font={font}
              isSelected={selected === font.id}
              onSelect={() => {
                setSelected(font.id);
                setSaved(false);
              }}
            />
          ))}
        </div>

        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="size-4" />
            {t("editor.font_saved")}
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Save className="me-2 size-4" />
          )}
          {t("editor.save_font")}
        </Button>
      </CardContent>
    </Card>
  );
}

function FontOption({
  font,
  isSelected,
  onSelect,
}: {
  font: SiteFont;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <>
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`}
      />
      <button
        type="button"
        onClick={onSelect}
        className={`relative flex flex-col gap-1.5 rounded-xl border-2 p-3 text-start transition-all ${
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-muted hover:border-muted-foreground/30"
        }`}
      >
        {isSelected && (
          <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-white">
            <Check className="size-3" />
          </div>
        )}
        <p
          className="text-lg font-semibold leading-tight"
          style={{ fontFamily: font.name }}
        >
          {font.preview}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-foreground">{font.name}</p>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {font.category}
          </span>
        </div>
      </button>
    </>
  );
}
