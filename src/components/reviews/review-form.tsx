"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/i18n/locale-context";
import { Star, Loader2, Check } from "lucide-react";

interface ReviewFormProps {
  businessId: string;
  appointmentId?: string;
  serviceId?: string;
}

export function ReviewForm({ businessId, appointmentId, serviceId }: ReviewFormProps) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (rating === 0) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          appointmentId,
          serviceId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError(t("rev.already_reviewed"));
        } else {
          setError(data.error || "Error");
        }
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <Check className="size-8 text-emerald-600" />
        <p className="font-medium text-emerald-800">{t("rev.submitted")}</p>
      </div>
    );
  }

  const displayRating = hoveredRating || rating;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold">{t("rev.leave_review")}</h3>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t("rev.your_rating")}</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const val = i + 1;
            return (
              <button
                key={val}
                type="button"
                onClick={() => setRating(val)}
                onMouseEnter={() => setHoveredRating(val)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
                disabled={loading}
              >
                <Star
                  className={`size-7 ${
                    val <= displayRating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t("rev.your_comment")}</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("rev.comment_ph")}
          rows={3}
          maxLength={1000}
          disabled={loading}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading || rating === 0}>
        {loading && <Loader2 className="me-2 size-4 animate-spin" />}
        {t("rev.submit")}
      </Button>
    </div>
  );
}
