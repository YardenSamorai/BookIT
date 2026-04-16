"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import type {
  Appointment,
  Staff,
  ClassInstance,
  StaffCardVisual,
} from "./calendar-types";
import {
  isSameDay,
  formatTime,
  getStatusStyle,
  getClassCardVisual,
  getHoursInTz,
  getMinutesInTz,
} from "./calendar-types";

interface WeekViewProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  /**
   * Resolved staff calendar visuals keyed by staff id. Empty map means the
   * business has a single staff member and appointments should fall back to
   * status-first coloring.
   */
  staffVisualMap: Map<string, StaffCardVisual>;
  staffFilter: string | null;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onDayClick: (date: Date) => void;
}

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "שבת"];
const DAY_NAMES_HE_FULL = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];

// ────────────────────────────────────────────────────────────────────────────
// Week timeline geometry
// ────────────────────────────────────────────────────────────────────────────

/** Fallback time range when the week has no items. */
const WEEK_HOUR_START_DEFAULT = 8;
const WEEK_HOUR_END_DEFAULT = 20;
/**
 * Vertical pixels per hour of grid. Slightly denser than day-view's 64px so
 * seven columns + hour gutter fit on typical laptop screens without horizontal
 * scrolling. 52 keeps a half-hour block (26px) still tappable/readable.
 */
const WEEK_ROW_HEIGHT = 52;
const WEEK_PX_PER_MIN = WEEK_ROW_HEIGHT / 60;
/**
 * Minimum visible height for very short bookings (~10–20m). Sized so a
 * compact card can comfortably stack two lines (time + service) of small
 * text without clipping. Going below ~28px makes 20m services look like
 * empty pills.
 */
const WEEK_MIN_BLOCK_HEIGHT = 32;
/** Width of the hour gutter column. */
const WEEK_GUTTER_WIDTH = 48;

/** Total grid height when scrollable band is larger than content. */
const WEEK_DESKTOP_BAND_CLASS =
  "h-[min(75vh,720px)] min-h-[320px] max-h-[calc(100vh-13rem)]";

// ────────────────────────────────────────────────────────────────────────────
// Overlap layout (side-by-side sub-columns within a single day)
// ────────────────────────────────────────────────────────────────────────────

type TimelineItem = {
  id: string;
  // Accept either a serialized string or a Date instance. `Appointment.startTime`
  // flows in as `Date` from the calendar shell while other callers may pass
  // already-serialized timestamps; either way we only ever pipe them through
  // `new Date(...)` below, which handles both.
  startTime: string | Date;
  endTime: string | Date;
};
type WeekLayoutInfo = { overlapIndex: number; overlapCount: number };

/**
 * Given all events on a single day (appointments + classes), assign each a
 * sub-column index so overlapping events render side-by-side. Returns a map
 * keyed by event id so both appointments and classes look up the same table.
 *
 * Algorithm matches the day-view's per-column resolver: events are processed
 * in start-time order; each joins the lowest-indexed sub-column whose
 * previous occupant has already ended. The group's overlapCount is the peak
 * number of simultaneously active events.
 */
function computeDayOverlap(
  items: TimelineItem[]
): Map<string, WeekLayoutInfo> {
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const result = new Map<string, WeekLayoutInfo>();
  const active: { id: string; end: number; idx: number }[] = [];

  for (const it of sorted) {
    const start = new Date(it.startTime).getTime();
    const end = new Date(it.endTime).getTime();

    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].end <= start) active.splice(i, 1);
    }

    // Find the lowest free sub-column so we reuse lanes instead of always
    // stacking into new ones — keeps the layout tight when events are
    // partially overlapping rather than fully simultaneous.
    const used = new Set(active.map((a) => a.idx));
    let idx = 0;
    while (used.has(idx)) idx++;

    active.push({ id: it.id, end, idx });

    const count = active.length;
    for (const a of active) {
      const prev = result.get(a.id);
      result.set(a.id, {
        overlapIndex: prev?.overlapIndex ?? a.idx,
        overlapCount: Math.max(prev?.overlapCount ?? 0, count),
      });
    }
  }

  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function appointmentStatusLabel(
  status: string,
  t: (key: import("@/lib/i18n").TranslationKey) => string
): string {
  switch (status) {
    case "CONFIRMED":
      return t("dash.status_confirmed");
    case "PENDING":
      return t("dash.status_pending");
    case "COMPLETED":
      return t("dash.status_completed");
    case "NO_SHOW":
      return t("dash.status_no_show");
    case "CANCELLED":
      return t("dash.status_cancelled");
    default:
      return status;
  }
}

