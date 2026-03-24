/**
 * Centralized timezone handling for the application.
 *
 * All date/time formatting and wall-clock ↔ UTC conversions MUST use these
 * helpers so that times stay consistent regardless of the user's browser or
 * server timezone settings.
 */

export const BUSINESS_TZ = "Asia/Jerusalem";

/** Format a Date as HH:MM in the business timezone. */
export function formatTimeInTz(
  date: Date | string,
  locale: string = "he-IL"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TZ,
  });
}

/** Format a Date as a localized date string in the business timezone. */
export function formatDateInTz(
  date: Date | string,
  locale: string,
  options: Omit<Intl.DateTimeFormatOptions, "timeZone"> = {}
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, { ...options, timeZone: BUSINESS_TZ });
}

/** Get the hour (0-23) of a Date in the business timezone. */
export function getHoursInTz(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return parseInt(
    d.toLocaleString("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: BUSINESS_TZ,
    })
  );
}

/** Get the minutes (0-59) of a Date in the business timezone. */
export function getMinutesInTz(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return parseInt(
    d.toLocaleString("en-US", { minute: "numeric", timeZone: BUSINESS_TZ })
  );
}

/**
 * Convert wall-clock hours/minutes in BUSINESS_TZ to a UTC Date object
 * on the same calendar day as `dateRef` (interpreted in BUSINESS_TZ).
 */
export function wallClockToDate(
  dateRef: Date,
  hours: number,
  minutes: number
): Date {
  const dateStr = dateRef.toLocaleDateString("en-CA", {
    timeZone: BUSINESS_TZ,
  });
  const utcMs = Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    hours,
    minutes,
    0
  );
  const probe = new Date(utcMs);
  const utcParsed = new Date(
    probe.toLocaleString("en-US", { timeZone: "UTC" })
  );
  const tzParsed = new Date(
    probe.toLocaleString("en-US", { timeZone: BUSINESS_TZ })
  );
  const offsetMs = utcParsed.getTime() - tzParsed.getTime();
  return new Date(utcMs + offsetMs);
}
