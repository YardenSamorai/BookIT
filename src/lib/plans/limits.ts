export type PlanType = "FREE" | "STARTER" | "PRO";

export interface PlanLimits {
  maxStaff: number;
  maxServices: number;
  maxBookingsPerMonth: number;
  maxProducts: number;
  maxSessionPackages: number;
  maxCardTemplates: number;
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
    whatsappNotifications: true,
    allThemePresets: false,
    removeBranding: false,
  },
  STARTER: {
    maxStaff: 5,
    maxServices: 20,
    maxBookingsPerMonth: 500,
    maxProducts: 20,
    maxSessionPackages: 10,
    maxCardTemplates: 10,
    whatsappNotifications: true,
    allThemePresets: true,
    removeBranding: false,
  },
  PRO: {
    maxStaff: Infinity,
    maxServices: Infinity,
    maxBookingsPerMonth: Infinity,
    maxProducts: Infinity,
    maxSessionPackages: Infinity,
    maxCardTemplates: Infinity,
    whatsappNotifications: true,
    allThemePresets: true,
    removeBranding: true,
  },
};

export function getLimitsForPlan(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}
