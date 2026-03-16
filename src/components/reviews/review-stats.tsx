"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface ReviewStatsProps {
  avgRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export function ReviewStats({ avgRating, totalReviews, distribution }: ReviewStatsProps) {
  const t = useT();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`size-6 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
              />
            ))}
          </div>
          <p className="mt-2 text-3xl font-bold">{avgRating.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">{t("rev.avg_rating")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <p className="text-3xl font-bold">{totalReviews}</p>
          <p className="text-sm text-muted-foreground">{t("rev.total_reviews")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <p className="mb-3 text-sm font-medium">{t("rev.rating_dist")}</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = distribution[rating] ?? 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-end font-medium">{rating}</span>
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-end text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
