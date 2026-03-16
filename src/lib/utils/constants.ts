export const APP_NAME = "BookIT";

export const BUSINESS_TYPES = [
  "BARBER",
  "BEAUTY",
  "FITNESS",
  "TUTOR",
  "CLINIC",
  "GENERIC",
] as const;

export const BUSINESS_TYPE_LABELS: Record<(typeof BUSINESS_TYPES)[number], string> = {
  BARBER: "Barber",
  BEAUTY: "Beauty & Cosmetics",
  FITNESS: "Fitness Coach",
  TUTOR: "Tutor",
  CLINIC: "Clinic",
  GENERIC: "Other Business",
};

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SLOT_GRANULARITY_OPTIONS = [15, 30, 60] as const;

export const MAX_OTP_ATTEMPTS = 3;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_RATE_LIMIT_WINDOW_MINUTES = 10;
export const OTP_MAX_REQUESTS_PER_WINDOW = 3;
