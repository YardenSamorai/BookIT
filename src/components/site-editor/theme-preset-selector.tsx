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
import { THEME_PRESETS, type ThemePreset } from "@/lib/themes/presets";
import { Check, Loader2, Save } from "lucide-react";
import { updateThemePreset } from "@/actions/site-editor";

interface ThemePresetSelectorProps {
  currentPresetId: string;
  onPresetSelect: (preset: ThemePreset) => void;
}

const radiusPreview: Record<string, string> = {
  sharp: "rounded-none",
  rounded: "rounded-xl",
  pill: "rounded-full",
};

export function ThemePresetSelector({
  currentPresetId,
  onPresetSelect,
}: ThemePresetSelectorProps) {
  const t = useT();
  const [selected, setSelected] = useState(currentPresetId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await updateThemePreset(selected);
    if (result.success) {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editor.theme_preset")}</CardTitle>
        <CardDescription>
          {t("editor.theme_preset_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_PRESETS.map((preset) => {
            const isSelected = selected === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelected(preset.id);
                  onPresetSelect(preset);
                  setSaved(false);
                }}
                className={`relative flex flex-col gap-3 rounded-xl border-2 p-4 text-start transition-all ${
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

                {/* Mini site preview */}
                <div className="overflow-hidden rounded-lg border bg-white">
                  {/* Nav bar */}
                  <div
                    className="flex items-center justify-between px-2 py-1"
                    style={{
                      backgroundColor:
                        preset.navStyle === "white" ? "white" : preset.primaryColor,
                    }}
                  >
                    <div
                      className="h-1.5 w-8 rounded-full"
                      style={{
                        backgroundColor:
                          preset.navStyle === "white"
                            ? preset.primaryColor
                            : "rgba(255,255,255,0.8)",
                      }}
                    />
                    <div
                      className={`h-2.5 w-8 ${radiusPreview[preset.borderRadius]}`}
                      style={{ backgroundColor: preset.secondaryColor }}
                    />
                  </div>
                  {/* Hero area */}
                  <div
                    className="flex h-10 items-center justify-center"
                    style={{ backgroundColor: preset.primaryColor }}
                  >
                    <div className="h-1.5 w-16 rounded-full bg-white/80" />
                  </div>
                  {/* Cards area */}
                  <div className="flex gap-1 p-1.5">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`h-6 flex-1 ${radiusPreview[preset.borderRadius]} ${
                          preset.cardStyle === "shadow"
                            ? "border shadow-sm"
                            : preset.cardStyle === "bordered"
                              ? "border-2"
                              : preset.cardStyle === "glass"
                                ? "border bg-gray-50/50"
                                : "bg-gray-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Style chips */}
                <div className="flex flex-wrap gap-1">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {preset.borderRadius}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {preset.fontStyle}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {preset.cardStyle}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {preset.buttonStyle}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold">{preset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="size-4" />
            {t("editor.theme_saved")}
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Save className="me-2 size-4" />
          )}
          {t("editor.save_theme")}
        </Button>
      </CardContent>
    </Card>
  );
}
