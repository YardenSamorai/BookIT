import { getLimitsForPlan, type PlanType } from "./limits";

interface GateContext {
  plan: PlanType;
  currentCount: number;
}

function checkLimit(context: GateContext, limitKey: "maxStaff" | "maxServices" | "maxBookingsPerMonth" | "maxProducts" | "maxSessionPackages" | "maxCardTemplates"): { allowed: boolean; limit: number; current: number } {
  const limits = getLimitsForPlan(context.plan);
  const limit = limits[limitKey];

  return {
    allowed: context.currentCount < limit,
    limit: limit === Infinity ? -1 : limit,
    current: context.currentCount,
  };
}

export function canAddStaff(plan: PlanType, currentStaffCount: number) {
  return checkLimit({ plan, currentCount: currentStaffCount }, "maxStaff");
}

export function canAddService(plan: PlanType, currentServiceCount: number) {
  return checkLimit({ plan, currentCount: currentServiceCount }, "maxServices");
}

export function canCreateBooking(plan: PlanType, monthlyBookingCount: number) {
  return checkLimit({ plan, currentCount: monthlyBookingCount }, "maxBookingsPerMonth");
}

export function canAddProduct(plan: PlanType, currentProductCount: number) {
  return checkLimit({ plan, currentCount: currentProductCount }, "maxProducts");
}

export function canAddPackage(plan: PlanType, currentPackageCount: number) {
  return checkLimit({ plan, currentCount: currentPackageCount }, "maxSessionPackages");
}

export function canAddCardTemplate(plan: PlanType, currentCount: number) {
  return checkLimit({ plan, currentCount }, "maxCardTemplates");
}

export function isFeatureEnabled(
  plan: PlanType,
  feature: "whatsappNotifications" | "allThemePresets" | "removeBranding"
): boolean {
  const limits = getLimitsForPlan(plan);
  return limits[feature];
}
