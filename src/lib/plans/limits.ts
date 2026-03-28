export type PlanType = "FREE" | "STARTER" | "PRO";

export interface PlanLimits {
  maxStaff: number;
  maxServices: number;
  maxBookingsPerMonth: number;
  maxProducts: number;
  maxSessionPackages: number;
  maxCardTemplates: number;
  maxMonthlyMessages: number;
  maxGalleryImages: number;
  whatsappNotifications: boolean;
  allThemePresets: boolean;
  removeBranding: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxStaff: 1,
    maxServices: 5,
    maxBookingsPerMonth: 50,
    maxProducts: 5,
    maxSessionPackages: 2,
    maxCardTemplates: 2,
    maxMonthlyMessages: 100,
    maxGalleryImages: 10,
    whatsappNotifications: true,
    allThemePresets: false,
    removeBranding: false,
  },
  STARTER: {
    maxStaff: 3,
    maxServices: 15,
    maxBookingsPerMonth: 150,
    maxProducts: 10,
    maxSessionPackages: 5,
    maxCardTemplates: 5,
    maxMonthlyMessages: 300,
    maxGalleryImages: 25,
    whatsappNotifications: true,
    allThemePresets: false,
    removeBranding: false,
  },
  PRO: {
    maxStaff: Infinity,
    maxServices: Infinity,
    maxBookingsPerMonth: Infinity,
    maxProducts: Infinity,
    maxSessionPackages: Infinity,
    maxCardTemplates: Infinity,
    maxMonthlyMessages: 1500,
    maxGalleryImages: 50,
    whatsappNotifications: true,
    allThemePresets: true,
    removeBranding: true,
  },
};

export function getLimitsForPlan(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}
