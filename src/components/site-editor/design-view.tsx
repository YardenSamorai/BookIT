"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/onboarding/color-picker";
import { ImageUpload } from "@/components/shared/image-upload";
import { THEME_PRESETS, type ThemePreset } from "@/lib/themes/presets";
import { SITE_FONTS, type SiteFont } from "@/lib/themes/fonts";
import { Check, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface DesignViewProps {
  brand: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    coverImageUrl: string;
  };
  themePresetId: string;
  fontId: string | null;
  onBrandChange: (patch: Partial<DesignViewProps["brand"]>) => void;
  onThemeChange: (presetId: string) => void;
  onFontChange: (fontId: string | null) => void;
}

const COLOR_COMBOS = [
  { id: "ocean", name: "Ocean", primary: "#1e3a5f", secondary: "#4da6ff" },
  { id: "forest", name: "Forest", primary: "#2d5016", secondary: "#7bc950" },
  { id: "sunset", name: "Sunset", primary: "#7c2d12", secondary: "#f97316" },
  { id: "royal", name: "Royal", primary: "#4c1d95", secondary: "#a78bfa" },
  { id: "minimal", name: "Minimal", primary: "#18181b", secondary: "#71717a" },
  { id: "rose", name: "Rose", primary: "#881337", secondary: "#fb7185" },
  { id: "teal", name: "Teal", primary: "#134e4a", secondary: "#2dd4bf" },
  { id: "amber", name: "Amber", primary: "#78350f", secondary: "#f59e0b" },
] as const;

const radiusPreview: Record<string, string> = {
  sharp: "rounded-none",
  rounded: "rounded-xl",
  pill: "rounded-full",
};

export function DesignView({
  brand,
  themePresetId,
  fontId,
  onBrandChange,
  onThemeChange,
  onFontChange,
}: DesignViewProps) {
  const t = useT();
  const locale = useLocale();
  const [fontExpanded, setFontExpanded] = useState(false);

  const isHebrew = locale === "he";
  const filteredFonts = SITE_FONTS.filter((f) => (isHebrew ? f.supportsHebrew : true));
  const currentFont = fontId ? SITE_FONTS.find((f) => f.id === fontId) : null;

  return (
    <div className="space-y-5">
      {/* Card 1: Style (theme presets) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("editor.theme_preset")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEME_PRESETS.map((preset) => (
              <ThemePresetCard
                key={preset.id}
                preset={preset}
                isSelected={themePresetId === preset.id}
                onSelect={() => onThemeChange(preset.id)}
                t={t}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("editor.brand_colors")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("editor.colors_helper")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorPicker
              label={t("editor.primary_color")}
              value={brand.primaryColor}
              onChange={(v) => onBrandChange({ primaryColor: v })}
            />
            <ColorPicker
              label={t("editor.secondary_color")}
              value={brand.secondaryColor}
              onChange={(v) => onBrandChange({ secondaryColor: v })}
            />
          </div>

          {/* Suggested color combos */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("editor.suggested_colors")}
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_COMBOS.map((combo) => (
                <button
                  key={combo.id}
                  type="button"
                  onClick={() =>
                    onBrandChange({
                      primaryColor: combo.primary,
                      secondaryColor: combo.secondary,
                    })
                  }
                  className="group flex items-center gap-1 rounded-full border px-2 py-1 transition-all hover:shadow-sm"
                  title={combo.name}
                >
                  <div
                    className="size-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: combo.primary }}
                  />
                  <div
                    className="size-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: combo.secondary }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                    {combo.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Logo & Cover */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("editor.logo_and_cover")}</CardTitle>
          <p className="text-xs text-muted-foreground">{t("editor.logo_cover_helper")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("editor.logo")}</p>
              <ImageUpload
                value={brand.logoUrl}
                onChange={(url) => onBrandChange({ logoUrl: url })}
                folder="logos"
                aspectRatio="square"
                placeholder={t("editor.upload_logo")}
                className="max-w-[180px]"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("editor.hero_banner")}</p>
              <ImageUpload
                value={brand.coverImageUrl}
                onChange={(url) => onBrandChange({ coverImageUrl: url })}
                folder="covers"
                aspectRatio="banner"
                placeholder={t("editor.upload_hero")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Font (collapsed by default) */}
      <Card>
        <button
          onClick={() => setFontExpanded(!fontExpanded)}
          className="flex w-full items-center justify-between px-6 py-4 text-start"
        >
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{t("editor.font_family")}</CardTitle>
            {currentFont && (
              <span className="text-sm text-muted-foreground">{currentFont.name}</span>
            )}
            {!currentFont && (
              <span className="text-sm text-muted-foreground">{t("editor.font_default")}</span>
            )}
          </div>
          {fontExpanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {fontExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 pb-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Default option */}
                  <button
                    type="button"
                    onClick={() => onFontChange(null)}
                    className={`relative flex items-center gap-3 rounded-xl border-2 p-3 text-start transition-all ${
                      fontId === null
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    {fontId === null && (
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
                    <FontCard
                      key={font.id}
                      font={font}
                      isSelected={fontId === font.id}
                      onSelect={() => onFontChange(font.id)}
                      t={t}
                    />
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function ThemePresetCard({
  preset,
  isSelected,
  onSelect,
  t,
}: {
  preset: ThemePreset;
  isSelected: boolean;
  onSelect: () => void;
  t: (key: any) => string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col gap-2 rounded-xl border-2 p-3 text-start transition-all ${
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
        <div
          className="flex items-center justify-between px-2 py-1"
          style={{
            backgroundColor: preset.navStyle === "white" ? "white" : preset.primaryColor,
          }}
        >
          <div
            className="h-1.5 w-8 rounded-full"
            style={{
              backgroundColor:
                preset.navStyle === "white" ? preset.primaryColor : "rgba(255,255,255,0.8)",
            }}
          />
          <div
            className={`h-2.5 w-8 ${radiusPreview[preset.borderRadius]}`}
            style={{ backgroundColor: preset.secondaryColor }}
          />
        </div>
        <div
          className="flex h-10 items-center justify-center"
          style={{ backgroundColor: preset.primaryColor }}
        >
          <div className="h-1.5 w-16 rounded-full bg-white/80" />
        </div>
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
      <div>
        <p className="text-sm font-semibold">{t(preset.nameKey)}</p>
        <p className="text-xs text-muted-foreground">{t(preset.descriptionKey)}</p>
      </div>
    </button>
  );
}

const FONT_CAT_KEYS: Record<string, string> = {
  sans: "font.cat_sans",
  serif: "font.cat_serif",
  display: "font.cat_display",
};

function FontCard({
  font,
  isSelected,
  onSelect,
  t,
}: {
  font: SiteFont;
  isSelected: boolean;
  onSelect: () => void;
  t: (key: any) => string;
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
        <p className="text-lg font-semibold leading-tight" style={{ fontFamily: font.name }}>
          {font.preview}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium">{font.name}</p>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {t(FONT_CAT_KEYS[font.category] ?? font.category)}
          </span>
        </div>
      </button>
    </>
  );
}
