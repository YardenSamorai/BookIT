"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createBusiness } from "@/actions/onboarding";
import { BUSINESS_TYPES } from "@/lib/utils/constants";
import { BusinessTypeCard } from "./business-type-card";
import type { OnboardingState } from "./onboarding-wizard";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { TranslationKey } from "@/lib/i18n";

interface StepBasicInfoProps {
  state: OnboardingState;
  updateState: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  userName: string;
}

export function StepBasicInfo({
  state,
  updateState,
  onNext,
  userName,
}: StepBasicInfoProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = state.businessName.trim().length >= 2 && state.businessType;

  async function handleSubmit() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    const result = await createBusiness({
      businessName: state.businessName.trim(),
      businessType: state.businessType as "BARBER" | "BEAUTY" | "FITNESS" | "TUTOR" | "CLINIC" | "GENERIC",
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    updateState({
      businessId: result.data.businessId,
      slug: result.data.slug,
    });

    setLoading(false);
    onNext();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {userName}, {t("onboarding.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("onboarding.subtitle")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-name" className="text-sm font-medium">
            {t("onboarding.business_name")}
          </Label>
          <Input
            id="business-name"
            placeholder={t("onboarding.business_name_ph")}
            value={state.businessName}
            onChange={(e) => updateState({ businessName: e.target.value })}
            className="h-12 text-base"
            disabled={loading}
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">{t("onboarding.business_type")}</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BUSINESS_TYPES.map((value) => (
              <BusinessTypeCard
                key={value}
                value={value}
                label={t(`btype.${value}` as TranslationKey)}
                selected={state.businessType === value}
                onSelect={() => updateState({ businessType: value })}
                disabled={loading}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full text-base"
        onClick={handleSubmit}
        disabled={!isValid || loading}
      >
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        {t("onboarding.finish")}
      </Button>
    </div>
  );
}
