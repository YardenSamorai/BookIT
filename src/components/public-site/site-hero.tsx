import type { SiteTheme } from "@/lib/themes/presets";
import {
  getHeroBackground,
  getHeroFontStyle,
  getHeroTextSize,
} from "@/lib/themes/hero-backgrounds";
import { t, type Locale } from "@/lib/i18n";

interface SiteHeroProps {
  businessName: string;
  coverImageUrl: string | null;
  content?: Record<string, unknown>;
  theme: SiteTheme;
  locale: Locale;
}

export function SiteHero({
  businessName,
  coverImageUrl,
  content = {},
  theme,
  locale,
}: SiteHeroProps) {
  const headline = (content.headline as string) || businessName;
  const subtitle =
    (content.subtitle as string) ||
    t(locale, "pub.default_subtitle");
  const ctaText = (content.cta_text as string) || t(locale, "pub.book_appointment");
  const ctaSecondary = (content.cta_secondary_text as string) || "";
  const overlayOpacity = (content.overlay_opacity as number) ?? 0.5;
  const layout = (content.layout as string) || "center";
  const showBadge = (content.show_badge as boolean) ?? true;

  const fontStyle = getHeroFontStyle((content.font_style as string) ?? "clean-sans");
  const textSize = getHeroTextSize((content.text_size as string) ?? "lg");
  const textAlign = (content.text_align as string) || "left";

  const bgMode = (content.bg_mode as string) || "upload";
  const bgPresetId = content.bg_preset_id as string | undefined;
  const bgImage = (content.background_image as string) || coverImageUrl;
  const presetBg = bgPresetId ? getHeroBackground(bgPresetId) : undefined;

  const hasUploadedImage = bgMode === "upload" && bgImage;
  const hasPreset = bgMode === "preset" && presetBg;
  const isPresetPhoto = hasPreset && presetBg.type === "image";
  const isPresetCss = hasPreset && presetBg.type === "css";
  const hasImage = hasUploadedImage || isPresetPhoto;
  const imageUrl = hasUploadedImage
    ? bgImage
    : isPresetPhoto
      ? presetBg.imageUrl
      : undefined;
  const usesDarkText = hasPreset && presetBg.textColor === "dark";

  const defaultHeading = usesDarkText ? "#111827" : "#ffffff";
  const defaultBody = usesDarkText ? "#4b5563" : "rgba(255,255,255,0.8)";
  const defaultSubtle = usesDarkText ? "#6b7280" : "rgba(255,255,255,0.7)";

  const headingColorStyle: React.CSSProperties = { color: `var(--section-heading, ${defaultHeading})` };
  const subtitleColorStyle: React.CSSProperties = { color: `var(--section-body, ${defaultSubtle})` };
  const bodyColorStyle: React.CSSProperties = { color: `var(--section-body, ${defaultBody})` };

  const pillBg = usesDarkText
    ? { backgroundColor: `${theme.secondaryColor}15` }
    : { backgroundColor: `${theme.secondaryColor}33` };
  const pillTextStyle: React.CSSProperties = {
    color: `var(--section-body, ${usesDarkText ? "#374151" : "rgba(255,255,255,0.9)"})`,
  };
  const ghostBorder = usesDarkText
    ? "border-gray-300 bg-gray-100 hover:bg-gray-200"
    : "border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10";

  const bgStyle: React.CSSProperties =
    isPresetCss && presetBg.css
      ? presetBg.css
      : { backgroundColor: theme.primaryColor };

  const buttonStyle: React.CSSProperties =
    theme.preset.buttonStyle === "outline"
      ? {
          borderColor: theme.secondaryColor,
          color: usesDarkText ? theme.secondaryColor : "white",
          borderWidth: "2px",
        }
      : theme.preset.buttonStyle === "gradient"
        ? {
            background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
          }
        : { backgroundColor: theme.secondaryColor };

  const alignClass =
    textAlign === "right"
      ? "text-right"
      : textAlign === "center"
        ? "text-center"
        : "text-left";
  const alignJustify =
    textAlign === "right"
      ? "justify-end"
      : textAlign === "center"
        ? "justify-center"
        : "justify-start";
  const subtitleMargin =
    textAlign === "center" ? "mx-auto" : textAlign === "right" ? "ml-auto" : "";

  const headlineInlineStyle: React.CSSProperties = {
    fontFamily: fontStyle.fontFamily,
    textTransform: fontStyle.textTransform,
    ...headingColorStyle,
  };

  if (layout === "split" && (hasImage || hasPreset)) {
    return (
      <section className="relative grid min-h-[60vh] md:min-h-[70vh] md:grid-cols-2">
        <div
          className={`flex flex-col justify-center px-6 py-12 sm:px-8 sm:py-16 md:px-16 ${alignClass}`}
          style={bgStyle}
        >
          <div className="max-w-lg">
            {showBadge && (
              <div
                className={`mb-4 inline-block ${theme.radius.full} px-4 py-1.5 text-xs font-medium tracking-wide uppercase sm:mb-6`}
                style={{ ...pillBg, ...pillTextStyle }}
              >
                {t(locale, "pub.welcome")}
              </div>
            )}
            <h1
              className={`${textSize.classes} ${fontStyle.fontWeight} ${fontStyle.letterSpacing} leading-tight`}
              style={headlineInlineStyle}
            >
              {headline}
            </h1>
            <p
              className="mt-4 text-base sm:mt-6 sm:text-lg"
              style={subtitleColorStyle}
            >
              {subtitle}
            </p>
            <div
              className={`mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4 ${alignJustify}`}
            >
              <a
                href="#services"
                className={`px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base ${theme.buttonClasses}`}
                style={buttonStyle}
              >
                {ctaText}
              </a>
              {ctaSecondary && (
                <a
                  href="#contact"
                  className={`border px-6 py-3 text-sm font-semibold transition-all sm:px-8 sm:py-3.5 sm:text-base ${theme.radius.sm} ${ghostBorder}`}
                  style={bodyColorStyle}
                >
                  {ctaSecondary}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="relative hidden md:block">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          ) : isPresetCss && presetBg.css ? (
            <div className="absolute inset-0" style={presetBg.css} />
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative flex min-h-[60vh] items-center overflow-hidden sm:min-h-[70vh]"
      style={bgStyle}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      )}

      {hasImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "black", opacity: overlayOpacity }}
        />
      )}

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${theme.secondaryColor}15 0%, transparent 70%)`,
        }}
      />

      <div
        className={`relative z-10 mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24 ${alignClass}`}
      >
        {showBadge && (
          <div
            className={`mb-4 inline-block ${theme.radius.full} px-4 py-1.5 text-xs font-medium tracking-wide uppercase sm:mb-6`}
            style={{ ...pillBg, ...pillTextStyle }}
          >
            {t(locale, "pub.welcome")}
          </div>
        )}

        <h1
          className={`${textSize.classes} ${fontStyle.fontWeight} ${fontStyle.letterSpacing} leading-[1.1]`}
          style={headlineInlineStyle}
        >
          {headline}
        </h1>

        <p
          className={`mt-4 max-w-xl text-base sm:mt-6 sm:text-lg md:text-xl ${subtitleMargin}`}
          style={bodyColorStyle}
        >
          {subtitle}
        </p>

        <div
          className={`mt-8 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4 ${alignJustify}`}
        >
          <a
            href="#services"
            className={`px-6 py-3 text-sm font-semibold sm:px-8 sm:py-3.5 sm:text-base ${theme.buttonClasses}`}
            style={buttonStyle}
          >
            {ctaText}
          </a>
          {ctaSecondary && (
            <a
              href="#contact"
              className={`border px-6 py-3 text-sm font-semibold transition-all sm:px-8 sm:py-3.5 sm:text-base ${theme.radius.sm} ${ghostBorder}`}
              style={bodyColorStyle}
            >
              {ctaSecondary}
            </a>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: "linear-gradient(to top, var(--palette-bg, white), transparent)" }}
      />
    </section>
  );
}
