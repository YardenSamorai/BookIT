"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { updateBusinessBrand } from "@/actions/onboarding";
import { ColorPicker } from "./color-picker";
import type { OnboardingState } from "./onboarding-wizard";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface StepBrandProps {
  state: OnboardingState;
  updateState: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESET_COMBOS = [
  { primary: "#0F172A", secondary: "#3B82F6", label: "Ocean" },
  { primary: "#1E1B4B", secondary: "#8B5CF6", label: "Violet" },
  { primary: "#1C1917", secondary: "#F97316", label: "Ember" },
  { primary: "#064E3B", secondary: "#10B981", label: "Forest" },
  { primary: "#4C0519", secondary: "#F43F5E", label: "Rose" },
  { primary: "#1E3A5F", secondary: "#38BDF8", label: "Sky" },
];

export function StepBrand({ state, updateState, onNext, onBack }: StepBrandProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!state.businessId) return;
    setLoading(true);
    setError("");

    const result = await updateBusinessBrand(state.businessId, {
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      logoUrl: state.logoUrl,
      coverImageUrl: state.coverImageUrl,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onNext();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("editor.tab_brand")}
        </h1>
        <p className="text-muted-foreground">
          {t("editor.brand_colors_desc")}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("hero.presets")}</Label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {PRESET_COMBOS.map((combo) => (
              <button
                key={combo.label}
                type="button"
                onClick={() =>
                  updateState({
                    primaryColor: combo.primary,
                    secondaryColor: combo.secondary,
                  })
                }
                className={`group flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:border-primary/50 ${
                  state.primaryColor === combo.primary &&
                  state.secondaryColor === combo.secondary
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                }`}
                disabled={loading}
              >
                <div className="flex gap-1">
                  <div
                    className="size-5 rounded-full"
                    style={{ backgroundColor: combo.primary }}
                  />
                  <div
                    className="size-5 rounded-full"
                    style={{ backgroundColor: combo.secondary }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {combo.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorPicker
            label={t("editor.primary_color")}
            value={state.primaryColor}
            onChange={(v) => updateState({ primaryColor: v })}
            disabled={loading}
          />
          <ColorPicker
            label={t("editor.secondary_color")}
            value={state.secondaryColor}
            onChange={(v) => updateState({ secondaryColor: v })}
            disabled={loading}
          />
        </div>

        <BrandPreview state={state} />
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
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Continue
        </Button>
      </div>
    </div>
  );
}

function BrandPreview({ state }: { state: OnboardingState }) {
  const t = useT();
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t("editor.live_preview")}</Label>
      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: state.primaryColor }}
      >
        <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <h2 className="text-2xl font-bold text-white">
            {state.businessName || t("onboarding.business_name")}
          </h2>
          <p className="text-sm text-white/70">
            {t("pub.default_subtitle")}
          </p>
          <button
            type="button"
            className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: state.secondaryColor }}
          >
            {t("pub.book_now")}
          </button>
        </div>
      </div>
    </div>
  );
}
