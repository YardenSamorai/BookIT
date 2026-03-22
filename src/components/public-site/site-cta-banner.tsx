import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

interface SiteCtaBannerProps {
  theme: SiteTheme;
  content?: Record<string, unknown>;
  bookingUrl: string;
  locale: Locale;
}

export function SiteCtaBanner({ theme, content = {}, bookingUrl, locale }: SiteCtaBannerProps) {
  const headline = (content.headline as string) || t(locale, "pub.cta_default");
  const subtitle = (content.subtitle as string) || "";
  const buttonText = (content.button_text as string) || t(locale, "pub.book_now");
  const buttonLink = (content.button_link as string) || bookingUrl;
  const bgStyle = (content.bg_style as string) || "gradient";
  const bgImage = content.bg_image as string | undefined;
  const layout = (content.layout as string) || "centered";

  const alignClass =
    layout === "left" ? "text-left" : layout === "right" ? "text-right" : "text-center";
  const isCentered = layout === "centered";

  function getBackground(): React.CSSProperties {
    if (bgStyle === "image" && bgImage) {
      return {};
    }
    if (bgStyle === "solid") {
      return { backgroundColor: theme.primaryColor };
    }
    return {
      background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
    };
  }

  return (
    <section className="relative overflow-hidden">
      <div
        className="relative px-6 py-16 sm:py-24"
        style={getBackground()}
      >
        {bgStyle === "image" && bgImage && (
          <>
            <img
              src={bgImage}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </>
        )}

        <div
          className={`relative z-10 mx-auto max-w-4xl ${alignClass}`}
        >
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} leading-tight`}
            style={{ color: "var(--section-heading, #ffffff)" }}
          >
            {headline}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg" style={{ color: "var(--section-body, rgba(255,255,255,0.7))" }}>{subtitle}</p>
          )}
          <div className={`mt-8 ${isCentered ? "flex justify-center" : ""}`}>
            <a
              href={buttonLink}
              className={`inline-block px-8 py-3.5 text-base ${theme.buttonClasses}`}
              style={
                theme.preset.buttonStyle === "outline"
                  ? { borderColor: "white", color: "white" }
                  : theme.preset.buttonStyle === "gradient"
                    ? { background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})` }
                    : { backgroundColor: theme.secondaryColor }
              }
            >
              {buttonText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
