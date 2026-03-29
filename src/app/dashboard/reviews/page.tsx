import { redirect } from "next/navigation";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessReviews, getBusinessRatingStats, getRatingDistribution } from "@/lib/db/queries/reviews";
import { getBusinessLocale, isModuleEnabled } from "@/lib/db/queries/business";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewStats } from "@/components/reviews/review-stats";

export default async function ReviewsPage() {
  const { businessId } = await requireBusinessOwner();
  if (!(await isModuleEnabled(businessId, "reviews"))) redirect("/dashboard");

  const [reviewsList, stats, distribution, locale] = await Promise.all([
    getBusinessReviews(businessId),
    getBusinessRatingStats(businessId),
    getRatingDistribution(businessId),
    getBusinessLocale(businessId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "rev.title")}
        description={t(locale, "rev.subtitle")}
      />
      <ReviewStats
        avgRating={stats.avgRating}
        totalReviews={stats.totalReviews}
        distribution={distribution}
      />
      <ReviewList reviews={reviewsList} />
    </div>
  );
}
