"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import type { Appointment, Staff, ClassInstance } from "./calendar-types";
import {
  STAFF_COLORS,
  isSameDay,
  formatTime,
  getStatusStyle,
  CLASS_STYLE,
  getClassCardVisual,
} from "./calendar-types";

interface WeekViewProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
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

/** Desktop week grid height: fixed band so each day column scrolls independently */
const DESKTOP_WEEK_GRID_CLASS =
  "h-[min(70vh,640px)] min-h-[280px] max-h-[calc(100vh-13rem)]";

type WeekRowItem =
  | { kind: "appointment"; data: Appointment }
  | { kind: "class"; data: ClassInstance };

function buildSortedDayItems(
  dayApts: Appointment[],
  dayCIs: ClassInstance[]
): WeekRowItem[] {
  const rows: WeekRowItem[] = [
    ...dayApts.map((a) => ({ kind: "appointment" as const, data: a })),
    ...dayCIs.map((c) => ({ kind: "class" as const, data: c })),
  ];
  rows.sort((a, b) => {
    const ta =
      a.kind === "appointment"
        ? new Date(a.data.startTime).getTime()
        : new Date(a.data.startTime).getTime();
    const tb =
      b.kind === "appointment"
        ? new Date(b.data.startTime).getTime()
        : new Date(b.data.startTime).getTime();
    return ta - tb;
  });
  return rows;
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
  staffColorMap: _staffColorMap,
  staffFilter,
  currentDate,
  onAptClick,
  onClassClick,
  onDayClick,
}: WeekViewProps) {
  // Props kept for API compatibility with CalendarShell; week board is day-first (no staff columns).
  void _staff;
  void _staffColorMap;
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
        const dayStr = `${weekDays[i].getFullYear()}-${String(weekDays[i].getMonth() + 1).padStart(2, "0")}-${String(weekDays[i].getDate()).padStart(2, "0")}`;
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

  return (
    <>
      {/* ── Desktop: 7 schedule columns, per-column scroll ── */}
      <div
        className={cn("hidden md:grid md:grid-cols-7 md:gap-2", DESKTOP_WEEK_GRID_CLASS)}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {weekDays.map((day, i) => {
          const isCurrentDay = isSameDay(day, today);
          const dayApts = appointmentsByDay.get(i) ?? [];
          const dayCIs = classInstancesByDay.get(i) ?? [];
          const items = buildSortedDayItems(dayApts, dayCIs);
          const total1on1 = dayApts.filter((a) => !a.classInstanceId).length;
          const pendingCount = dayApts.filter((a) => a.status === "PENDING").length;

          return (
            <DayScheduleColumn
              key={i}
              day={day}
              isCurrentDay={isCurrentDay}
              dayNamesFull={dayNamesFull}
              items={items}
              total1on1={total1on1}
              classCount={dayCIs.length}
              pendingCount={pendingCount}
              staffFilter={staffFilter}
              dateLocale={dateLocale}
              t={t}
              onAptClick={onAptClick}
              onClassClick={onClassClick}
              onDayClick={onDayClick}
            />
          );
        })}
      </div>

      <MobileWeekAgenda
        weekDays={weekDays}
        appointmentsByDay={appointmentsByDay}
        classInstancesByDay={classInstancesByDay}
        dateLocale={dateLocale}
        dayNames={dayNames}
        isRtl={isRtl}
        today={today}
        staffFilter={staffFilter}
        t={t}
        onAptClick={onAptClick}
        onClassClick={onClassClick}
        onDayClick={onDayClick}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Desktop: one day column (sticky header + scroll body + footer)
// ---------------------------------------------------------------------------

function DayScheduleColumn({
  day,
  isCurrentDay,
  dayNamesFull,
  items,
  total1on1,
  classCount,
  pendingCount,
  staffFilter,
  dateLocale,
  t,
  onAptClick,
  onClassClick,
  onDayClick,
}: {
  day: Date;
  isCurrentDay: boolean;
  dayNamesFull: string[];
  items: WeekRowItem[];
  total1on1: number;
  classCount: number;
  pendingCount: number;
  staffFilter: string | null;
  dateLocale: string;
  t: (key: import("@/lib/i18n").TranslationKey, vars?: Record<string, string | number>) => string;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onDayClick: (date: Date) => void;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card transition-colors",
        isCurrentDay ? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/15" : "border-border"
      )}
    >
      <button
        type="button"
        onClick={() => onDayClick(day)}
        className="shrink-0 border-b border-border/60 bg-muted/30 px-1 py-2 text-center transition-colors hover:bg-muted/50"
      >
        <p className="text-[10px] font-medium text-muted-foreground">
          {dayNamesFull[day.getDay()]}
        </p>
        <p
          className={cn(
            "mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-base font-bold leading-none",
            isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
          )}
        >
          {day.getDate()}
        </p>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-1.5 py-2">
        <div className="flex flex-col gap-1.5">
          {items.length === 0 && (
            <p className="py-6 text-center text-[11px] text-muted-foreground/50">—</p>
          )}
          {items.map((row) =>
            row.kind === "appointment" ? (
              <ScheduleBoardCard
                key={`a-${row.data.id}`}
                variant="desktop"
                row={row}
                dateLocale={dateLocale}
                staffFilter={staffFilter}
                t={t}
                onAptClick={onAptClick}
                onClassClick={onClassClick}
              />
            ) : (
              <ScheduleBoardCard
                key={`c-${row.data.id}`}
                variant="desktop"
                row={row}
                dateLocale={dateLocale}
                staffFilter={staffFilter}
                t={t}
                onAptClick={onAptClick}
                onClassClick={onClassClick}
              />
            )
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 px-1 py-1.5 text-center text-[9px] leading-tight text-muted-foreground">
        <span>
          {t("cal.week_footer_bookings", { n: total1on1 })}
          {classCount > 0 && (
            <>
              {" · "}
              {t("cal.week_footer_classes", { n: classCount })}
            </>
          )}
        </span>
        {pendingCount > 0 && (
          <span className="mt-0.5 block font-semibold text-amber-600">
            {t("cal.week_footer_pending", { n: pendingCount })}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared booking / class card (dense board style)
// ---------------------------------------------------------------------------

function ScheduleBoardCard({
  variant,
  row,
  dateLocale,
  staffFilter,
  t,
  onAptClick,
  onClassClick,
}: {
  variant: "desktop" | "mobile";
  row: WeekRowItem;
  dateLocale: string;
  staffFilter: string | null;
  t: (key: import("@/lib/i18n").TranslationKey, vars?: Record<string, string | number>) => string;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
}) {
  const pad = variant === "desktop" ? "px-2.5 py-2" : "px-3 py-2.5";
  const titleSize = variant === "desktop" ? "text-[11px]" : "text-xs";
  const metaSize = variant === "desktop" ? "text-[10px]" : "text-[11px]";

  if (row.kind === "class") {
    const ci = row.data;
    const vis = getClassCardVisual(ci.calendarColor);
    const start = new Date(ci.startTime);
    const end = new Date(ci.endTime);
    const booked = ci.bookedCount ?? 0;
    const dimmed = staffFilter !== null && staffFilter !== ci.staffId;
    const timeRange = `${formatTime(start, dateLocale)} – ${formatTime(end, dateLocale)}`;

    return (
      <button
        type="button"
        onClick={() => onClassClick?.(ci)}
        title={[timeRange, ci.serviceName, `${booked}/${ci.maxParticipants}`, ci.staffName].join(" · ")}
        className={cn(
          "w-full rounded-md border-s-[3px] border-dashed text-start shadow-sm transition-all hover:brightness-[0.98] hover:shadow-md",
          pad,
          dimmed && "opacity-35"
        )}
        style={{
          backgroundColor: vis.bg,
          borderInlineStartColor: vis.accent,
          borderInlineEndWidth: 0,
          color: vis.text,
        }}
      >
        <div className={cn("font-semibold tabular-nums leading-snug", titleSize)} dir="ltr">
          {timeRange}
        </div>
        <p className={cn("mt-1 line-clamp-2 min-w-0 break-words font-semibold leading-snug", titleSize)}>
          {ci.serviceName}
        </p>
        <p className={cn("mt-1 font-medium tabular-nums", metaSize, "opacity-90")}>
          {booked}/{ci.maxParticipants}
        </p>
        <p className={cn("mt-0.5 line-clamp-1 min-w-0 font-medium", metaSize, "opacity-80")}>
          {ci.staffName}
        </p>
      </button>
    );
  }

  const apt = row.data;
  const style = getStatusStyle(apt.status);
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const dimmed = staffFilter !== null && staffFilter !== apt.staffId;
  const timeRange = `${formatTime(start, dateLocale)} – ${formatTime(end, dateLocale)}`;

  const metaLine = apt.classInstanceId
    ? apt.customerName?.trim() || t("cal.week_group_slot")
    : appointmentStatusLabel(apt.status, t);

  const hoverTitle = [timeRange, apt.serviceName, metaLine, apt.staffName].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={() => onAptClick(apt)}
      title={hoverTitle}
      className={cn(
        "w-full rounded-md border-s-[3px] text-start shadow-sm transition-all hover:brightness-[0.98] hover:shadow-md",
        pad,
        style.bg,
        style.border,
        style.text,
        dimmed && "opacity-35"
      )}
    >
      <div className={cn("flex items-center gap-1.5")}>
        <span className={cn("size-1.5 shrink-0 rounded-full", style.dot)} aria-hidden />
        <span className={cn("font-semibold tabular-nums leading-snug", titleSize)} dir="ltr">
          {timeRange}
        </span>
      </div>
      <p className={cn("mt-1 line-clamp-2 min-w-0 break-words font-semibold leading-snug", titleSize)}>
        {apt.serviceName}
      </p>
      <p className={cn("mt-1 line-clamp-1 min-w-0 font-medium", metaSize, "opacity-90")}>{metaLine}</p>
      <p className={cn("mt-0.5 line-clamp-1 min-w-0 font-medium", metaSize, "opacity-75")}>
        {apt.staffName}
      </p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mobile: collapsible days, same card component
// ---------------------------------------------------------------------------

function MobileWeekAgenda({
  weekDays,
  appointmentsByDay,
  classInstancesByDay,
  dateLocale,
  dayNames,
  isRtl,
  today,
  staffFilter,
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
  isRtl: boolean;
  today: Date;
  staffFilter: string | null;
  t: (key: import("@/lib/i18n").TranslationKey, vars?: Record<string, string | number>) => string;
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
        const items = buildSortedDayItems(dayApts, dayCIs);
        const isOpen = expanded.has(i);
        const total1on1 = dayApts.filter((a) => !a.classInstanceId).length;
        const pendingCount = dayApts.filter((a) => a.status === "PENDING").length;
        const totalItems = total1on1 + dayCIs.length;

        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-xl border transition-colors",
              isCurrentDay ? "border-primary/30 bg-primary/5" : "border-border bg-card"
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
                    isCurrentDay ? "bg-primary text-primary-foreground" : "text-foreground"
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
                {items.length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground/50">
                    {t("cal.week_empty_day")}
                  </p>
                )}

                {items.map((row) => (
                  <ScheduleBoardCard
                    key={row.kind === "appointment" ? `a-${row.data.id}` : `c-${row.data.id}`}
                    variant="mobile"
                    row={row}
                    dateLocale={dateLocale}
                    staffFilter={staffFilter}
                    t={t}
                    onAptClick={onAptClick}
                    onClassClick={onClassClick}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/50"
                >
                  {t("cal.week_open_full_day")}
                  <ChevronLeft className={cn("size-3", !isRtl && "rotate-180")} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
