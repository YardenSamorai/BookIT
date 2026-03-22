import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

interface SiteAboutProps {
  content?: Record<string, unknown>;
  theme: SiteTheme;
  sectionIndex: number;
  locale: Locale;
}

const ALIGN_CLASS: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function SiteAbout({ content = {}, theme, sectionIndex, locale }: SiteAboutProps) {
  const title = (content.title as string) || t(locale, "pub.about_us");
  const description = (content.description as string) || "";
  const image = content.image as string | undefined;
  const textAlign = (content.text_align as string) || "center";
  const highlights = [
    content.highlight_1 as string,
    content.highlight_2 as string,
    content.highlight_3 as string,
  ].filter(Boolean);

  if (!description && !image) return null;

  return (
    <section
      id="about"
      className={`scroll-mt-16 sm:scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          className={`${ALIGN_CLASS[textAlign] ?? "text-center"} ${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
          style={{ color: "var(--section-heading, #111827)" }}
        >
          {title}
        </h2>

        <div
          className={`mt-8 sm:mt-12 ${image ? "grid items-center gap-8 sm:gap-12 md:grid-cols-2" : ""}`}
        >
          {image && (
            <div className={`overflow-hidden shadow-lg ${theme.imageRadius}`}>
              <img
                src={image}
                alt={title}
                className="size-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {description && (
              <p
                className={`text-base leading-relaxed whitespace-pre-line sm:text-lg ${ALIGN_CLASS[textAlign] ?? ""}`}
                style={{ color: "var(--section-body, #4b5563)" }}
              >
                {description}
              </p>
            )}

            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {highlights.map((h, i) => (
                  <span
                    key={i}
                    className={`${theme.radius.full} px-3 py-1.5 text-xs font-medium text-white sm:px-4 sm:py-2 sm:text-sm`}
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
