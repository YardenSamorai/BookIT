"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff, ClassInstance } from "./calendar-types";
import {
  STAFF_COLORS,
  isSameDay,
  formatTime,
  getStatusStyle,
  CLASS_STYLE,
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

const MAX_VISIBLE_DESKTOP = 6;

export function WeekView({
  appointments,
  classInstances = [],
  staff,
  staffColorMap,
  staffFilter,
  currentDate,
  onAptClick,
  onClassClick,
  onDayClick,
}: WeekViewProps) {
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";
  const dayNames = isRtl ? DAY_NAMES_HE : DAY_NAMES_EN;
  const dayNamesFull = isRtl ? DAY_NAMES_HE_FULL : DAY_NAMES_EN;
  const today = new Date();
  const multiStaff = staff.length > 1;
  const manyProviders = staff.length >= 4;

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
      {/* ── Desktop: 7-column grid ── */}
      <div className="hidden md:grid md:grid-cols-7 md:gap-1.5">
        {weekDays.map((day, i) => {
          const isCurrentDay = isSameDay(day, today);
          const dayApts = appointmentsByDay.get(i) ?? [];
          const dayCIs = classInstancesByDay.get(i) ?? [];
          const total1on1 = dayApts.filter((a) => !a.classInstanceId).length;
          const pendingCount = dayApts.filter(
            (a) => a.status === "PENDING"
          ).length;
          const totalItems = total1on1 + dayCIs.length;
          const loadPct =
            totalItems > 0 ? Math.min(100, (totalItems / 10) * 100) : 0;

          return (
            <div
              key={i}
              className={`min-h-[180px] rounded-xl border p-1.5 transition-colors ${
                isCurrentDay
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {/* Day header */}
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className="mb-1.5 w-full text-center transition-colors hover:text-primary"
              >
                <p className="text-[10px] text-muted-foreground">
                  {dayNamesFull[day.getDay()]}
                </p>
                <p
                  className={`text-lg font-bold leading-none ${
                    isCurrentDay ? "text-primary" : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </p>
              </button>

              {/* Load bar */}
              {totalItems > 0 && (
                <div className="mb-1.5 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadPct > 90
                        ? "bg-red-400"
                        : loadPct > 70
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                    }`}
                    style={{ width: `${loadPct}%` }}
                  />
                </div>
              )}

              {/* Content: stacked or sub-columns */}
              {multiStaff && !manyProviders ? (
                <StaffSubColumns
                  staff={staff}
                  staffFilter={staffFilter}
                  staffColorMap={staffColorMap}
                  dayApts={dayApts}
                  dateLocale={dateLocale}
                  onAptClick={onAptClick}
                />
              ) : (
                <StackedItemsList
                  dayApts={dayApts}
                  dayCIs={dayCIs}
                  staff={staff}
                  staffColorMap={staffColorMap}
                  dateLocale={dateLocale}
                  multiStaff={multiStaff}
                  onAptClick={onAptClick}
                  onClassClick={onClassClick}
                />
              )}

              {/* Sub-columns mode: still render classes below */}
              {multiStaff && !manyProviders && dayCIs.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayCIs.map((ci) => (
                    <ClassChip
                      key={ci.id}
                      instance={ci}
                      dateLocale={dateLocale}
                      onClassClick={onClassClick}
                    />
                  ))}
                </div>
              )}

              {/* Summary footer */}
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground">
                <span>{total1on1} תורים</span>
                {dayCIs.length > 0 && (
                  <span>· {dayCIs.length} שיעורים</span>
                )}
                {pendingCount > 0 && (
                  <span className="font-semibold text-amber-600">
                    · {pendingCount} ממתינים
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: vertical day-card agenda ── */}
      <MobileWeekAgenda
        weekDays={weekDays}
        appointmentsByDay={appointmentsByDay}
        classInstancesByDay={classInstancesByDay}
        staff={staff}
        staffColorMap={staffColorMap}
        dateLocale={dateLocale}
        dayNames={dayNames}
        isRtl={isRtl}
        today={today}
        onAptClick={onAptClick}
        onClassClick={onClassClick}
        onDayClick={onDayClick}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Stacked items list — used for 4+ providers or single provider
// ---------------------------------------------------------------------------

function StackedItemsList({
  dayApts,
  dayCIs,
  staff,
  staffColorMap,
  dateLocale,
  multiStaff,
  onAptClick,
  onClassClick,
}: {
  dayApts: Appointment[];
  dayCIs: ClassInstance[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dateLocale: string;
  multiStaff: boolean;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
}) {
  const sorted = [...dayApts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const visible = sorted.slice(0, MAX_VISIBLE_DESKTOP);
  const overflow = sorted.length - MAX_VISIBLE_DESKTOP;

  return (
    <div className="space-y-0.5">
      {visible.map((apt) => {
        const style = getStatusStyle(apt.status);
        const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
        const start = new Date(apt.startTime);

        return (
          <button
            key={apt.id}
            type="button"
            onClick={() => onAptClick(apt)}
            className={`flex w-full items-center gap-1 rounded border-s-2 ${style.border} px-1 py-0.5 text-start text-[10px] leading-tight transition-opacity hover:opacity-80 ${style.bg}`}
          >
            <span className={`size-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className={`font-semibold tabular-nums ${style.text}`}>
              {formatTime(start, dateLocale)}
            </span>
            <span className={`truncate ${style.text} opacity-75`}>
              {apt.serviceName}
            </span>
            {multiStaff && (
              <span className="shrink-0 ms-auto flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: clr.border }}
                />
                {apt.staffName.split(" ")[0]}
              </span>
            )}
          </button>
        );
      })}

      {overflow > 0 && (
        <p className="text-center text-[10px] text-muted-foreground">
          +{overflow}
        </p>
      )}

      {dayCIs.map((ci) => (
        <ClassChip
          key={ci.id}
          instance={ci}
          dateLocale={dateLocale}
          onClassClick={onClassClick}
        />
      ))}

      {dayApts.length === 0 && dayCIs.length === 0 && (
        <p className="py-3 text-center text-[10px] text-muted-foreground/50">
          —
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff sub-columns — used for 2-3 providers
// ---------------------------------------------------------------------------

function StaffSubColumns({
  staff,
  staffFilter,
  staffColorMap,
  dayApts,
  dateLocale,
  onAptClick,
}: {
  staff: Staff[];
  staffFilter: string | null;
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dayApts: Appointment[];
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {staff.map((s) => {
        const clr = staffColorMap.get(s.id) ?? STAFF_COLORS[0];
        const dimmed = staffFilter !== null && staffFilter !== s.id;
        const staffApts = dayApts.filter((a) => a.staffId === s.id);

        return (
          <div
            key={s.id}
            className={`flex-1 min-w-0 transition-opacity ${dimmed ? "opacity-30" : ""}`}
          >
            <div
              className="mb-1 flex items-center justify-center gap-0.5 rounded-md py-0.5"
              style={{ backgroundColor: `${clr.border}18` }}
            >
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: clr.border }}
              />
              <span
                className="text-[9px] font-medium truncate"
                style={{ color: clr.text }}
              >
                {staff.length > 3 ? s.name.charAt(0) : s.name.split(" ")[0]}
              </span>
            </div>

            <div className="space-y-0.5">
              {staffApts.map((apt) => {
                const style = getStatusStyle(apt.status);
                const start = new Date(apt.startTime);
                return (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => onAptClick(apt)}
                    className={`w-full rounded border-s-2 ${style.border} px-1 py-0.5 text-start text-[9px] leading-tight shadow-sm transition-shadow hover:shadow-md ${style.bg}`}
                  >
                    <p className={`font-semibold tabular-nums truncate ${style.text}`}>
                      <span className={`inline-block size-1 rounded-full ${style.dot} me-0.5`} />
                      {formatTime(start, dateLocale)}
                    </p>
                    <p className={`truncate opacity-75 ${style.text}`}>
                      {apt.serviceName}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Class chip (compact)
// ---------------------------------------------------------------------------

function ClassChip({
  instance,
  dateLocale,
  onClassClick,
}: {
  instance: ClassInstance;
  dateLocale: string;
  onClassClick?: (ci: ClassInstance) => void;
}) {
  const start = new Date(instance.startTime);
  const booked = instance.bookedCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onClassClick?.(instance)}
      className={`flex w-full items-center gap-1 rounded border-s-2 border-dashed px-1 py-0.5 text-start text-[10px] leading-tight transition-opacity hover:opacity-80 ${CLASS_STYLE.bg} ${CLASS_STYLE.border}`}
      style={{ borderColor: "#8B5CF6" }}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${CLASS_STYLE.dot}`} />
      <span className={`font-semibold tabular-nums ${CLASS_STYLE.text}`}>
        {formatTime(start, dateLocale)}
      </span>
      <span className={`truncate ${CLASS_STYLE.text} opacity-75`}>
        ⟳ {instance.serviceName}
      </span>
      <span className={`shrink-0 text-[9px] ${CLASS_STYLE.text} opacity-60`}>
        {booked}/{instance.maxParticipants}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mobile week agenda — vertical collapsible day cards
// ---------------------------------------------------------------------------

function MobileWeekAgenda({
  weekDays,
  appointmentsByDay,
  classInstancesByDay,
  staff,
  staffColorMap,
  dateLocale,
  dayNames,
  isRtl,
  today,
  onAptClick,
  onClassClick,
  onDayClick,
}: {
  weekDays: Date[];
  appointmentsByDay: Map<number, Appointment[]>;
  classInstancesByDay: Map<number, ClassInstance[]>;
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dateLocale: string;
  dayNames: string[];
  isRtl: boolean;
  today: Date;
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
        const total = dayApts.filter((a) => !a.classInstanceId).length + dayCIs.length;
        const pendingCount = dayApts.filter(
          (a) => a.status === "PENDING"
        ).length;
        const multiStaff = staff.length > 1;

        return (
          <div
            key={i}
            className={`rounded-xl border overflow-hidden transition-colors ${
              isCurrentDay
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            {/* Collapsed header — always visible */}
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
                  className={`mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrentDay
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{total} פריטים</span>
                  {pendingCount > 0 && (
                    <span className="font-semibold text-amber-600">
                      {pendingCount} ממתינים
                    </span>
                  )}
                </div>
                {/* Mini load bar */}
                {total > 0 && (
                  <div className="mt-1 h-1 w-24 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        total > 8
                          ? "bg-red-400"
                          : total > 5
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                      }`}
                      style={{
                        width: `${Math.min(100, (total / 10) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              {isOpen ? (
                <ChevronUp className="size-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                {dayApts.length === 0 && dayCIs.length === 0 && (
                  <p className="py-2 text-sm text-muted-foreground/50 text-center">
                    אין תורים
                  </p>
                )}

                {[...dayApts]
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime()
                  )
                  .map((apt) => {
                    const style = getStatusStyle(apt.status);
                    const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
                    const start = new Date(apt.startTime);

                    return (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={() => onAptClick(apt)}
                        className={`flex w-full items-center gap-2 rounded-lg border-s-[3px] ${style.border} ${style.bg} p-2 text-start transition-shadow active:shadow-md`}
                      >
                        <span className={`size-2 rounded-full shrink-0 ${style.dot}`} />
                        <span className={`font-semibold tabular-nums text-xs ${style.text}`}>
                          {formatTime(start, dateLocale)}
                        </span>
                        <span className={`text-xs truncate ${style.text}`}>
                          {apt.serviceName}
                        </span>
                        {multiStaff && (
                          <span className="shrink-0 ms-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: clr.border }}
                            />
                            {apt.staffName.split(" ")[0]}
                          </span>
                        )}
                      </button>
                    );
                  })}

                {dayCIs.map((ci) => {
                  const start = new Date(ci.startTime);
                  const booked = ci.bookedCount ?? 0;

                  return (
                    <button
                      key={ci.id}
                      type="button"
                      onClick={() => onClassClick?.(ci)}
                      className={`flex w-full items-center gap-2 rounded-lg border-s-[3px] border-dashed ${CLASS_STYLE.border} ${CLASS_STYLE.bg} p-2 text-start transition-shadow active:shadow-md`}
                      style={{ borderColor: "#8B5CF6" }}
                    >
                      <span className={`size-2 rounded-full shrink-0 ${CLASS_STYLE.dot}`} />
                      <span className={`font-semibold tabular-nums text-xs ${CLASS_STYLE.text}`}>
                        {formatTime(start, dateLocale)}
                      </span>
                      <span className={`text-xs truncate ${CLASS_STYLE.text}`}>
                        ⟳ {ci.serviceName}
                      </span>
                      <span className={`shrink-0 text-[10px] ${CLASS_STYLE.text} opacity-70`}>
                        {booked}/{ci.maxParticipants}
                      </span>
                    </button>
                  );
                })}

                {/* Drill-down link */}
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:bg-muted/50"
                >
                  צפייה ביום מלא
                  <ChevronLeft
                    className={`size-3 ${isRtl ? "" : "rotate-180"}`}
                  />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
