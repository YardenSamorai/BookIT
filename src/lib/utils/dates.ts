export function toBusinessTimezone(date: Date, timezone: string): Date {
  const localeString = date.toLocaleString("en-US", { timeZone: timezone });
  return new Date(localeString);
}

export function formatDate(date: Date, timezone: string): string {
  return date.toLocaleDateString("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: Date, timezone: string): string {
  return date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(date: Date, timezone: string): string {
  return `${formatDate(date, timezone)} ${formatTime(date, timezone)}`;
}

export function getDayOfWeek(date: Date, timezone: string): number {
  const localDate = toBusinessTimezone(date, timezone);
  return localDate.getDay();
}

export function startOfDay(date: Date, timezone: string): Date {
  const local = toBusinessTimezone(date, timezone);
  local.setHours(0, 0, 0, 0);
  return local;
}

export function endOfDay(date: Date, timezone: string): Date {
  const local = toBusinessTimezone(date, timezone);
  local.setHours(23, 59, 59, 999);
  return local;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}
