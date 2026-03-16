"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { publishBusiness } from "@/actions/onboarding";
import type { OnboardingState } from "./onboarding-wizard";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  Palette,
  Rocket,
  Store,
} from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { TranslationKey } from "@/lib/i18n";

interface StepPreviewProps {
  state: OnboardingState;
  onBack: () => void;
  onFinish: () => void;
}

export function StepPreview({ state, onBack, onFinish }: StepPreviewProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);

  async function handlePublish() {
    if (!state.businessId) return;
    setLoading(true);
    setError("");

    const result = await publishBusiness(state.businessId);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setPublished(true);
    setLoading(false);
  }

  const typeLabel = t(`btype.${state.businessType}` as TranslationKey);

  if (published) {
    return (
      <div className="flex flex-col items-center gap-8 py-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100">
          <Check className="size-10 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("book.all_set")}
          </h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            {t("editor.site_status_desc")}
          </p>
        </div>

        {state.slug && (
          <Card className="w-full max-w-sm">
            <CardContent className="flex items-center gap-3 py-4">
              <Globe className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {state.slug}.bookit.com
              </span>
              <ExternalLink className="ml-auto size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        <Button size="lg" className="text-base" onClick={onFinish}>
          <Rocket className="mr-2 size-4" />
          {t("dash.dashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("editor.live_preview")}
        </h1>
        <p className="text-muted-foreground">
          {t("editor.site_status_desc")}
        </p>
      </div>

      <div className="space-y-4">
        <ReviewRow
          icon={Store}
          label={t("onboarding.business_name")}
          value={state.businessName}
          extra={<Badge variant="secondary">{typeLabel}</Badge>}
        />

        <ReviewRow
          icon={Globe}
          label="URL"
          value={state.slug ? `${state.slug}.bookit.com` : "—"}
        />

        <ReviewRow
          icon={Palette}
          label={t("editor.brand_colors")}
          value={
            <div className="flex items-center gap-2">
              <div
                className="size-6 rounded-full border"
                style={{ backgroundColor: state.primaryColor }}
              />
              <div
                className="size-6 rounded-full border"
                style={{ backgroundColor: state.secondaryColor }}
              />
            </div>
          }
        />
      </div>

      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: state.primaryColor }}
      >
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <h2 className="text-xl font-bold text-white">
            {state.businessName}
          </h2>
          <p className="text-xs text-white/60">{typeLabel}</p>
          <button
            type="button"
            className="mt-2 rounded-lg px-5 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: state.secondaryColor }}
          >
            {t("pub.book_now")}
          </button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 size-4" />
          {t("common.back")}
        </Button>
        <Button
          size="lg"
          className="flex-1 text-base"
          onClick={handlePublish}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          <Rocket className="mr-2 size-4" />
          {t("editor.published")}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <Icon className="size-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2 text-sm font-medium">
            {value}
            {extra}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