export function WeekView({
  appointments,
  classInstances = [],
  staff: _staff,
  staffVisualMap,
  staffFilter,
  currentDate,
  onAptClick,
  onClassClick,
  onDayClick,
}: WeekViewProps) {
  void _staff;
  const t = useT();
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";
  const dayNames = isRtl ? DAY_NAMES_HE : DAY_NAMES_EN;
  const dayNamesFull = isRtl ? DAY_NAMES_HE_FULL : DAY_NAMES_EN;
  const today = new Date();

  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<number, Appointment[]>();
    for (const apt of appointments) {
      const start = new Date(apt.startTime);
      for (let i = 0; i < 7; i++) {
        if (isSameDay(start, weekDays[i])) {
          const list = map.get(i) ?? [];
          list.push(apt);
          map.set(i, list);
          break;
        }
      }
    }
    return map;
  }, [appointments, weekDays]);

  const classInstancesByDay = useMemo(() => {
    const map = new Map<number, ClassInstance[]>();
    for (const ci of classInstances) {
      if (ci.status !== "SCHEDULED") continue;
      for (let i = 0; i < 7; i++) {
        const dayStr = toDateStr(weekDays[i]);
        if (ci.date === dayStr) {
          const list = map.get(i) ?? [];
          list.push(ci);
          map.set(i, list);
          break;
        }
      }
    }
    return map;
  }, [classInstances, weekDays]);

  // ── Hour range: widen defaults so every booking/class is visible ────────
  const { hourStart, hourEnd } = useMemo(() => {
    let minHour = WEEK_HOUR_START_DEFAULT;
    let maxHour = WEEK_HOUR_END_DEFAULT;
    let hasAny = false;

    for (let i = 0; i < 7; i++) {
      for (const a of appointmentsByDay.get(i) ?? []) {
        const s = new Date(a.startTime);
        const e = new Date(a.endTime);
        minHour = Math.min(minHour, getHoursInTz(s));
        maxHour = Math.max(
          maxHour,
          getHoursInTz(e) + (getMinutesInTz(e) > 0 ? 1 : 0)
        );
        hasAny = true;
      }
      for (const c of classInstancesByDay.get(i) ?? []) {
        const s = new Date(c.startTime);
        const e = new Date(c.endTime);
        minHour = Math.min(minHour, getHoursInTz(s));
        maxHour = Math.max(
          maxHour,
          getHoursInTz(e) + (getMinutesInTz(e) > 0 ? 1 : 0)
        );
        hasAny = true;
      }
    }

    if (!hasAny) {
      return {
        hourStart: WEEK_HOUR_START_DEFAULT,
        hourEnd: WEEK_HOUR_END_DEFAULT,
      };
    }
    return {
      hourStart: Math.max(0, minHour - 1),
      hourEnd: Math.min(24, maxHour + 1),
    };
  }, [appointmentsByDay, classInstancesByDay]);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = hourStart; i < hourEnd; i++) h.push(i);
    return h;
  }, [hourStart, hourEnd]);

  const gridHeight = hours.length * WEEK_ROW_HEIGHT;
  const totalMinutes = (hourEnd - hourStart) * 60;

  // ── Auto-scroll to "now" on mount / when current date moves to this week
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const todayInWeek = weekDays.some((d) => isSameDay(d, now));
    if (!todayInWeek) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const mins =
      getHoursInTz(now) * 60 + getMinutesInTz(now) - hourStart * 60;
    if (mins < 0) return;
    const target = Math.max(0, mins * WEEK_PX_PER_MIN - 140);
    scrollRef.current.scrollTo({ top: target, behavior: "smooth" });
  }, [weekDays, now, hourStart]);

  const currentTimeTop = useMemo(() => {
    const todayInWeek = weekDays.findIndex((d) => isSameDay(d, now));
    if (todayInWeek < 0) return null;
    const mins =
      getHoursInTz(now) * 60 + getMinutesInTz(now) - hourStart * 60;
    if (mins < 0 || mins > totalMinutes) return null;
    return { top: mins * WEEK_PX_PER_MIN, dayIndex: todayInWeek };
  }, [weekDays, now, hourStart, totalMinutes]);

  return (
    <>
      {/* ── Desktop: 7-day timeline. The day-header strip and the timeline
              body share a single scroll container so they always line up
              (otherwise the body's vertical scrollbar would steal a few
              pixels and shift columns relative to their headers). The header
              strip is `position: sticky` inside that container so it stays
              pinned while the body scrolls. ────────────────────────────── */}
      <div
        className={cn(
          "hidden md:block overflow-hidden rounded-xl border bg-card",
          WEEK_DESKTOP_BAND_CLASS
        )}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-y-contain"
          style={{ scrollbarGutter: "stable" }}
        >
          {/* Sticky day headers — share the parent scroll container's content
              width, so column geometry below is always pixel-aligned. */}
          <div className="sticky top-0 z-30 flex border-b bg-muted/20 backdrop-blur-sm">
            <div
              className="shrink-0"
              style={{ width: WEEK_GUTTER_WIDTH }}
              aria-hidden
            />
            <div className="grid flex-1 grid-cols-7">
              {weekDays.map((day, i) => {
                const isCurrentDay = isSameDay(day, today);
                const total1on1 =
                  (appointmentsByDay.get(i) ?? []).filter(
                    (a) => !a.classInstanceId
                  ).length;
                const classCount = (classInstancesByDay.get(i) ?? []).length;
                const pendingCount =
                  (appointmentsByDay.get(i) ?? []).filter(
                    (a) => a.status === "PENDING"
                  ).length;
                const totalItems = total1on1 + classCount;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onDayClick(day)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 border-s border-border/40 py-2 transition-colors first:border-s-0 hover:bg-muted/40",
                      isCurrentDay && "bg-primary/[0.06]"
                    )}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {dayNamesFull[day.getDay()]}
                    </span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-bold leading-none",
                        isCurrentDay
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {t("cal.week_mobile_items", { n: totalItems })}
                      {pendingCount > 0 && (
                        <span className="ms-1 font-semibold text-amber-600">
                          · {pendingCount}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline body — gutter + 7 columns. */}
          <div className="flex relative" style={{ height: gridHeight }}>
            <div
              className="shrink-0 border-e border-border/40 bg-muted/10"
              style={{ width: WEEK_GUTTER_WIDTH, height: gridHeight }}
            >
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="relative text-[10px] text-muted-foreground/70"
                  style={{ height: WEEK_ROW_HEIGHT }}
                >
                  {i > 0 && (
                    <span
                      className="absolute -top-1.5 end-1.5 tabular-nums"
                      dir="ltr"
                    >
                      {String(h).padStart(2, "0")}:00
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="relative grid flex-1 grid-cols-7">
              {hours.map((h, i) => (
                <div
                  key={h}
                  className="pointer-events-none absolute inset-x-0 border-t border-border/25"
                  style={{ top: i * WEEK_ROW_HEIGHT }}
                  aria-hidden
                />
              ))}

              {weekDays.map((day, i) => {
                const dayApts = appointmentsByDay.get(i) ?? [];
                const dayCIs = classInstancesByDay.get(i) ?? [];
                const isCurrentDay = isSameDay(day, today);
                return (
                  <WeekTimelineColumn
                    key={i}
                    day={day}
                    appointments={dayApts}
                    classInstances={dayCIs}
                    hourStart={hourStart}
                    isCurrentDay={isCurrentDay}
                    staffFilter={staffFilter}
                    staffVisualMap={staffVisualMap}
                    dateLocale={dateLocale}
                    onAptClick={onAptClick}
                    onClassClick={onClassClick}
                    onDayClick={onDayClick}
                  />
                );
              })}

              {currentTimeTop !== null && (
                <div
                  className="pointer-events-none absolute z-20 h-0.5 bg-red-500/80"
                  style={{
                    top: currentTimeTop.top,
                    insetInlineStart: `${(currentTimeTop.dayIndex * 100) / 7}%`,
                    width: `${100 / 7}%`,
                  }}
                  aria-hidden
                >
                  <span className="absolute -start-1 -top-1 block size-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileWeekAgenda
        weekDays={weekDays}
        appointmentsByDay={appointmentsByDay}
        classInstancesByDay={classInstancesByDay}
        dateLocale={dateLocale}
        dayNames={dayNames}
        today={today}
        staffFilter={staffFilter}
        staffVisualMap={staffVisualMap}
        t={t}
        onAptClick={onAptClick}
        onClassClick={onClassClick}
        onDayClick={onDayClick}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Desktop: a single day column in the week timeline
// ────────────────────────────────────────────────────────────────────────────

function WeekTimelineColumn({
  day,
  appointments,
  classInstances,
  hourStart,
  isCurrentDay,
  staffFilter,
  staffVisualMap,
  dateLocale,
  onAptClick,
  onClassClick,
  onDayClick,
}: {
  day: Date;
  appointments: Appointment[];
  classInstances: ClassInstance[];
  hourStart: number;
  isCurrentDay: boolean;
  staffFilter: string | null;
  staffVisualMap: Map<string, StaffCardVisual>;
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onDayClick: (date: Date) => void;
}) {
  // Overlap layout combines 1:1 appointments and class instances: two events
  // starting at the same time render side-by-side regardless of kind, so the
  // visual "two cards at once" cue is consistent.
  const layout = useMemo(() => {
    const items: TimelineItem[] = [
      ...appointments.map((a) => ({
        id: a.id,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
      ...classInstances.map((c) => ({
        id: c.id,
        startTime: c.startTime,
        endTime: c.endTime,
      })),
    ];
    return computeDayOverlap(items);
  }, [appointments, classInstances]);

  return (
    <div
      onClick={() => onDayClick(day)}
      className={cn(
        "relative cursor-pointer border-s border-border/40 first:border-s-0 transition-colors hover:bg-muted/[0.04]",
        isCurrentDay && "bg-primary/[0.04]"
      )}
    >
      {appointments.length === 0 && classInstances.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] text-muted-foreground/40">—</span>
        </div>
      )}

      {appointments.map((apt) => {
        const li = layout.get(apt.id) ?? { overlapIndex: 0, overlapCount: 1 };
        return (
          <WeekAptBlock
            key={apt.id}
            apt={apt}
            hourStart={hourStart}
            dateLocale={dateLocale}
            staffVisual={staffVisualMap.get(apt.staffId)}
            staffFilter={staffFilter}
            overlapIndex={li.overlapIndex}
            overlapCount={li.overlapCount}
            onAptClick={onAptClick}
          />
        );
      })}

      {classInstances.map((ci) => {
        const li = layout.get(ci.id) ?? { overlapIndex: 0, overlapCount: 1 };
        return (
          <WeekClassBlock
            key={ci.id}
            instance={ci}
            hourStart={hourStart}
            dateLocale={dateLocale}
            staffVisual={staffVisualMap.get(ci.staffId)}
            staffFilter={staffFilter}
            overlapIndex={li.overlapIndex}
            overlapCount={li.overlapCount}
            onClassClick={onClassClick}
          />
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Desktop timeline cells (1:1 appointment + class instance)
// ────────────────────────────────────────────────────────────────────────────

function WeekAptBlock({
  apt,
  hourStart,
  dateLocale,
  staffVisual,
  staffFilter,
  overlapIndex,
  overlapCount,
  onAptClick,
}: {
  apt: Appointment;
  hourStart: number;
  dateLocale: string;
  staffVisual: StaffCardVisual | undefined;
  staffFilter: string | null;
  overlapIndex: number;
  overlapCount: number;
  onAptClick: (apt: Appointment) => void;
}) {
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const startMins =
    getHoursInTz(start) * 60 + getMinutesInTz(start) - hourStart * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  if (startMins < 0) return null;

  const top = startMins * WEEK_PX_PER_MIN;
  const heightPx = Math.max(durationMins * WEEK_PX_PER_MIN, WEEK_MIN_BLOCK_HEIGHT);
  const widthPct = 100 / Math.max(1, overlapCount);
  const leftPct = overlapIndex * widthPct;

  const style = getStatusStyle(apt.status);
  const useStaffColor = Boolean(staffVisual);
  const dimmed = staffFilter !== null && staffFilter !== apt.staffId;
  const timeStart = formatTime(start, dateLocale);
  const timeEnd = formatTime(end, dateLocale);
  // "Compact" = either physically short (sub-50px height ≈ short service)
  // or narrow (an overlap forced the card to share width). Both cases switch
  // to a 2-line vertical layout: time on top, service name below — much more
  // legible than the previous single-line truncated row.
  const isCompact = heightPx < 50 || overlapCount > 1;
  // Very short bookings (≈20–30m) get clamped to WEEK_MIN_BLOCK_HEIGHT (32px)
  // which leaves only enough vertical room for time + service name. Trying to
  // squeeze the customer name in too either clips it behind overflow:hidden or
  // produces visually "empty-looking" tiny cards. Desktop day view keeps the
  // customer name because its rows are much wider and have the real duration
  // height to work with. Threshold ≈40px ≈ 46m+ service which comfortably fits
  // three rows at the current type scale.
  const showCustomerInCompact = heightPx >= 40;
  const textClass = useStaffColor ? "" : style.text;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onAptClick(apt);
      }}
      title={
        apt.customerName
          ? `${timeStart}–${timeEnd} · ${apt.customerName} · ${apt.serviceName} · ${apt.staffName}`
          : `${timeStart}–${timeEnd} · ${apt.serviceName} · ${apt.staffName}`
      }
      className={cn(
        "absolute overflow-hidden rounded-md border-s-[3px] text-start shadow-sm transition-shadow hover:z-10 hover:shadow-md hover:ring-1 hover:ring-black/10",
        useStaffColor ? "" : cn(style.bg, style.border),
        dimmed && "opacity-35"
      )}
      style={{
        top,
        height: heightPx,
        insetInlineStart: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        ...(useStaffColor && staffVisual
          ? {
              backgroundColor: staffVisual.bg,
              borderInlineStartColor: staffVisual.accent,
              color: staffVisual.text,
            }
          : undefined),
      }}
    >
      {isCompact ? (
        // Compact 2-line layout for short/overlapping cards.
        //
        // • Time row: 10px bold — stays scannable at a glance.
        // • Content row: service + customer on ONE line ("שעווה ידיים -
        //   ירדן סמוראי"). This matches the owner's preferred format and
        //   frees a whole row of vertical space compared to the previous
        //   stacked layout. `line-clamp-2 break-words` lets longer strings
        //   wrap cleanly instead of being mid-word-truncated.
        // • Very short cards (<40px) still drop the customer entirely so
        //   they don't look crushed — see `showCustomerInCompact`.
        // • `px-1` (not `px-1.5`) reclaims horizontal space so Hebrew names
        //   like "ירדן סמוראי" have room to breathe.
        <div className="flex h-full flex-col justify-start gap-0.5 px-1 py-0.5">
          <p className="flex items-center gap-1 leading-none">
            <span
              className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
              aria-hidden
            />
            <span
              className={cn(
                "truncate text-[10px] font-bold tabular-nums",
                textClass
              )}
              dir="ltr"
            >
              {timeStart}
            </span>
          </p>
          <p
            className={cn(
              "line-clamp-2 break-words text-[10px] font-semibold leading-[1.15]",
              textClass
            )}
          >
            {apt.serviceName}
            {apt.customerName && showCustomerInCompact
              ? ` - ${apt.customerName}`
              : ""}
          </p>
        </div>
      ) : (
        <div className="px-1.5 py-1">
          <p className="flex items-center gap-1 leading-tight">
            <span
              className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
              aria-hidden
            />
            <span
              className={cn(
                "text-[10px] font-semibold tabular-nums",
                textClass
              )}
              dir="ltr"
            >
              {timeStart}–{timeEnd}
            </span>
          </p>
          <p
            className={cn(
              "mt-0.5 line-clamp-2 break-words text-[11px] font-bold leading-tight",
              textClass
            )}
          >
            {apt.serviceName}
            {apt.customerName ? ` - ${apt.customerName}` : ""}
          </p>
        </div>
      )}
    </button>
  );
}

function WeekClassBlock({
  instance,
  hourStart,
  dateLocale,
  staffVisual,
  staffFilter,
  overlapIndex,
  overlapCount,
  onClassClick,
}: {
  instance: ClassInstance;
  hourStart: number;
  dateLocale: string;
  staffVisual: StaffCardVisual | undefined;
  staffFilter: string | null;
  overlapIndex: number;
  overlapCount: number;
  onClassClick?: (ci: ClassInstance) => void;
}) {
  const start = new Date(instance.startTime);
  const end = new Date(instance.endTime);
  const startMins =
    getHoursInTz(start) * 60 + getMinutesInTz(start) - hourStart * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  if (startMins < 0) return null;

  const top = startMins * WEEK_PX_PER_MIN;
  const heightPx = Math.max(durationMins * WEEK_PX_PER_MIN, WEEK_MIN_BLOCK_HEIGHT);
  const widthPct = 100 / Math.max(1, overlapCount);
  const leftPct = overlapIndex * widthPct;

  const vis = staffVisual
    ? getClassCardVisual(staffVisual.accent)
    : getClassCardVisual(instance.calendarColor);
  const booked = instance.bookedCount ?? 0;
  const dimmed = staffFilter !== null && staffFilter !== instance.staffId;
  const timeStart = formatTime(start, dateLocale);
  const timeEnd = formatTime(end, dateLocale);
  const isCompact = heightPx < 50 || overlapCount > 1;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClassClick?.(instance);
      }}
      title={`${timeStart}–${timeEnd} · ${instance.serviceName} · ${booked}/${instance.maxParticipants} · ${instance.staffName}`}
      className={cn(
        "absolute overflow-hidden rounded-md border-s-[3px] border-dashed text-start shadow-sm transition-shadow hover:z-10 hover:shadow-md hover:ring-1 hover:ring-black/10",
        dimmed && "opacity-35"
      )}
      style={{
        top,
        height: heightPx,
        insetInlineStart: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        backgroundColor: vis.bg,
        borderInlineStartColor: vis.accent,
        color: vis.text,
      }}
    >
      {isCompact ? (
        <div className="flex h-full flex-col justify-center gap-0.5 px-1.5 py-0.5">
          <p
            className="truncate text-[10px] font-bold tabular-nums leading-none"
            dir="ltr"
          >
            ⟳ {timeStart}
          </p>
          <p className="truncate text-[10px] font-semibold leading-tight">
            {instance.serviceName}
          </p>
        </div>
      ) : (
        <div className="px-1.5 py-1">
          <p
            className="text-[10px] font-semibold tabular-nums leading-tight"
            dir="ltr"
          >
            ⟳ {timeStart}–{timeEnd}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold leading-tight">
            {instance.serviceName}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium tabular-nums leading-tight opacity-90">
            {booked}/{instance.maxParticipants}
          </p>
        </div>
      )}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Mobile agenda: same-start-time groups render side-by-side
// ────────────────────────────────────────────────────────────────────────────

/** Agenda row: either a standalone card or a group of simultaneous cards. */
type AgendaGroup = {
  /** Shared start-time label (first event in the group). */
  timeLabel: string;
  entries: Array<
    | { kind: "appointment"; data: Appointment }
    | { kind: "class"; data: ClassInstance }
  >;
};

/**
 * Collapse a day's events into groups of simultaneously-starting items so
 * the mobile agenda can render them horizontally. Events that share only a
 * partial overlap (e.g. 10:00–11:00 vs 10:30–11:30) remain in separate groups
 * so users still see a tidy vertical flow; truly simultaneous starts (which
 * are the main confusion source) are grouped.
 */
function buildMobileAgendaGroups(
  appointments: Appointment[],
  classInstances: ClassInstance[],
  dateLocale: string
): AgendaGroup[] {
  const entries = [
    ...appointments.map(
      (a) => ({ kind: "appointment" as const, data: a })
    ),
    ...classInstances.map(
      (c) => ({ kind: "class" as const, data: c })
    ),
  ];
  entries.sort((a, b) => {
    const ta = new Date(a.data.startTime).getTime();
    const tb = new Date(b.data.startTime).getTime();
    return ta - tb;
  });

  const groups: AgendaGroup[] = [];
  for (const entry of entries) {
    const start = new Date(entry.data.startTime).getTime();
    const last = groups[groups.length - 1];
    const lastStart = last
      ? new Date(last.entries[0].data.startTime).getTime()
      : null;
    if (last && lastStart !== null && lastStart === start) {
      last.entries.push(entry);
    } else {
      groups.push({
        timeLabel: formatTime(new Date(entry.data.startTime), dateLocale),
        entries: [entry],
      });
    }
  }
  return groups;
}

function MobileWeekAgenda({
  weekDays,
  appointmentsByDay,
  classInstancesByDay,
  dateLocale,
  dayNames,
  today,
  staffFilter,
  staffVisualMap,
  t,
  onAptClick,
  onClassClick,
  onDayClick,
}: {
  weekDays: Date[];
  appointmentsByDay: Map<number, Appointment[]>;
  classInstancesByDay: Map<number, ClassInstance[]>;
  dateLocale: string;
  dayNames: string[];
  today: Date;
  staffFilter: string | null;
  staffVisualMap: Map<string, StaffCardVisual>;
  t: (
    key: import("@/lib/i18n").TranslationKey,
    vars?: Record<string, string | number>
  ) => string;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onDayClick: (date: Date) => void;
}) {
  const todayIdx = weekDays.findIndex((d) => isSameDay(d, today));
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(todayIdx >= 0 ? [todayIdx] : [])
  );

  function toggleDay(idx: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1.5 md:hidden">
      {weekDays.map((day, i) => {
        const isCurrentDay = isSameDay(day, today);
        const dayApts = appointmentsByDay.get(i) ?? [];
        const dayCIs = classInstancesByDay.get(i) ?? [];
        const isOpen = expanded.has(i);
        const total1on1 = dayApts.filter((a) => !a.classInstanceId).length;
        const pendingCount = dayApts.filter(
          (a) => a.status === "PENDING"
        ).length;
        const totalItems = total1on1 + dayCIs.length;
        const groups = buildMobileAgendaGroups(dayApts, dayCIs, dateLocale);

        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-xl border transition-colors",
              isCurrentDay
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            )}
          >
            <button
              type="button"
              onClick={() => toggleDay(i)}
              className="flex w-full items-center gap-3 p-3 text-start"
            >
              <div className="flex w-10 shrink-0 flex-col items-center">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {dayNames[day.getDay()]}
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-bold",
                    isCurrentDay
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{t("cal.week_mobile_items", { n: totalItems })}</span>
                  {pendingCount > 0 && (
                    <span className="font-semibold text-amber-600">
                      {t("cal.week_footer_pending", { n: pendingCount })}
                    </span>
                  )}
                </div>
              </div>

              {isOpen ? (
                <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="space-y-1.5 border-t px-3 pb-3 pt-2">
                {groups.length === 0 && (
                  <button
                    type="button"
                    onClick={() => onDayClick(day)}
                    className="w-full rounded-lg border border-dashed border-border/60 py-3 text-center text-sm text-muted-foreground/60"
                  >
                    {t("cal.week_empty_day")}
                  </button>
                )}

                {groups.map((group, gi) => {
                  // Single entry: render full-width card (original look).
                  if (group.entries.length === 1) {
                    const entry = group.entries[0];
                    return entry.kind === "appointment" ? (
                      <MobileAgendaApt
                        key={`a-${entry.data.id}`}
                        apt={entry.data}
                        dateLocale={dateLocale}
                        staffVisual={staffVisualMap.get(entry.data.staffId)}
                        staffFilter={staffFilter}
                        onAptClick={onAptClick}
                      />
                    ) : (
                      <MobileAgendaClass
                        key={`c-${entry.data.id}`}
                        instance={entry.data}
                        dateLocale={dateLocale}
                        staffVisual={staffVisualMap.get(entry.data.staffId)}
                        staffFilter={staffFilter}
                        onClassClick={onClassClick}
                      />
                    );
                  }

                  // 2+ simultaneous entries: render side-by-side so the
                  // overlap is visually obvious. A small header labels the
                  // shared time so the row reads as "10:00 — two things".
                  return (
                    <div key={`g-${gi}`} className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span
                          className="size-1 rounded-full bg-amber-500"
                          aria-hidden
                        />
                        <span dir="ltr" className="tabular-nums">
                          {group.timeLabel}
                        </span>
                        <span>
                          {t("cal.week_overlap_badge", {
                            n: group.entries.length,
                          })}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {group.entries.map((entry) =>
                          entry.kind === "appointment" ? (
                            <div
                              key={`a-${entry.data.id}`}
                              className="min-w-0 flex-1"
                            >
                              <MobileAgendaApt
                                apt={entry.data}
                                dateLocale={dateLocale}
                                staffVisual={staffVisualMap.get(
                                  entry.data.staffId
                                )}
                                staffFilter={staffFilter}
                                compact
                                onAptClick={onAptClick}
                              />
                            </div>
                          ) : (
                            <div
                              key={`c-${entry.data.id}`}
                              className="min-w-0 flex-1"
                            >
                              <MobileAgendaClass
                                instance={entry.data}
                                dateLocale={dateLocale}
                                staffVisual={staffVisualMap.get(
                                  entry.data.staffId
                                )}
                                staffFilter={staffFilter}
                                compact
                                onClassClick={onClassClick}
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MobileAgendaApt({
  apt,
  dateLocale,
  staffVisual,
  staffFilter,
  compact,
  onAptClick,
}: {
  apt: Appointment;
  dateLocale: string;
  staffVisual: StaffCardVisual | undefined;
  staffFilter: string | null;
  compact?: boolean;
  onAptClick: (apt: Appointment) => void;
}) {
  const style = getStatusStyle(apt.status);
  const useStaffColor = Boolean(staffVisual);
  const dimmed = staffFilter !== null && staffFilter !== apt.staffId;
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const timeRange = `${formatTime(start, dateLocale)} – ${formatTime(end, dateLocale)}`;
  const textClass = useStaffColor ? "" : style.text;

  return (
    <button
      type="button"
      onClick={() => onAptClick(apt)}
      className={cn(
        "w-full rounded-md border-s-[3px] text-start shadow-sm transition-all hover:brightness-[0.98] hover:shadow-md",
        compact ? "px-2 py-1.5" : "px-3 py-2.5",
        !useStaffColor && style.bg,
        !useStaffColor && style.border,
        !useStaffColor && style.text,
        dimmed && "opacity-35"
      )}
      style={
        useStaffColor && staffVisual
          ? {
              backgroundColor: staffVisual.bg,
              borderInlineStartColor: staffVisual.accent,
              color: staffVisual.text,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
          aria-hidden
        />
        <span
          className={cn(
            "font-semibold tabular-nums leading-snug",
            compact ? "text-[11px]" : "text-xs"
          )}
          dir="ltr"
        >
          {timeRange}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 line-clamp-2 min-w-0 break-words font-semibold leading-snug",
          compact ? "text-[11px]" : "text-xs"
        )}
      >
        {apt.serviceName}
        {apt.customerName ? ` - ${apt.customerName}` : ""}
      </p>
      <p
        className={cn(
          "mt-0.5 line-clamp-1 min-w-0 font-medium opacity-80",
          textClass,
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        {apt.staffName}
      </p>
    </button>
  );
}

function MobileAgendaClass({
  instance,
  dateLocale,
  staffVisual,
  staffFilter,
  compact,
  onClassClick,
}: {
  instance: ClassInstance;
  dateLocale: string;
  staffVisual: StaffCardVisual | undefined;
  staffFilter: string | null;
  compact?: boolean;
  onClassClick?: (ci: ClassInstance) => void;
}) {
  const vis = staffVisual
    ? getClassCardVisual(staffVisual.accent)
    : getClassCardVisual(instance.calendarColor);
  const start = new Date(instance.startTime);
  const end = new Date(instance.endTime);
  const booked = instance.bookedCount ?? 0;
  const dimmed = staffFilter !== null && staffFilter !== instance.staffId;
  const timeRange = `${formatTime(start, dateLocale)} – ${formatTime(end, dateLocale)}`;

  return (
    <button
      type="button"
      onClick={() => onClassClick?.(instance)}
      className={cn(
        "w-full rounded-md border-s-[3px] border-dashed text-start shadow-sm transition-all hover:brightness-[0.98] hover:shadow-md",
        compact ? "px-2 py-1.5" : "px-3 py-2.5",
        dimmed && "opacity-35"
      )}
      style={{
        backgroundColor: vis.bg,
        borderInlineStartColor: vis.accent,
        color: vis.text,
      }}
    >
      <div
        className={cn(
          "font-semibold tabular-nums leading-snug",
          compact ? "text-[11px]" : "text-xs"
        )}
        dir="ltr"
      >
        ⟳ {timeRange}
      </div>
      <p
        className={cn(
          "mt-1 line-clamp-2 min-w-0 break-words font-semibold leading-snug",
          compact ? "text-[11px]" : "text-xs"
        )}
      >
        {instance.serviceName}
      </p>
      <p
        className={cn(
          "mt-0.5 font-medium tabular-nums opacity-90",
          compact ? "text-[10px]" : "text-[11px]"
        )}
      >
        {booked}/{instance.maxParticipants}
      </p>
    </button>
  );
}
