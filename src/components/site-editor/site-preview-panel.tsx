"use client";

import { useState, useRef, useEffect } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { DAYS_SHORT_KEYS } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildSiteTheme } from "@/lib/themes/presets";
import { getHeroBackground, getHeroFontStyle, getHeroTextSize } from "@/lib/themes/hero-backgrounds";
import { Monitor, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SiteSection } from "@/lib/db/schema/site-config";
import type { InferSelectModel } from "drizzle-orm";
import type { services, staffMembers, businessHours, products } from "@/lib/db/schema";

type Service = InferSelectModel<typeof services>;
type StaffMember = InferSelectModel<typeof staffMembers>;
type HoursRow = InferSelectModel<typeof businessHours>;
type Product = InferSelectModel<typeof products>;

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
  products: Product[];
  currency: string;
  themePresetId?: string;
  activeSectionType?: string | null;
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
  products: productList,
  currency,
  themePresetId = "modern",
  activeSectionType = null,
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
              "text-[10px] leading-relaxed [&_*]:transition-[background-color,color,border-color] [&_*]:duration-300",
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
                products={productList}
                currency={currency}
                theme={theme}
                r={r}
                t={t}
                isActive={activeSectionType === section.type}
                isMobile={isMobile}
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
  products: productItems,
  currency,
  theme,
  r,
  t,
  isActive = false,
  isMobile = false,
}: {
  section: SiteSection;
  sectionIndex: number;
  brand: SitePreviewPanelProps["brand"];
  businessName: string;
  services: Service[];
  staff: StaffMember[];
  hours: HoursRow[];
  products: Product[];
  currency: string;
  theme: ReturnType<typeof buildSiteTheme>;
  r: string;
  t: (key: import("@/lib/i18n").TranslationKey, vars?: Record<string, string | number>) => string;
  isActive?: boolean;
  isMobile?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

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

  const activeRing = isActive
    ? "ring-2 ring-primary/40 ring-offset-1 transition-shadow duration-300"
    : "transition-shadow duration-300";

  const renderSection = () => { switch (section.type) {
    case "hero":
      {
        const bgMode = (c.bg_mode as string) || "upload";
        const heroLayout = (c.layout as string) || "center";
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

        const customTitleColor = c.title_color as string | undefined;
        const customSubtitleColor = c.subtitle_color as string | undefined;
        const customCtaBg = c.cta_bg_color as string | undefined;
        const customCtaText = c.cta_text_color as string | undefined;
        const customCta2Bg = c.cta2_bg_color as string | undefined;
        const customCta2Text = c.cta2_text_color as string | undefined;

        const previewCtaStyle: React.CSSProperties = customCtaBg
          ? { backgroundColor: customCtaBg, ...(customCtaText ? { color: customCtaText } : {}) }
          : theme.preset.buttonStyle === "gradient"
            ? { background: `linear-gradient(135deg, ${brand.secondaryColor}, ${brand.primaryColor})` }
            : { backgroundColor: brand.secondaryColor };
        if (!customCtaBg && customCtaText) previewCtaStyle.color = customCtaText;

        const textBlock = (
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
                ...(customTitleColor ? { color: customTitleColor } : {}),
              }}
            >
              {(c.headline as string) || businessName}
            </h1>
            <p
              className={cn("mb-2 text-[9px]", !customSubtitleColor && (isDarkText ? "text-gray-500" : "opacity-80"))}
              style={customSubtitleColor ? { color: customSubtitleColor } : undefined}
            >
              {(c.subtitle as string) || t("pub.default_subtitle")}
            </p>
            <div className={cn("flex gap-1.5", previewAlignJustify)}>
              <div
                className={cn("inline-block px-2 py-0.5 text-[8px] font-semibold", r, !customCtaText && "text-white")}
                style={previewCtaStyle}
              >
                {(c.cta_text as string) || t("pub.book_now")}
              </div>
              {(c.cta_secondary_text as string) && (
                <div
                  className={cn(
                    "inline-block border px-2 py-0.5 text-[8px] font-semibold",
                    r,
                    !customCta2Bg && !customCta2Text && (isDarkText ? "border-gray-300 text-gray-700" : "border-white/30 text-white")
                  )}
                  style={{
                    ...(customCta2Bg ? { backgroundColor: customCta2Bg, borderColor: customCta2Bg } : {}),
                    ...(customCta2Text ? { color: customCta2Text } : {}),
                  }}
                >
                  {c.cta_secondary_text as string}
                </div>
              )}
            </div>
          </div>
        );

        if (heroLayout === "split" && showImage && imgSrc) {
          return (
            <div
              className={cn("relative flex min-h-[120px] overflow-hidden", heroTextColor)}
              style={heroBgStyle}
            >
              <div className="flex w-1/2 flex-col justify-center px-3 py-6">
                {textBlock}
              </div>
              <div className="relative w-1/2">
                <img src={imgSrc} alt="" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0" style={{ backgroundColor: "black", opacity: ((c.overlay_opacity as number) ?? 0.5) * 0.3 }} />
              </div>
            </div>
          );
        }

        return (
          <div
            className={cn(
              "relative flex min-h-[120px] flex-col overflow-hidden px-4 py-8",
              previewAlignClass,
              "justify-center",
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
            {textBlock}
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

    case "services": {
      const svcLayout = (c.card_layout as string) || "grid";
      const showPrices = c.show_prices !== false;
      const showDuration = c.show_duration !== false;
      const isGrid = svcLayout === "grid";
      const isCompact = svcLayout === "compact";

      const svcTitleColor = (c.title_color as string) || brand.primaryColor;
      const svcSubtitleColor = (c.subtitle_color as string) || undefined;
      const svcBtnBg = (c.btn_bg_color as string) || brand.secondaryColor;
      const svcBtnText = (c.btn_text_color as string) || undefined;

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: svcTitleColor }}>
            {(c.title as string) || t("pub.our_services")}
          </p>
          {typeof c.subtitle === "string" && c.subtitle && (
            <p className="mb-1.5 text-[7px]" style={{ color: svcSubtitleColor ?? "#6b7280" }}>{c.subtitle}</p>
          )}
          <div className={cn(
            isGrid ? "grid grid-cols-2 gap-1.5" : "space-y-1.5"
          )}>
            {serviceList.slice(0, isCompact ? 6 : 4).map((svc) => (
              <div key={svc.id} className={cn(
                isCompact
                  ? "flex items-center justify-between gap-1 py-0.5 border-b border-gray-100 last:border-0"
                  : cn("flex items-center gap-2", cardClass)
              )}>
                {!isCompact && svc.imageUrl && (
                  <img src={svc.imageUrl} alt="" className={cn("size-8 object-cover", r)} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[9px] font-semibold" style={svcSubtitleColor ? { color: svcTitleColor } : undefined}>{svc.title}</p>
                  {!isCompact && (
                    <p className="text-[7px]" style={{ color: svcSubtitleColor ?? "#6b7280" }}>
                      {showDuration && `${svc.durationMinutes}min`}
                      {showDuration && showPrices && svc.price && " · "}
                      {showPrices && svc.price && `${currency}${svc.price}`}
                    </p>
                  )}
                </div>
                {isCompact && showPrices && svc.price && (
                  <span className="text-[7px] font-medium" style={{ color: svcTitleColor }}>
                    {currency}{svc.price}
                  </span>
                )}
                {isCompact && (
                  <div
                    className={cn("shrink-0 px-1.5 py-0.5 text-[6px] font-semibold", r)}
                    style={{ backgroundColor: svcBtnBg, ...(svcBtnText ? { color: svcBtnText } : { color: "white" }) }}
                  >
                    {t("pub.book")}
                  </div>
                )}
              </div>
            ))}
            {serviceList.length > (isCompact ? 6 : 4) && (
              <p className="text-center text-[7px] text-gray-400">
                {t("pub.n_more", { n: serviceList.length - (isCompact ? 6 : 4) })}
              </p>
            )}
          </div>
        </div>
      );
    }

    case "team": {
      const teamStyle = (c.card_style as string) || "photo";

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.meet_team")}
          </p>
          {typeof c.subtitle === "string" && c.subtitle && (
            <p className="mb-1.5 text-[7px] text-gray-500">{c.subtitle}</p>
          )}
          {teamStyle === "minimal" ? (
            <div className="space-y-1">
              {staff.slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center gap-2 py-0.5">
                  <div
                    className="flex size-5 items-center justify-center rounded-full text-[6px] font-bold text-white"
                    style={{ backgroundColor: brand.secondaryColor }}
                  >
                    {member.name.slice(0, 1).toUpperCase()}
                  </div>
                  <p className="text-[8px] font-medium">{member.name}</p>
                </div>
              ))}
            </div>
          ) : teamStyle === "avatar" ? (
            <div className="space-y-1.5">
              {staff.slice(0, 3).map((member) => (
                <div key={member.id} className={cn("flex items-center gap-2", cardClass)}>
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white"
                    style={{ backgroundColor: brand.secondaryColor }}
                  >
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt="" className="size-full rounded-full object-cover" />
                    ) : (
                      member.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-[8px] font-semibold">{member.name}</p>
                    {member.roleTitle && <p className="text-[6px] text-gray-500">{member.roleTitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      );
    }

    case "gallery": {
      const images = Array.isArray(c.images) ? c.images : [];
      const galleryImages = images
        .map((img: unknown) => {
          const o = img as Record<string, unknown>;
          return { url: String(o?.url ?? ""), caption: String(o?.caption ?? "") };
        })
        .filter((img: { url: string }) => img.url);

      const galCols = Math.min(4, Math.max(2, Number(c.columns ?? 2)));
      const galLayout = (c.layout as string) || "grid";
      const isCarousel = galLayout === "carousel";
      const maxShow = galCols * 2;

      if (galleryImages.length === 0) {
        return (
          <div className={cn("px-3 py-4", sectionBg)}>
            <p className={headingClass} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("pub.our_work")}
            </p>
            {typeof c.subtitle === "string" && c.subtitle && (
              <p className="mb-1.5 text-[7px] text-gray-500">{c.subtitle}</p>
            )}
            <p className="text-[8px] text-gray-400">{t("pub.add_images_hint")}</p>
          </div>
        );
      }

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.our_work")}
          </p>
          {typeof c.subtitle === "string" && c.subtitle && (
            <p className="mb-1.5 text-[7px] text-gray-500">{c.subtitle}</p>
          )}
          {isCarousel ? (
            <div className="flex gap-1 overflow-hidden">
              {galleryImages.slice(0, 4).map((img: { url: string; caption: string }, i: number) => (
                <img key={i} src={img.url} alt={img.caption} className={cn("h-14 w-20 shrink-0 object-cover", r)} />
              ))}
            </div>
          ) : (
            <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${galCols}, 1fr)` }}>
              {galleryImages.slice(0, maxShow).map((img: { url: string; caption: string }, i: number) => (
                <img
                  key={i}
                  src={img.url}
                  alt={img.caption}
                  className={cn(
                    "w-full object-cover",
                    r,
                    galLayout === "masonry" && i % 3 === 0 ? "h-16" : "h-12"
                  )}
                />
              ))}
            </div>
          )}
          {galleryImages.length > maxShow && (
            <p className="mt-1 text-center text-[7px] text-gray-400">
              {t("pub.n_more", { n: galleryImages.length - maxShow })}
            </p>
          )}
        </div>
      );
    }

    case "testimonials": {
      const testimonials = Array.isArray(c.testimonials) ? c.testimonials : [];
      const testLayout = (c.layout as string) || "cards";
      const parsed = testimonials
        .map((item: unknown) => {
          const o = item as Record<string, unknown>;
          return {
            name: String(o?.name ?? ""),
            text: String(o?.text ?? ""),
            role: String(o?.role ?? ""),
            rating: Number(o?.rating ?? 5),
          };
        })
        .filter((item) => item.name && item.text);

      if (parsed.length === 0) {
        return (
          <div className={cn("px-3 py-4", sectionBg)}>
            <p className={headingClass} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("pub.what_clients_say")}
            </p>
            {typeof c.subtitle === "string" && c.subtitle && (
              <p className="mb-1.5 text-[7px] text-gray-500">{c.subtitle}</p>
            )}
            <p className="text-[8px] text-gray-400">{t("pub.add_testimonials_hint")}</p>
          </div>
        );
      }

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={headingClass} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("pub.what_clients_say")}
          </p>
          {typeof c.subtitle === "string" && c.subtitle && (
            <p className="mb-1.5 text-[7px] text-gray-500">{c.subtitle}</p>
          )}
          {testLayout === "minimal" ? (
            <div className="space-y-2 border-s-2 ps-2" style={{ borderColor: brand.secondaryColor }}>
              {parsed.slice(0, 3).map((item, i) => (
                <div key={i}>
                  <p className="text-[8px] text-gray-600 italic line-clamp-2">&ldquo;{item.text}&rdquo;</p>
                  <p className="mt-0.5 text-[7px] font-semibold">{item.name}</p>
                </div>
              ))}
            </div>
          ) : testLayout === "slider" ? (
            <div className="flex gap-1.5 overflow-hidden">
              {parsed.slice(0, 3).map((item, i) => (
                <div key={i} className={cn("shrink-0 w-[70%]", cardClass)}>
                  <div className="mb-0.5 flex gap-0.5">
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star key={j} className="size-2" fill={j < item.rating ? brand.secondaryColor : "transparent"} stroke={j < item.rating ? brand.secondaryColor : "#D1D5DB"} />
                    ))}
                  </div>
                  <p className="text-[8px] text-gray-600 italic line-clamp-2">&ldquo;{item.text}&rdquo;</p>
                  <p className="mt-0.5 text-[7px] font-semibold">{item.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {parsed.slice(0, 3).map((item, i) => (
                <div key={i} className={cardClass}>
                  <div className="mb-0.5 flex gap-0.5">
                    {Array.from({ length: 5 }, (_, j) => (
                      <Star key={j} className="size-2" fill={j < item.rating ? brand.secondaryColor : "transparent"} stroke={j < item.rating ? brand.secondaryColor : "#D1D5DB"} />
                    ))}
                  </div>
                  <p className="text-[8px] text-gray-600 italic line-clamp-2">&ldquo;{item.text}&rdquo;</p>
                  <p className="mt-0.5 text-[7px] font-semibold">
                    {item.name}
                    {item.role && <span className="font-normal text-gray-400"> · {item.role}</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "cta_banner": {
      const ctaBgStyle = (c.bg_style as string) || "gradient";
      const ctaLayout = (c.layout as string) || "centered";
      const isLeft = ctaLayout === "left";
      const ctaBgCss: React.CSSProperties =
        ctaBgStyle === "image" && (c.bg_image as string)
          ? { backgroundImage: `url(${c.bg_image})`, backgroundSize: "cover", backgroundPosition: "center" }
          : ctaBgStyle === "solid"
            ? { backgroundColor: brand.primaryColor }
            : { background: `linear-gradient(135deg, ${brand.primaryColor} 0%, ${brand.secondaryColor} 100%)` };

      return (
        <div
          className={cn("relative px-3 py-5 text-white", isLeft ? "text-start" : "text-center")}
          style={ctaBgCss}
        >
          {ctaBgStyle === "image" && (
            <div className="absolute inset-0 bg-black/50" />
          )}
          <div className="relative z-10">
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
        </div>
      );
    }

    case "products": {
      const prodLayout = (c.layout as string) || "cards";
      const showImg = prodLayout !== "minimal" && c.show_images !== false;
      const showPrice = c.show_prices !== false;
      const showDesc = c.show_descriptions !== false;
      const prodCols = typeof c.columns === "number" ? c.columns : 3;

      const orderedProducts = (() => {
        const order = Array.isArray(c.product_order) ? c.product_order as string[] : null;
        if (!order || order.length === 0) return productItems;
        const byId = new Map(productItems.map((p) => [p.id, p]));
        const result: Product[] = [];
        for (const id of order) { const p = byId.get(id); if (p) { result.push(p); byId.delete(id); } }
        for (const p of byId.values()) result.push(p);
        return result;
      })();

      const visibleProducts = orderedProducts.slice(0, isMobile ? 2 : Math.max(prodCols, 3));
      const placeholders = visibleProducts.length > 0
        ? visibleProducts.map((p) => ({ name: p.title, price: p.price ?? "0", img: p.images?.[0] }))
        : [1, 2, 3].map((i) => ({ name: `Product ${i}`, price: "49.00", img: undefined as string | undefined }));

      const previewColClass = prodCols <= 2 ? "grid-cols-2" : "grid-cols-3";
      const renderCards = () => (
        <div className={cn("mt-2", isMobile ? "space-y-1.5" : cn("grid gap-1.5", previewColClass))}>
          {placeholders.map((p, i) => (
            <div key={i} className={cn("p-2", r, theme.card)}>
              {showImg && (
                p.img
                  ? <img src={p.img} alt="" className="mb-1 h-6 w-full rounded object-cover" />
                  : <div className="mb-1 h-6 rounded bg-gray-100" />
              )}
              <p className="text-[7px] font-bold text-gray-700 truncate">{p.name}</p>
              {showDesc && <p className="text-[5px] text-gray-400 truncate">Description text</p>}
              {showPrice && <p className="mt-0.5 text-[6px] font-semibold" style={{ color: brand.secondaryColor }}>₪{p.price}</p>}
            </div>
          ))}
        </div>
      );

      const renderList = () => (
        <div className="mt-2 space-y-1">
          {placeholders.map((p, i) => (
            <div key={i} className={cn("flex items-center gap-1.5 p-1.5", r, theme.card)}>
              {showImg && (
                p.img
                  ? <img src={p.img} alt="" className="size-5 shrink-0 rounded object-cover" />
                  : <div className="size-5 shrink-0 rounded bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[7px] font-bold text-gray-700 truncate">{p.name}</p>
                {showDesc && <p className="text-[5px] text-gray-400 truncate">Short description</p>}
              </div>
              {showPrice && <p className="shrink-0 text-[6px] font-semibold" style={{ color: brand.secondaryColor }}>₪{p.price}</p>}
            </div>
          ))}
        </div>
      );

      const renderMinimal = () => (
        <div className="mt-2 divide-y divide-gray-100">
          {placeholders.map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-1">
              <div className="min-w-0 flex-1">
                <p className="text-[7px] font-bold text-gray-700 truncate">{p.name}</p>
                {showDesc && <p className="text-[5px] text-gray-400 truncate">Description</p>}
              </div>
              {showPrice && <p className="shrink-0 text-[6px] font-semibold" style={{ color: brand.secondaryColor }}>₪{p.price}</p>}
            </div>
          ))}
        </div>
      );

      const renderCarousel = () => {
        const speedMap: Record<string, number> = { slow: 20, medium: 12, fast: 6 };
        const dur = speedMap[(c.carousel_speed as string) ?? "medium"] ?? 12;
        return (
          <div className="relative mt-2 overflow-hidden">
            <div className="flex gap-1.5" style={{ animation: `marquee-preview ${dur}s linear infinite` }}>
              {[...placeholders, ...placeholders].map((p, i) => (
                <div key={i} className={cn("w-16 shrink-0 p-1.5", r, theme.card)}>
                  {showImg && (
                    p.img
                      ? <img src={p.img} alt="" className="mb-0.5 h-4 w-full rounded object-cover" />
                      : <div className="mb-0.5 h-4 rounded bg-gray-100" />
                  )}
                  <p className="text-[6px] font-bold text-gray-700 truncate">{p.name}</p>
                  {showPrice && <p className="text-[5px] font-semibold" style={{ color: brand.secondaryColor }}>₪{p.price}</p>}
                </div>
              ))}
            </div>
            <style>{`@keyframes marquee-preview { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </div>
        );
      };

      const renderContent = () => {
        switch (prodLayout) {
          case "list": return renderList();
          case "minimal": return renderMinimal();
          case "carousel": return renderCarousel();
          default: return renderCards();
        }
      };

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={cn(headingClass, "text-center")} style={{ color: brand.primaryColor }}>
            {(c.heading as string) || t("pub.our_products")}
          </p>
          {typeof c.subtitle === "string" && c.subtitle && (
            <p className="mt-0.5 text-center text-[7px] text-gray-500">{c.subtitle}</p>
          )}
          {renderContent()}
        </div>
      );
    }

    case "booking":
      return (
        <div className={cn("px-3 py-5 text-center", sectionBg)}>
          <div
            className={cn("mx-auto px-4 py-5", r, theme.card)}
          >
            <p className={cn("text-[10px] font-bold", theme.preset.fontStyle === "bold" ? "font-black" : "font-bold")} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("pub.booking_section_title")}
            </p>
            {typeof c.subtitle === "string" && c.subtitle && (
              <p className="mt-0.5 text-[7px] text-gray-500">{c.subtitle}</p>
            )}
            <div
              className={cn("mt-2 inline-block px-2 py-0.5 text-[7px] font-semibold text-white", r)}
              style={{ backgroundColor: brand.secondaryColor }}
            >
              {(c.button_text as string) || t("pub.book_now")}
            </div>
          </div>
        </div>
      );

    case "contact": {
      const contactLayout = (c.layout as string) || "split";
      const hoursRows = hours.filter((h) => h.isOpen).slice(0, 5);

      const miniHours = (
        <div className="space-y-0.5">
          {hoursRows.map((h) => (
            <div key={h.dayOfWeek} className="flex justify-between text-[7px] text-gray-700">
              <span>{t(DAYS_SHORT_KEYS[h.dayOfWeek])}</span>
              <span>{formatTime(h.startTime)} – {formatTime(h.endTime)}</span>
            </div>
          ))}
        </div>
      );

      const miniContact = (
        <div className="space-y-0.5 text-[7px] text-gray-600">
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: brand.secondaryColor }} />
            <span>{t("pub.phone")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-1.5 rounded-full" style={{ backgroundColor: brand.secondaryColor }} />
            <span>{t("pub.email")}</span>
          </div>
        </div>
      );

      const miniMap = (c.map_embed_url as string) ? (
        <div className="rounded bg-gray-200 flex items-center justify-center" style={{ height: isMobile ? 30 : 40 }}>
          <span className="text-[6px] text-gray-400">Map</span>
        </div>
      ) : null;

      if (contactLayout === "stacked") {
        return (
          <div className={cn("px-3 py-4 space-y-2", sectionBg)}>
            <p className={cn(headingClass, "text-center")} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("section.contact")}
            </p>
            {miniContact}
            {miniHours}
            {miniMap}
          </div>
        );
      }

      if (contactLayout === "with_map") {
        return (
          <div className={cn("px-3 py-4", sectionBg)}>
            <p className={cn(headingClass, "text-center")} style={{ color: brand.primaryColor }}>
              {(c.title as string) || t("section.contact")}
            </p>
            <div className={cn("mt-1", isMobile ? "space-y-2" : "grid grid-cols-2 gap-2")}>
              <div className="space-y-2">
                {miniContact}
                {miniHours}
              </div>
              {miniMap || (
                <div className="rounded bg-gray-100 flex items-center justify-center" style={{ height: 40 }}>
                  <span className="text-[6px] text-gray-300">Map</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className={cn("px-3 py-4", sectionBg)}>
          <p className={cn(headingClass, "text-center")} style={{ color: brand.primaryColor }}>
            {(c.title as string) || t("section.contact")}
          </p>
          <div className={cn("mt-1", isMobile ? "space-y-2" : "grid grid-cols-2 gap-2")}>
            {miniContact}
            {miniHours}
          </div>
          {miniMap && <div className="mt-2">{miniMap}</div>}
        </div>
      );
    }

    default:
      return null;
  }};

  return (
    <div ref={sectionRef} className={activeRing}>
      {renderSection()}
    </div>
  );
}
