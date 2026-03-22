import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

interface GalleryImage {
  url: string;
  caption: string;
}

interface SiteGalleryProps {
  theme: SiteTheme;
  content?: Record<string, unknown>;
  sectionIndex: number;
  locale: Locale;
}

function parseImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown) => {
      const o = item as Record<string, unknown>;
      return {
        url: String(o?.url ?? ""),
        caption: String(o?.caption ?? ""),
      };
    })
    .filter((img) => img.url);
}

export function SiteGallery({ theme, content = {}, sectionIndex, locale }: SiteGalleryProps) {
  const images = parseImages(content.images);
  if (images.length === 0) return null;

  const title = (content.title as string) || t(locale, "pub.our_work");
  const subtitle = (content.subtitle as string) || "";
  const columns = Number(content.columns ?? 3);
  const layout = (content.layout as string) || "grid";

  const colClass =
    columns === 2
      ? "grid-cols-2 sm:grid-cols-2"
      : columns === 4
        ? "grid-cols-3 sm:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      id="gallery"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: "var(--section-heading, #111827)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-md" style={{ color: "var(--section-body, #6b7280)" }}>{subtitle}</p>
          )}
        </div>

        {layout === "masonry" ? (
          <div className={`mt-8 columns-3 gap-2 space-y-2 sm:mt-12 sm:columns-2 sm:gap-4 sm:space-y-4 ${columns >= 3 ? "lg:columns-3" : ""}`}>
            {images.map((img, i) => (
              <GalleryItem key={i} image={img} theme={theme} />
            ))}
          </div>
        ) : (
          <div className={`mt-8 grid gap-2 sm:mt-12 sm:gap-4 ${colClass}`}>
            {images.map((img, i) => (
              <GalleryItem key={i} image={img} theme={theme} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GalleryItem({ image, theme }: { image: GalleryImage; theme: SiteTheme }) {
  return (
    <div className={`group relative overflow-hidden ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}>
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image.url}
          alt={image.caption}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {image.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-4 sm:pt-8">
            <p className="text-xs font-medium text-white sm:text-sm">{image.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}
