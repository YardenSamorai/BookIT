import { z } from "zod";
import { BUSINESS_TYPES } from "@/lib/utils/constants";

export const onboardingStep1Schema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(80, "Business name is too long"),
  businessType: z.enum(BUSINESS_TYPES, {
    errorMap: () => ({ message: "Please select a business type" }),
  }),
});

export const onboardingStep2Schema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  logoUrl: z.string().optional().or(z.literal("")),
  coverImageUrl: z.string().optional().or(z.literal("")),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;
