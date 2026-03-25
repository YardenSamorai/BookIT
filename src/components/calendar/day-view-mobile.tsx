"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  Appointment,
  Staff,
  ClassInstance,
  StaffDaySchedule,
  BlockedSlot,
  TimeOffPeriod,
  BusinessHoursEntry,
} from "./calendar-types";
import {
  STAFF_COLORS,
  isSameDay,
  formatTime,
  getHoursInTz,
  getMinutesInTz,
  getStatusStyle,
  getClassCardVisual,
  getStaffScheduleForDay,
  getBlockedSlotsForStaffDay,
  isStaffOnTimeOff,
  timeToMinutes,
} from "./calendar-types";

interface DayViewMobileProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  staffSchedules?: StaffDaySchedule[];
  staffBlockedSlots?: BlockedSlot[];
  staffTimeOff?: TimeOffPeriod[];
  businessHours?: BusinessHoursEntry[];
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onAddClick?: () => void;
}

type TimelineEntry =
  | { type: "appointment"; data: Appointment }
  | { type: "class"; data: ClassInstance }
  | { type: "gap"; startMins: number; endMins: number }
  | { type: "break"; startMins: number; endMins: number; reason: string | null }
  | { type: "off-hours"; startMins: number; endMins: number }
  | { type: "day-off"; reason: string | null };

