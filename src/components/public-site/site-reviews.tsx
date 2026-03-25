import type { SiteTheme } from "@/lib/themes/presets";
import { Star } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { AnimatedStagger } from "./animated-section";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  userName: string | null;
  serviceName: string | null;
}

interface SiteReviewsProps {
  reviews: Review[];
  avgRating: number;
  totalReviews: number;
  theme: SiteTheme;
  sectionIndex: number;
  locale: Locale;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}

export function SiteReviews({
  reviews: items,
  avgRating,
  totalReviews,
  theme,
  sectionIndex,
  locale,
}: SiteReviewsProps) {
  if (totalReviews === 0) return null;

  const bg = sectionIndex % 2 === 0 ? "bg-white" : "bg-gray-50";

  return (
    <section id="reviews" className={`py-16 ${bg}`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight text-gray-900`}
          >
            {t(locale, "rev.section_title")}
          </h2>

          <div className="mt-4 flex items-center justify-center gap-3">
            <Stars rating={Math.round(avgRating)} size={22} />
            <span className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
              {avgRating.toFixed(1)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {t(locale, "rev.based_on", { n: String(totalReviews) })}
          </p>
        </div>

        <AnimatedStagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Stars rating={review.rating} size={14} />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString(
                    locale === "he" ? "he-IL" : "en-US",
                    { day: "numeric", month: "short", year: "numeric" }
                  )}
                </span>
              </div>

              {review.comment && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {review.comment}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="text-xs font-medium text-gray-700">
                  {review.userName || t(locale, "rev.anonymous")}
                </span>
                {review.serviceName && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                    {review.serviceName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </AnimatedStagger>
      </div>
    </section>
  );
}
