import { Star } from "lucide-react";
import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";

interface Testimonial {
  name: string;
  text: string;
  role: string;
  rating: number;
}

interface SiteTestimonialsProps {
  theme: SiteTheme;
  content?: Record<string, unknown>;
  sectionIndex: number;
  locale: Locale;
}

function parseTestimonials(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return {
      name: String(o?.name ?? ""),
      text: String(o?.text ?? ""),
      role: String(o?.role ?? ""),
      rating: Math.min(5, Math.max(1, Number(o?.rating ?? 5))),
    };
  }).filter((t) => t.name && t.text);
}

export function SiteTestimonials({ theme, content = {}, sectionIndex, locale }: SiteTestimonialsProps) {
  const testimonials = parseTestimonials(content.testimonials);
  if (testimonials.length === 0) return null;

  const title = (content.title as string) || t(locale, "pub.what_clients_say");
  const subtitle = (content.subtitle as string) || "";
  const layout = (content.layout as string) || "cards";

  return (
    <section
      id="testimonials"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className="mx-auto max-w-6xl px-6">
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

        {layout === "minimal" ? (
          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            {testimonials.map((t, i) => (
              <MinimalTestimonial key={i} testimonial={t} theme={theme} />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} testimonial={t} theme={theme} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial: t, theme }: { testimonial: Testimonial; theme: SiteTheme }) {
  return (
    <div className={`flex flex-col p-6 ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}>
      <StarRating rating={t.rating} color={theme.secondaryColor} />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed" style={{ color: "var(--section-body, #4b5563)" }}>
        &ldquo;{t.text}&rdquo;
      </blockquote>
      <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
        <div
          className="flex size-10 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {t.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--section-heading, #111827)" }}>{t.name}</p>
          {t.role && (
            <p className="text-xs" style={{ color: "var(--section-body, #6b7280)" }}>{t.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MinimalTestimonial({ testimonial: t, theme }: { testimonial: Testimonial; theme: SiteTheme }) {
  return (
    <div className="border-l-4 pl-6" style={{ borderColor: theme.secondaryColor }}>
      <StarRating rating={t.rating} color={theme.secondaryColor} />
      <blockquote className="mt-3 text-lg leading-relaxed italic" style={{ color: "var(--section-body, #374151)" }}>
        &ldquo;{t.text}&rdquo;
      </blockquote>
      <div className="mt-3">
        <span className="font-semibold" style={{ color: "var(--section-heading, #111827)" }}>{t.name}</span>
        {t.role && <span style={{ color: "var(--section-body, #6b7280)" }}> &mdash; {t.role}</span>}
      </div>
    </div>
  );
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="size-4"
          fill={i < rating ? color : "transparent"}
          stroke={i < rating ? color : "#D1D5DB"}
        />
      ))}
    </div>
  );
}
