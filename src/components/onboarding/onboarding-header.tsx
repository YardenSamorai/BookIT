"use client";

import { Progress } from "@/components/ui/progress";
import { useT } from "@/lib/i18n/locale-context";
import type { TranslationKey } from "@/lib/i18n";

interface OnboardingHeaderProps {
  step: number;
  totalSteps: number;
}

const STEP_LABEL_KEYS: TranslationKey[] = [
  "onboarding.business_name",
  "editor.tab_brand",
  "editor.live_preview",
];

export function OnboardingHeader({ step, totalSteps }: OnboardingHeaderProps) {
  const t = useT();
  const progress = (step / totalSteps) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold tracking-tight">BookIT</p>
        <p className="text-sm text-muted-foreground">
          {step} / {totalSteps}
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-between">
        {STEP_LABEL_KEYS.map((key, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber === step;
          const isComplete = stepNumber < step;

          return (
            <div
              key={key}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? "✓" : stepNumber}
              </span>
              <span
                className={
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {t(key)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
