"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toggleReviewPublished, deleteReview } from "@/actions/reviews";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { Star, Eye, EyeOff, Trash2, Loader2, MessageSquare } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  createdAt: Date;
  userName: string | null;
  userPhone: string | null;
  serviceName: string | null;
};

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews: items }: ReviewListProps) {
  const t = useT();

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <MessageSquare className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("rev.no_reviews")}</p>
            <p className="text-sm text-muted-foreground">{t("rev.no_reviews_desc")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle() {
    setToggling(true);
    await toggleReviewPublished(review.id, !review.isPublished);
    setToggling(false);
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteReview(review.id);
    setDeleteOpen(false);
    setDeleting(false);
    router.refresh();
  }

  const dateStr = new Date(review.createdAt).toLocaleDateString(
    locale === "he" ? "he-IL" : "en-US",
    { day: "numeric", month: "short", year: "numeric" }
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
                  />
                ))}
              </div>
              <Badge variant={review.isPublished ? "default" : "secondary"} className="text-xs">
                {review.isPublished ? t("rev.published") : t("rev.hidden")}
              </Badge>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
            </div>

            {review.comment && (
              <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {review.userName || review.userPhone || t("rev.anonymous")}
              </span>
              {review.serviceName && (
                <>
                  <span>·</span>
                  <span>{review.serviceName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleToggle}
              disabled={toggling}
              title={review.isPublished ? t("rev.hide") : t("rev.show")}
            >
              {toggling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : review.isPublished ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rev.delete_title")}</DialogTitle>
            <DialogDescription>{t("rev.delete_confirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
