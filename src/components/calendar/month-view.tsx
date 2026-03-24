"use client";

import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff, ClassInstance } from "./calendar-types";
import { STAFF_COLORS, isSameDay } from "./calendar-types";

interface MonthViewProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onDayClick: (date: Date) => void;
}

const DAY_HEADERS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_HEADERS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const DAY_NAMES_HE_SHORT = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

type DaySummary = {
  date: Date;
  aptCount: number;
  classCount: number;
  pendingCount: number;
  loadPct: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export function MonthView({
  appointments,
  classInstances = [],
  staff,
  staffColorMap,
  currentDate,
  onAptClick,
  onClassClick,
  onDayClick,
}: MonthViewProps) {
  const locale = useLocale();
  const isRtl = locale === "he";
  const dayHeaders = isRtl ? DAY_HEADERS_HE : DAY_HEADERS_EN;
  const today = new Date();

  const { weeks, month, daySummaries } = useMemo(() => {
    const year = currentDate.getFullYear();
    const mo = currentDate.getMonth();
    const first = new Date(year, mo, 1);
    const startDow = first.getDay();

    const calStart = new Date(first);
    calStart.setDate(calStart.getDate() - startDow);

    const rows: Date[][] = [];
    const cursor = new Date(calStart);
    for (let w = 0; w < 6; w++) {
      const row: Date[] = [];
      for (let d = 0; d < 7; d++) {
        row.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      if (w === 5 && row[0].getMonth() !== mo) break;
      rows.push(row);
    }

    // Build day summaries
    const aptsByKey = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const d = new Date(apt.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = aptsByKey.get(key) ?? [];
      list.push(apt);
      aptsByKey.set(key, list);
    }

    const cisByKey = new Map<string, ClassInstance[]>();
    for (const ci of classInstances) {
      if (ci.status !== "SCHEDULED") continue;
      const d = new Date(ci.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = cisByKey.get(key) ?? [];
      list.push(ci);
      cisByKey.set(key, list);
    }

    const summaries = new Map<string, DaySummary>();
    for (const week of rows) {
      for (const day of week) {
        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
        const dayApts = aptsByKey.get(key) ?? [];
        const dayCIs = cisByKey.get(key) ?? [];
        const oneToOne = dayApts.filter((a) => !a.classInstanceId);
        const pendingCount = oneToOne.filter(
          (a) => a.status === "PENDING"
        ).length;
        const total = oneToOne.length + dayCIs.length;
        summaries.set(key, {
          date: day,
          aptCount: oneToOne.length,
          classCount: dayCIs.length,
          pendingCount,
          loadPct: total > 0 ? Math.min(100, (total / 10) * 100) : 0,
          isCurrentMonth: day.getMonth() === mo,
          isToday: isSameDay(day, today),
        });
      }
    }

    return { weeks: rows, month: mo, daySummaries: summaries };
  }, [currentDate, appointments, classInstances]);

  return (
    <>
      {/* ── Desktop: 7-column grid ── */}
      <div className="hidden md:block overflow-hidden rounded-xl border bg-card shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {dayHeaders.map((dh) => (
            <div
              key={dh}
              className="py-2 text-center text-xs font-semibold text-muted-foreground"
            >
              {dh}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-0">
            {week.map((day, di) => {
              const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const summary = daySummaries.get(key);
              if (!summary) return <div key={di} />;

              const total = summary.aptCount + summary.classCount;
              const hasItems = total > 0;

              return (
                <button
                  key={di}
                  type="button"
                  onClick={() => onDayClick(day)}
                  className={`min-h-[80px] border-e last:border-0 p-1.5 text-start transition-colors hover:bg-muted/30 ${
                    summary.isToday ? "bg-primary/5" : ""
                  } ${!summary.isCurrentMonth ? "bg-muted/10" : ""}`}
                >
                  {/* Date number */}
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        summary.isToday
                          ? "text-primary"
                          : summary.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/40"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {summary.pendingCount > 0 && (
                      <span className="size-1.5 rounded-full bg-amber-500" />
                    )}
                  </div>

                  {/* Load bar */}
                  {hasItems && (
                    <div className="mb-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          summary.loadPct > 90
                            ? "bg-red-400"
                            : summary.loadPct > 70
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                        style={{ width: `${summary.loadPct}%` }}
                      />
                    </div>
                  )}

                  {/* Count badges */}
                  {hasItems && (
                    <div className="flex flex-wrap gap-1">
                      {summary.aptCount > 0 && (
                        <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                          {summary.aptCount} תורים
                        </span>
                      )}
                      {summary.classCount > 0 && (
                        <span className="rounded bg-violet-100 px-1 py-0.5 text-[9px] font-medium text-violet-700">
                          {summary.classCount} שיעורים
                        </span>
                      )}
                      {summary.pendingCount > 0 && (
                        <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold text-amber-700">
                          {summary.pendingCount} ממתינים
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Mobile: vertical day-summary list ── */}
      <div className="flex flex-col gap-1.5 md:hidden">
        {weeks.flat().filter((d) => d.getMonth() === month).map((day) => {
          const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const summary = daySummaries.get(key);
          if (!summary) return null;

          const total = summary.aptCount + summary.classCount;
          const dayName = isRtl
            ? DAY_NAMES_HE_SHORT[day.getDay()]
            : DAY_HEADERS_EN[day.getDay()];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(day)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-colors active:scale-[0.99] ${
                summary.isToday
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {/* Date badge */}
              <div className="flex w-10 shrink-0 flex-col items-center">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {dayName}
                </span>
                <span
                  className={`mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                    summary.isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Summary */}
              <div className="flex-1 min-w-0">
                {total === 0 ? (
                  <p className="text-xs text-muted-foreground/50">—</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      {summary.aptCount > 0 && (
                        <span className="text-muted-foreground">
                          {summary.aptCount} תורים
                        </span>
                      )}
                      {summary.classCount > 0 && (
                        <span className="text-violet-600">
                          {summary.classCount} שיעורים
                        </span>
                      )}
                      {summary.pendingCount > 0 && (
                        <span className="font-semibold text-amber-600">
                          {summary.pendingCount} ממתינים
                        </span>
                      )}
                    </div>
                    {/* Load bar */}
                    <div className="mt-1 h-1 w-28 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          summary.loadPct > 90
                            ? "bg-red-400"
                            : summary.loadPct > 70
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                        style={{ width: `${summary.loadPct}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              <ChevronLeft
                className={`size-4 shrink-0 text-muted-foreground/40 ${isRtl ? "" : "rotate-180"}`}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
