import { translations, type Locale, type TranslationKey } from "./translations";

export type { Locale, TranslationKey };
export { translations };

export function t(locale: Locale, key: TranslationKey, vars?: Record<string, string | number>): string {
  const dict = translations[locale] ?? translations.en;
  let text = (dict as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }

  return text;
}

export function isRtl(locale: Locale): boolean {
  return locale === "he";
}

export function getDir(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

export const DAYS_KEYS: TranslationKey[] = [
  "days.sunday",
  "days.monday",
  "days.tuesday",
  "days.wednesday",
  "days.thursday",
  "days.friday",
  "days.saturday",
];

export const DAYS_SHORT_KEYS: TranslationKey[] = [
  "days.sun",
  "days.mon",
  "days.tue",
  "days.wed",
  "days.thu",
  "days.fri",
  "days.sat",
];
