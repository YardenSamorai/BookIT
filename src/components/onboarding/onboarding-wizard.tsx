"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OnboardingHeader } from "./onboarding-header";
import { StepBasicInfo } from "./step-basic-info";
import { StepBrand } from "./step-brand";
import { StepPreview } from "./step-preview";

const TOTAL_STEPS = 3;

export interface OnboardingState {
  businessName: string;
  businessType: string;
  businessId: string | null;
  slug: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  coverImageUrl: string;
}

const initialState: OnboardingState = {
  businessName: "",
  businessType: "",
  businessId: null,
  slug: null,
  primaryColor: "#0F172A",
  secondaryColor: "#3B82F6",
  logoUrl: "",
  coverImageUrl: "",
};

interface OnboardingWizardProps {
  userName: string;
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(initialState);

  const updateState = useCallback((patch: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const finish = useCallback(() => {
    router.push("/dashboard");
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:py-16">
      <OnboardingHeader step={step} totalSteps={TOTAL_STEPS} />

      <div className="mt-8 flex-1">
        {step === 1 && (
          <StepBasicInfo
            state={state}
            updateState={updateState}
            onNext={goNext}
            userName={userName}
          />
        )}
        {step === 2 && (
          <StepBrand
            state={state}
            updateState={updateState}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <StepPreview
            state={state}
            onBack={goBack}
            onFinish={finish}
          />
        )}
      </div>
    </div>
  );
}
