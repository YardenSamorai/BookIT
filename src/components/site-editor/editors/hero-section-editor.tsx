"use client";

import { useState, useMemo } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/onboarding/color-picker";
import {
  Check,
  Upload,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  ChevronDown,
  ChevronRight,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HERO_BACKGROUNDS,
  BACKGROUND_CATEGORIES,
  PHOTO_SUBCATEGORIES,
  PHOTOS_PER_PAGE,
  HERO_FONT_STYLES,
  HERO_TEXT_SIZES,
  type HeroBackground,
} from "@/lib/themes/hero-backgrounds";

interface HeroSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

type HeroTab = "text" | "style" | "background";

const ALIGNMENT_ICONS = { left: AlignLeft, center: AlignCenter, right: AlignRight };

const TAB_CONFIG: { id: HeroTab; icon: React.ElementType; labelKey: string }[] = [
  { id: "text", icon: Type, labelKey: "hero.tab_text" },
  { id: "style", icon: Palette, labelKey: "hero.tab_style" },
  { id: "background", icon: Image, labelKey: "hero.tab_background" },
];

export function HeroSectionEditor({ content, onChange }: HeroSectionEditorProps) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<HeroTab>("text");
  const bgMode = (content.bg_mode as string) ?? "preset";
  const selectedPresetId = (content.bg_preset_id as string) ?? "";
  const [activeCategory, setActiveCategory] = useState<string>("photo");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("all");
  const [photoPage, setPhotoPage] = useState(1);

  const filteredBackgrounds = useMemo(() => {
    let items = HERO_BACKGROUNDS.filter((bg) => bg.category === activeCategory);

    if (activeCategory === "photo" && activeSubcategory !== "all") {
      items = items.filter((bg) => bg.subcategory === activeSubcategory);
    }

    return items;
  }, [activeCategory, activeSubcategory]);

  const visiblePhotos = useMemo(() => {
    if (activeCategory !== "photo") return filteredBackgrounds;
    return filteredBackgrounds.slice(0, photoPage * PHOTOS_PER_PAGE);
  }, [activeCategory, filteredBackgrounds, photoPage]);

  const hasMorePhotos =
    activeCategory === "photo" && visiblePhotos.length < filteredBackgrounds.length;
  const remainingCount = filteredBackgrounds.length - visiblePhotos.length;

  const currentFontStyle = (content.font_style as string) ?? "clean-sans";
  const currentTextSize = (content.text_size as string) ?? "lg";
  const currentAlignment = (content.text_align as string) ?? "left";

  function selectPreset(bg: HeroBackground) {
    onChange({
      bg_mode: "preset",
      bg_preset_id: bg.id,
      background_image: "",
    });
  }

  function switchToUpload() {
    onChange({
      bg_mode: "upload",
      bg_preset_id: "",
    });
  }

  function handleCategoryChange(catId: string) {
    setActiveCategory(catId);
    if (catId === "photo") {
      setActiveSubcategory("all");
      setPhotoPage(1);
    }
  }

  function handleSubcategoryChange(subId: string) {
    setActiveSubcategory(subId);
    setPhotoPage(1);
  }

  const displayItems = activeCategory === "photo" ? visiblePhotos : filteredBackgrounds;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-3.5" />
            {t(tab.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Text tab */}
      {activeTab === "text" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("hero.headline")}</Label>
            <Input
              value={(content.headline as string) ?? ""}
              onChange={(e) => onChange({ headline: e.target.value })}
              placeholder={t("hero.headline_ph")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("hero.subtitle")}</Label>
            <Textarea
              value={(content.subtitle as string) ?? ""}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder={t("hero.subtitle_ph")}
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("hero.cta_text")}</Label>
              <Input
                value={(content.cta_text as string) ?? "Book Now"}
                onChange={(e) => onChange({ cta_text: e.target.value })}
                placeholder={t("hero.cta_ph")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hero.secondary_text")}</Label>
              <Input
                value={(content.cta_secondary_text as string) ?? ""}
                onChange={(e) => onChange({ cta_secondary_text: e.target.value })}
                placeholder={t("hero.secondary_ph")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Style tab */}
      {activeTab === "style" && (
        <div className="space-y-4">
          {/* Text Alignment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("hero.text_align")}</Label>
            <div className="flex gap-1.5">
              {(["left", "center", "right"] as const).map((align) => {
                const Icon = ALIGNMENT_ICONS[align];
                const alignKey = { left: "hero.align_left", center: "hero.align_center", right: "hero.align_right" } as const;
                return (
                  <Button
                    key={align}
                    type="button"
                    variant={currentAlignment === align ? "default" : "outline"}
                    size="sm"
                    className="h-9 flex-1 gap-1.5"
                    onClick={() => onChange({ text_align: align })}
                  >
                    <Icon className="size-4" />
                    <span className="text-xs">{t(alignKey[align])}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Font Style */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("hero.font_style")}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {HERO_FONT_STYLES.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => onChange({ font_style: font.id })}
                  className={`rounded-lg border-2 px-3 py-2.5 text-start transition-all ${
                    currentFontStyle === font.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-muted hover:border-muted-foreground/30"
                  }`}
                >
                  <span
                    className="block truncate text-sm"
                    style={{
                      fontFamily: font.fontFamily,
                      textTransform: font.textTransform,
                      letterSpacing:
                        font.textTransform === "uppercase" ? "0.1em" : "normal",
                    }}
                  >
                    {font.preview}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {font.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Text Size */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t("hero.headline_size")}</Label>
            <div className="flex gap-1.5">
              {HERO_TEXT_SIZES.map((size) => (
                <Button
                  key={size.id}
                  type="button"
                  variant={currentTextSize === size.id ? "default" : "outline"}
                  size="sm"
                  className="h-9 flex-1 text-xs"
                  onClick={() => onChange({ text_size: size.id })}
                >
                  {size.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Show/hide badge */}
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(content.show_badge as boolean) ?? true}
                onChange={(e) => onChange({ show_badge: e.target.checked })}
                className="size-4 rounded border-muted-foreground/30"
              />
              {t("hero.show_badge")}
            </label>
          </div>

          {/* Font & Button Colors */}
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
              <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
              {t("hero.custom_colors" as any)}
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorPicker
                  label={t("hero.title_color" as any)}
                  value={(content.title_color as string) ?? ""}
                  onChange={(v) => onChange({ title_color: v })}
                />
                <ColorPicker
                  label={t("hero.subtitle_color" as any)}
                  value={(content.subtitle_color as string) ?? ""}
                  onChange={(v) => onChange({ subtitle_color: v })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorPicker
                  label={t("hero.cta_bg_color" as any)}
                  value={(content.cta_bg_color as string) ?? ""}
                  onChange={(v) => onChange({ cta_bg_color: v })}
                />
                <ColorPicker
                  label={t("hero.cta_text_color" as any)}
                  value={(content.cta_text_color as string) ?? ""}
                  onChange={(v) => onChange({ cta_text_color: v })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorPicker
                  label={t("hero.cta2_bg_color" as any)}
                  value={(content.cta2_bg_color as string) ?? ""}
                  onChange={(v) => onChange({ cta2_bg_color: v })}
                />
                <ColorPicker
                  label={t("hero.cta2_text_color" as any)}
                  value={(content.cta2_text_color as string) ?? ""}
                  onChange={(v) => onChange({ cta2_text_color: v })}
                />
              </div>
            </div>
          </details>

          {/* Overlay & Layout */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("hero.overlay")}</Label>
              <Select
                value={String(content.overlay_opacity ?? "0.5")}
                onValueChange={(v) => v && onChange({ overlay_opacity: parseFloat(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t("hero.overlay_none")}</SelectItem>
                  <SelectItem value="0.2">{t("hero.overlay_vlight")}</SelectItem>
                  <SelectItem value="0.3">{t("hero.overlay_light")}</SelectItem>
                  <SelectItem value="0.5">{t("hero.overlay_medium")}</SelectItem>
                  <SelectItem value="0.7">{t("hero.overlay_heavy")}</SelectItem>
                  <SelectItem value="0.85">{t("hero.overlay_vheavy")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("hero.layout_mode")}</Label>
              <Select
                value={(content.layout as string) ?? "center"}
                onValueChange={(v) => v && onChange({ layout: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">{t("hero.layout_fullwidth")}</SelectItem>
                  <SelectItem value="split">{t("hero.layout_split")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Background tab */}
      {activeTab === "background" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">{t("hero.background")}</Label>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant={bgMode === "preset" ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => onChange({ bg_mode: "preset" })}
              >
                <Palette className="size-3.5" />
                {t("hero.presets")}
              </Button>
              <Button
                type="button"
                variant={bgMode === "upload" ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={switchToUpload}
              >
                <Upload className="size-3.5" />
                {t("common.upload")}
              </Button>
            </div>
          </div>

          {bgMode === "upload" ? (
            <div className="space-y-3">
              <ImageUpload
                value={(content.background_image as string) ?? ""}
                onChange={(url) => onChange({ background_image: url })}
                folder="hero"
                aspectRatio="banner"
                placeholder={t("hero.upload_bg")}
              />
              <p className="text-xs text-muted-foreground">
                {t("hero.upload_hint")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Category tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {BACKGROUND_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    {t(cat.labelKey as any)}
                  </Button>
                ))}
              </div>

              {/* Photo subcategory chips */}
              {activeCategory === "photo" && (
                <div className="flex flex-wrap gap-1.5">
                  {PHOTO_SUBCATEGORIES.map((sub) => {
                    const count =
                      sub.id === "all"
                        ? HERO_BACKGROUNDS.filter((bg) => bg.category === "photo").length
                        : HERO_BACKGROUNDS.filter(
                            (bg) => bg.category === "photo" && bg.subcategory === sub.id
                          ).length;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubcategoryChange(sub.id)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                          activeSubcategory === sub.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-muted text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                        }`}
                      >
                        {t(sub.labelKey as any)}
                        <span className="ms-1 opacity-50">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Background grid */}
              <div
                className={`grid gap-2 ${
                  activeCategory === "photo"
                    ? "grid-cols-2 sm:grid-cols-3"
                    : "grid-cols-3 sm:grid-cols-4"
                }`}
              >
                {displayItems.map((bg) => {
                  const isSelected = selectedPresetId === bg.id;
                  const isPhoto = bg.type === "image";
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => selectPreset(bg)}
                      className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                        isPhoto ? "aspect-video" : "aspect-[16/10]"
                      } ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      {isPhoto ? (
                        <img
                          src={bg.preview}
                          alt={bg.name}
                          className="absolute inset-0 size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{ background: bg.preview }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-[10px] font-medium text-white">
                          {bg.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow">
                          <Check className="size-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Load More button for photos */}
              {hasMorePhotos && (
                <button
                  type="button"
                  onClick={() => setPhotoPage((p) => p + 1)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/30 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/50 hover:text-foreground"
                >
                  <ChevronDown className="size-3.5" />
                  {t("hero.load_more")} ({remainingCount})
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
