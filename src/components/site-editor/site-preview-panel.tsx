"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { DAYS_SHORT_KEYS } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildSiteTheme } from "@/lib/themes/presets";
import { getHeroBackground, getHeroFontStyle, getHeroTextSize } from "@/lib/themes/hero-backgrounds";
import { Monitor, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteSection } from "@/lib/db/schema/site-config";
import type { InferSelectModel } from "drizzle-orm";
import type { services, staffMembers, businessHours } from "@/lib/db/schema";

type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;
type HoursRow = InferSelectModel<typeof businessHours>;

interface SitePreviewPanelProps {
  brand: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    coverImageUrl: string;
  };
  businessName: string;
  sections: SiteSection[];
  services: Service[];
  staff: StaffMember[];
  hours: HoursRow[];
  currency: string;
  themePresetId?: string;
}


function formatTime(t: string) {
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

export function SitePreviewPanel({
  brand,
  businessName,
  sections,
  services: serviceList,
  staff,
  hours,
  currency,
  themePresetId = "modern",
}: SitePreviewPanelProps) {
  const t = useT();
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const theme = buildSiteTheme(themePresetId, brand.primaryColor, brand.secondaryColor);
  const enabled = sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const isMobile = viewMode === "mobile";

  const borderRadiusMap = {
    sharp: "rounded-none",
    rounded: "rounded-md",
    pill: "rounded-full",
  };
  const r = borderRadiusMap[theme.preset.borderRadius] ?? "rounded-md";
  const isWhiteNav = theme.preset.navStyle === "white";

  return (
    <div className="sticky top-24">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("editor.live_preview")}
        </p>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="size-3.5" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="size-3.5" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-xl border shadow-lg transition-all duration-300",
          isMobile ? "mx-auto w-[240px]" : "w-full"
        )}
      >
        <div className="h-[calc(100vh-200px)] overflow-y-auto bg-white">
          <div
            className={cn(
              "text-[10px] leading-relaxed",
              theme.preset.fontStyle === "classic" ? "font-serif" : "font-sans"
            )}
          >
            {/* Nav */}
            <div
              className={cn(
                "sticky top-0 z-10 flex items-center justify-between px-3 py-2",
                isWhiteNav
                  ? "border-b border-gray-100 bg-white"
                  : "border-b border-white/10 bg-white/5 backdrop-blur-md"
              )}
              style={isWhiteNav ? {} : { backgroundColor: `${brand.primaryColor}ee` }}
            >
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="" className="h-5 w-auto" />
              ) : (
                <span
                  className={cn("font-bold", isWhiteNav ? "text-gray-900" : "text-white")}
                  style={isWhiteNav ? {} : { color: "white" }}
                >
                  {businessName}
                </span>
              )}
              <div
                className={cn("px-2 py-0.5 text-[8px] font-semibold", r)}
                style={
                  theme.preset.buttonStyle === "outline"
                    ? {
                        borderWidth: "1px",
                        borderColor: brand.secondaryColor,
                        color: isWhiteNav ? brand.secondaryColor : "white",
                      }
                    : theme.preset.buttonStyle === "gradient"
                      ? {
                          background: `linear-gradient(135deg, ${brand.secondaryColor}, ${brand.primaryColor})`,
                          color: "white",
                        }
                      : { backgroundColor: brand.secondaryColor, color: "white" }
                }
              >
                {t("pub.book_now")}
              </div>
            </div>

            {/* Sections */}
            {enabled.map((section, idx) => (
              <PreviewSection
                key={section.type}
                section={section}
                sectionIndex={idx}
                brand={brand}
                businessName={businessName}
                services={serviceList}
                staff={staff}
                hours={hours}
                currency={currency}
                theme={theme}
                r={r}
                t={t}
              />
            ))}

            {/* Footer */}
            <div
              className="px-3 py-3 text-center text-[8px]"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <span className="text-white/40">
                {t("pub.powered_by")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  section,
  sectionIndex,
  brand,
  businessName,
  services: serviceList,
  staff,
  hours,
  currency,
  theme,
  r,
  t,
}: {
  section: SiteSection;
  sectionIndex: number;
  brand: SitePreviewPanelProps["brand"];
  businessName: string;
  services: Service[];
  staff: StaffMember[];
  hours: HoursRow[];
  currency: string;
  theme: ReturnType<typeof buildSiteTheme>;
  r: string;
  t: (key: import("@/lib/i18n").TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  const c = section.content;
  const isAlt = sectionIndex % 2 === 1;
  const sectionBg = isAlt ? "bg-gray-50/60" : "bg-white";
  const headingClass = cn(
    "mb-1 text-[9px] font-bold",
    theme.preset.fontStyle === "classic" ? "font-serif" : "font-sans"
  );

  const cardClass = cn(
    "p-1.5",
    r,
    theme.preset.cardStyle === "shadow" && "border bg-white shadow-sm",
    theme.preset.cardStyle === "bordered" && "border-2 border-gray-200 bg-white",
    theme.preset.cardStyle === "flat" && "bg-gray-50/80",
    theme.preset.cardStyle === "glass" && "border border-white/20 bg-white/80 backdrop-blur-sm"
  );

  switch (section.type) {
    case "hero":
      {
        const bgMode = (c.bg_mode as string) || "upload";
        const presetBg = bgMode === "preset" && typeof c.bg_preset_id === "string"
          ? getHeroBackground(c.bg_preset_id)
          : undefined;
        const hasUploadedImage = bgMode === "upload" && (c.background_image || brand.coverImageUrl);
        const isPresetPhoto = presetBg?.type === "image";
        const isPresetCss = presetBg?.type === "css";
        const showImage = hasUploadedImage || isPresetPhoto;
        const imgSrc = hasUploadedImage
          ? ((c.background_image as string) || brand.coverImageUrl)
          : isPresetPhoto ? presetBg.imageUrl : undefined;
        const isDarkText = presetBg?.textColor === "dark";
        const heroBgStyle: React.CSSProperties = isPresetCss && presetBg.css
          ? presetBg.css
          : { backgroundColor: brand.primaryColor };
        const heroTextColor = isDarkText ? "text-gray-900" : "text-white";

        const heroFontStyle = getHeroFontStyle((c.font_style as string) ?? "clean-sans");
        const heroTextSize = getHeroTextSize((c.text_size as string) ?? "lg");
        const heroAlign = (c.text_align as string) || "left";
        const previewAlignClass = heroAlign === "right" ? "text-right items-end" : heroAlign === "center" ? "text-center items-center" : "text-left items-start";
        const previewAlignJustify = heroAlign === "right" ? "justify-end" : heroAlign === "center" ? "justify-center" : "justify-start";

        const previewHeadlineSizeMap: Record<string, string> = {
          sm: "text-xs",
          md: "text-sm",
          lg: "text-base",
          xl: "text-lg",
        };

        return (
          <div
            className={cn(
              "relative flex min-h-[120px] flex-col overflow-hidden px-4 py-8",
              previewAlignClass,
              heroAlign === "center" ? "justify-center" : "justify-center",
              heroTextColor
            )}
            style={heroBgStyle}
          >
            {showImage && imgSrc && (
              <img
                src={imgSrc}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            )}
            {showImage && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: "black",
                  opacity: (c.overlay_opacity as number) ?? 0.5,
                }}
              />
            )}
            <div className={cn("relative z-10 flex flex-col", previewAlignClass)}>
              <h1
                className={cn(
                  "mb-1 leading-tight",
                  previewHeadlineSizeMap[heroTextSize.id] ?? "text-base",
                  heroFontStyle.fontWeight,
                  heroFontStyle.letterSpacing
                )}
                style={{
                  fontFamily: heroFontStyle.fontFamily,
                  textTransform: heroFontStyle.textTransform,
                }}
              >
                {(c.headline as string) || businessName}
              </h1>
              <p className={cn("mb-2 text-[9px]", isDarkText ? "text-gray-500" : "opacity-80")}>
                {(c.subtitle as string) || t("pub.default_subtitle")}
              </p>
              <div className={cn("flex gap-1.5", previewAlignJustify)}>
                <div
                  className={cn("inline-block px-2 py-0.5 text-[8px] font-semibold text-white", r)}
                  style={
                    theme.preset.buttonStyle === "gradient"
                      ? { background: `linear-gradient(135deg, ${brand.secondaryColor}, ${brand.primaryColor})` }
                      : { backgroundColor: brand.secondaryColor }
                  }
                >
                  {(c.cta_text as string) || t("pub.book_now")}
                </div>
                {(c.cta_secondary_text as string) && (
                  <div
                    className={cn("inline-block border px-2 py-0.5 text-[8px] font-semibold", r, isDarkText ? "border-gray-300 text-gray-700" : "border-white/30 text-white")}
                  >
                    {c.cta_secondary_text as string}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

    case "about":
      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.about_us")}
          </p>
          {typeof c.image === "string" && c.image && (
            <img src={c.image} alt="" className={cn("mb-2 h-16 w-full object-cover", r)} />
          )}
          <p className="text-[9px] leading-relaxed text-gray-600">
            {(c.description as string) || t("pub.description_placeholder")}
          </p>
          {(() => {
            const highlights = [c.highlight_1, c.highlight_2, c.highlight_3]
              .filter((h): h is string => typeof h === "string" && h.length > 0);
            return highlights.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className="rounded-full px-1.5 py-0.5 text-[7px] font-medium text-white"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      );

    case "services":
      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.our_services")}
          </p>
          <div className="space-y-1.5">
            {serviceList.slice(0, 4).map((svc) => (
              <div key={svc.id} className={cn("flex items-center gap-2", cardClass)}>
                {svc.imageUrl && (
                  <img src={svc.imageUrl} alt="" className={cn("size-8 object-cover", r)} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[9px] font-semibold">{svc.title}</p>
                  <p className="text-[7px] text-gray-500">
                    {svc.durationMinutes}min
                    {svc.price && c.show_prices !== false && ` · ${currency}${svc.price}`}
                  </p>
                </div>
              </div>
            ))}
            {serviceList.length > 4 && (
              <p className="text-center text-[7px] text-gray-400">
                {t("pub.n_more", { n: serviceList.length - 4 })}
              </p>
            )}
          </div>
        </div>
      );

    case "team":
      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.meet_team")}
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {staff.slice(0, 4).map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-1">
                <div
                  className="flex size-8 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ backgroundColor: brand.secondaryColor }}
                >
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="" className="size-full rounded-full object-cover" />
                  ) : (
                    member.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <p className="text-[7px] font-medium">{member.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case "gallery": {
      const images = Array.isArray(c.images) ? c.images : [];
      const galleryImages = images
        .map((img: unknown) => {
          const o = img as Record<string, unknown>;
          return { url: String(o?.url ?? ""), caption: String(o?.caption ?? "") };
        })
        .filter((img: { url: string }) => img.url);

      if (galleryImages.length === 0) {
        return (
          <div className={cn("px-3 py-4", sectionBg)}>
            <p className={headingClass} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("pub.our_work")}
            </p>
            <p className="text-[8px] text-gray-400">{t("pub.add_images_hint")}</p>
          </div>
        );
      }

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.our_work")}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {galleryImages.slice(0, 4).map((img: { url: string; caption: string }, i: number) => (
              <img key={i} src={img.url} alt={img.caption} className={cn("h-12 w-full object-cover", r)} />
            ))}
          </div>
          {galleryImages.length > 4 && (
            <p className="mt-1 text-center text-[7px] text-gray-400">
              {t("pub.n_more", { n: galleryImages.length - 4 })}
            </p>
          )}
        </div>
      );
    }

    case "testimonials": {
      const testimonials = Array.isArray(c.testimonials) ? c.testimonials : [];
      const parsed = testimonials
        .map((item: unknown) => {
          const o = item as Record<string, unknown>;
          return {
            name: String(o?.name ?? ""),
            text: String(o?.text ?? ""),
            rating: Number(o?.rating ?? 5),
          };
        })
        .filter((item: { name: string; text: string }) => item.name && item.text);

      if (parsed.length === 0) {
        return (
          <div className={cn("px-3 py-4", sectionBg)}>
            <p className={headingClass} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("pub.what_clients_say")}
            </p>
            <p className="text-[8px] text-gray-400">{t("pub.add_testimonials_hint")}</p>
          </div>
        );
      }

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.what_clients_say")}
          </p>
          <div className="space-y-1.5">
            {parsed.slice(0, 3).map((item: { name: string; text: string; rating: number }, i: number) => (
              <div key={i} className={cardClass}>
                <div className="mb-0.5 flex gap-0.5">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star
                      key={j}
                      className="size-2"
                      fill={j < item.rating ? brand.secondaryColor : "transparent"}
                      stroke={j < item.rating ? brand.secondaryColor : "#D1D5DB"}
                    />
                  ))}
                </div>
                <p className="text-[8px] text-gray-600 italic line-clamp-2">&ldquo;{item.text}&rdquo;</p>
                <p className="mt-0.5 text-[7px] font-semibold">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "cta_banner":
      return (
        <div
          className="px-3 py-5 text-center text-white"
          style={
            (c.bg_style as string) === "solid"
              ? { backgroundColor: brand.primaryColor }
              : { background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor} 100%)` }
          }
        >
          <p className={cn(
            "text-[10px] leading-tight",
            theme.preset.fontStyle === "bold" ? "font-black" : "font-bold"
          )}>
            {(c.headline as string) || t("pub.cta_default")}
          </p>
          {typeof c.subtitle === "string" && c.subtitle && (
            <p className="mt-0.5 text-[8px] text-white/70">{c.subtitle}</p>
          )}
          <div
            className={cn("mt-2 inline-block px-2 py-0.5 text-[8px] font-semibold", r)}
            style={{ backgroundColor: "white", color: brand.primaryColor }}
          >
            {(c.button_text as string) || t("pub.book_now")}
          </div>
        </div>
      );

    case "contact":
      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("section.contact")}
          </p>
          <div className="space-y-0.5">
            {hours
              .filter((h) => h.isOpen)
              .slice(0, 5)
              .map((h) => (
                <div
                  key={h.dayOfWeek}
                  className="flex justify-between text-[7px] text-gray-700"
                >
                  <span>{t(DAYS_SHORT_KEYS[h.dayOfWeek])}</span>
                  <span>
                    {formatTime(h.startTime)} – {formatTime(h.endTime)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