export function DayViewMobile({
  appointments,
  classInstances = [],
  staff,
  staffSchedules = [],
  staffBlockedSlots = [],
  staffTimeOff = [],
  businessHours = [],
  currentDate,
  onAptClick,
  onClassClick,
  onAddClick,
}: DayViewMobileProps) {
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const multiStaff = staff.length > 1;

  const showAllPill = multiStaff && staff.length <= 3;
  const [activeStaffId, setActiveStaffId] = useState<string | null>(
    multiStaff ? staff[0]?.id ?? null : null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Day-scoped data ─────────────────────────────────────
  const dayApts = useMemo(() => {
    return appointments.filter((a) =>
      isSameDay(new Date(a.startTime), currentDate)
    );
  }, [appointments, currentDate]);

  const dayClasses = useMemo(() => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    return classInstances.filter(
      (ci) => ci.date === dateStr && ci.status === "SCHEDULED"
    );
  }, [classInstances, currentDate]);

  const dateStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  }, [currentDate]);

  // ── Build timeline entries for the active provider ───────
  const timeline = useMemo((): TimelineEntry[] => {
    const dow = currentDate.getDay();
    const isAll = activeStaffId === null;

    if (isAll) {
      type EventEntry =
        | { type: "appointment"; data: Appointment }
        | { type: "class"; data: ClassInstance };
      const allItems: EventEntry[] = [
        ...dayApts.map((a) => ({ type: "appointment" as const, data: a })),
        ...dayClasses.map((c) => ({ type: "class" as const, data: c })),
      ];
      allItems.sort((a, b) => {
        return (
          new Date(a.data.startTime).getTime() -
          new Date(b.data.startTime).getTime()
        );
      });
      return allItems;
    }

    const staffId = activeStaffId;
    const isOff = isStaffOnTimeOff(staffId, dateStr, staffTimeOff);
    if (isOff) {
      const offEntry = staffTimeOff.find(
        (to) =>
          to.staffId === staffId &&
          dateStr >= to.startDate &&
          dateStr <= to.endDate
      );
      return [{ type: "day-off", reason: offEntry?.reason ?? null }];
    }

    const schedule = getStaffScheduleForDay(staffId, dow, staffSchedules);
    const blocked = getBlockedSlotsForStaffDay(
      staffId,
      currentDate,
      staffBlockedSlots
    );
    const staffApts = dayApts.filter((a) => a.staffId === staffId);
    const staffClasses = dayClasses.filter((c) => c.staffId === staffId);

    let workStart = 7 * 60;
    let workEnd = 22 * 60;
    if (schedule) {
      workStart = timeToMinutes(schedule.startTime);
      workEnd = timeToMinutes(schedule.endTime);
    } else {
      const bh = businessHours.find((b) => b.dayOfWeek === dow && b.isOpen);
      if (bh) {
        workStart = timeToMinutes(bh.startTime);
        workEnd = timeToMinutes(bh.endTime);
      }
    }

    // Collect all "occupied" intervals
    type Interval = {
      startMins: number;
      endMins: number;
      entry: TimelineEntry;
    };
    const intervals: Interval[] = [];

    for (const apt of staffApts) {
      const s = new Date(apt.startTime);
      const e = new Date(apt.endTime);
      intervals.push({
        startMins: getHoursInTz(s) * 60 + getMinutesInTz(s),
        endMins: getHoursInTz(e) * 60 + getMinutesInTz(e),
        entry: { type: "appointment", data: apt },
      });
    }
    for (const ci of staffClasses) {
      const s = new Date(ci.startTime);
      const e = new Date(ci.endTime);
      intervals.push({
        startMins: getHoursInTz(s) * 60 + getMinutesInTz(s),
        endMins: getHoursInTz(e) * 60 + getMinutesInTz(e),
        entry: { type: "class", data: ci },
      });
    }
    for (const b of blocked) {
      intervals.push({
        startMins: getHoursInTz(b.startTime) * 60 + getMinutesInTz(b.startTime),
        endMins: getHoursInTz(b.endTime) * 60 + getMinutesInTz(b.endTime),
        entry: { type: "break", startMins: 0, endMins: 0, reason: b.reason },
      });
    }

    intervals.sort((a, b) => a.startMins - b.startMins);

    const result: TimelineEntry[] = [];
    let cursor = workStart;

    for (const iv of intervals) {
      if (iv.startMins > cursor) {
        const gapMins = iv.startMins - cursor;
        if (gapMins >= 5) {
          result.push({
            type: "gap",
            startMins: cursor,
            endMins: iv.startMins,
          });
        }
      }
      if (iv.entry.type === "break") {
        iv.entry.startMins = iv.startMins;
        iv.entry.endMins = iv.endMins;
      }
      result.push(iv.entry);
      cursor = Math.max(cursor, iv.endMins);
    }

    if (cursor < workEnd) {
      result.push({ type: "gap", startMins: cursor, endMins: workEnd });
    }

    return result;
  }, [
    activeStaffId,
    dayApts,
    dayClasses,
    currentDate,
    dateStr,
    staffSchedules,
    staffBlockedSlots,
    staffTimeOff,
    businessHours,
  ]);

  // ── Provider pill navigation ────────────────────────────
  const staffIdx = staff.findIndex((s) => s.id === activeStaffId);

  function goNext() {
    if (showAllPill && activeStaffId === null) {
      setActiveStaffId(staff[0]?.id ?? null);
    } else {
      const nextIdx = (staffIdx + 1) % staff.length;
      setActiveStaffId(staff[nextIdx].id);
    }
  }

  function goPrev() {
    if (staffIdx <= 0) {
      if (showAllPill) {
        setActiveStaffId(null);
      } else {
        setActiveStaffId(staff[staff.length - 1].id);
      }
    } else {
      setActiveStaffId(staff[staffIdx - 1].id);
    }
  }

  const noItems =
    timeline.length === 0 ||
    (timeline.length === 1 && timeline[0].type === "gap");

  return (
    <div className="md:hidden flex flex-col">
      {/* ── Provider pills (sticky) ─────────────────────── */}
      {multiStaff && (
        <div className="sticky top-[108px] z-20 -mx-1 bg-background/95 backdrop-blur-sm px-1 py-2 border-b border-border/30">
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
            ref={scrollRef}
          >
            {showAllPill && (
              <button
                onClick={() => setActiveStaffId(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeStaffId === null
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
                הכל
              </button>
            )}
            {staff.map((s, i) => {
              const clr = STAFF_COLORS[i % STAFF_COLORS.length];
              const active = activeStaffId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStaffId(s.id)}
                  className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "ring-1 ring-offset-1"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: clr.bg,
                          color: clr.text,
                          // @ts-expect-error CSS var
                          "--tw-ring-color": clr.border,
                        }
                      : undefined
                  }
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: clr.border }}
                  />
                  {s.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Timeline content ────────────────────────────── */}
      <div className="flex-1 space-y-2 py-3 px-1">
        {noItems && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              אין תורים מתוכננים
            </p>
            {onAddClick && (
              <button
                onClick={onAddClick}
                className="mt-3 flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="size-4" />
                הוסף תור
              </button>
            )}
          </div>
        )}

        {timeline.map((entry, idx) => {
          if (entry.type === "day-off") {
            return (
              <div
                key="day-off"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="rounded-lg bg-gray-100 px-6 py-4">
                  <p className="text-sm font-medium text-gray-500">יום חופש</p>
                  {entry.reason && (
                    <p className="mt-1 text-xs text-gray-400">
                      {entry.reason}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          if (entry.type === "gap") {
            const gapMins = entry.endMins - entry.startMins;
            if (gapMins < 10) return null;
            return (
              <div
                key={`gap-${idx}`}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                  {minsToTimeStr(entry.startMins)} –{" "}
                  {minsToTimeStr(entry.endMins)} · פנוי {gapMins} דק׳
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
            );
          }

          if (entry.type === "break") {
            return (
              <div
                key={`break-${idx}`}
                className="mx-2 rounded-lg px-3 py-2 text-xs"
                style={{
                  background:
                    "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.03) 4px, rgba(0,0,0,0.03) 8px)",
                }}
              >
                <span className="font-medium text-gray-400">
                  {minsToTimeStr(entry.startMins)} –{" "}
                  {minsToTimeStr(entry.endMins)} ·{" "}
                  {entry.reason || "הפסקה"}
                </span>
              </div>
            );
          }

          if (entry.type === "appointment") {
            return (
              <MobileAptCard
                key={entry.data.id}
                apt={entry.data}
                staff={staff}
                dateLocale={dateLocale}
                showProvider={activeStaffId === null}
                onClick={() => onAptClick(entry.data)}
              />
            );
          }

          if (entry.type === "class") {
            return (
              <MobileClassCard
                key={entry.data.id}
                instance={entry.data}
                dateLocale={dateLocale}
                onClick={() => onClassClick?.(entry.data)}
              />
            );
          }

          return null;
        })}
      </div>

      {/* ── FAB ─────────────────────────────────────────── */}
      {onAddClick && (
        <button
          onClick={onAddClick}
          className="fixed bottom-6 end-6 z-30 flex size-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 text-primary-foreground transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile appointment card
// ---------------------------------------------------------------------------

function MobileAptCard({
  apt,
  staff,
  dateLocale,
  showProvider,
  onClick,
}: {
  apt: Appointment;
  staff: Staff[];
  dateLocale: string;
  showProvider: boolean;
  onClick: () => void;
}) {
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const durationMins = Math.round(
    (end.getTime() - start.getTime()) / 60_000
  );
  const style = getStatusStyle(apt.status);

  const staffIdx = staff.findIndex((s) => s.id === apt.staffId);
  const staffClr = STAFF_COLORS[staffIdx >= 0 ? staffIdx % STAFF_COLORS.length : 0];

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border-s-[3px] ${style.border} ${style.bg} p-3 text-start transition-shadow active:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-sm">
            <span className={`size-2 rounded-full shrink-0 ${style.dot}`} />
            <span className={`font-semibold ${style.text}`}>
              {formatTime(start, dateLocale)} – {formatTime(end, dateLocale)}
            </span>
            <span className="text-xs text-muted-foreground">
              · {durationMins}m
            </span>
          </p>
          <p className={`text-sm font-bold mt-0.5 ${style.text}`}>
            {apt.serviceName}
          </p>
          {apt.customerName && (
            <p className={`text-xs mt-0.5 ${style.text} opacity-75`}>
              {apt.customerName}
            </p>
          )}
          {showProvider && (
            <p className="flex items-center gap-1 text-xs mt-0.5 text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: staffClr.border }}
              />
              {apt.staffName}
            </p>
          )}
        </div>
        {(apt.status === "PENDING" || apt.status === "NO_SHOW") && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${style.text} ${style.bg} border ${style.border}`}
          >
            {style.label}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mobile class card
// ---------------------------------------------------------------------------

function MobileClassCard({
  instance,
  dateLocale,
  onClick,
}: {
  instance: ClassInstance;
  dateLocale: string;
  onClick: () => void;
}) {
  const start = new Date(instance.startTime);
  const end = new Date(instance.endTime);
  const booked = instance.bookedCount ?? 0;
  const isFull = booked >= instance.maxParticipants;
  const vis = getClassCardVisual(instance.calendarColor);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border-s-[3px] border-dashed p-3 text-start transition-shadow active:shadow-md"
      style={{
        backgroundColor: vis.bg,
        borderInlineStartColor: vis.accent,
        color: vis.text,
      }}
    >
      <p className="flex items-center gap-1.5 text-sm">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: vis.accent }} />
        <span className="font-semibold">
          {formatTime(start, dateLocale)} – {formatTime(end, dateLocale)}
        </span>
      </p>
      <p className="mt-0.5 text-sm font-bold">⟳ {instance.serviceName}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div
          className="h-1.5 max-w-32 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: vis.capacityTrack }}
        >
          <div
            className={`h-full rounded-full ${isFull ? "bg-red-400" : ""}`}
            style={{
              width: `${Math.min(100, (booked / instance.maxParticipants) * 100)}%`,
              ...(isFull ? {} : { backgroundColor: vis.capacityFill }),
            }}
          />
        </div>
        <span className={`text-xs font-semibold tabular-nums ${isFull ? "text-red-600" : ""}`}>
          {booked}/{instance.maxParticipants}
        </span>
        {isFull && (
          <span className="rounded bg-red-100 px-1 text-[9px] font-bold text-red-600">
            FULL
          </span>
        )}
      </div>
    </button>
  );
}

function minsToTimeStr(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
