"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff } from "./calendar-types";
import { STAFF_COLORS, isSameDay, formatTime } from "./calendar-types";

interface MonthViewProps {
  appointments: Appointment[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onDayClick: (date: Date) => void;
}

const DAY_HEADERS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_HEADERS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export function MonthView({
  appointments,
  staff,
  staffColorMap,
  currentDate,
  onAptClick,
  onDayClick,
}: MonthViewProps) {
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";
  const dayHeaders = isRtl ? DAY_HEADERS_HE : DAY_HEADERS_EN;
  const today = new Date();

  const { weeks, month } = useMemo(() => {
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
    return { weeks: rows, month: mo };
  }, [currentDate]);

  const aptsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const d = new Date(apt.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) ?? [];
      list.push(apt);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
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
            const isCurrentMonth = day.getMonth() === month;
            const isToday = isSameDay(day, today);
            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const dayApts = aptsByDate.get(key) ?? [];
            const hasApts = dayApts.length > 0;

            return (
              <div
                key={di}
                className={`min-h-[90px] border-e last:border-0 p-1.5 transition-colors ${
                  isToday ? "bg-primary/5" : ""
                } ${!isCurrentMonth ? "bg-muted/10" : ""}`}
              >
                {/* Day number */}
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="mb-1 flex items-center gap-1 transition-colors hover:text-primary"
                >
                  {hasApts && (
                    <span className="size-1.5 rounded-full bg-green-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isToday
                        ? "text-primary"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/40"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </button>

                {/* Appointment pills (max 2 visible + overflow) */}
                <div className="space-y-0.5">
                  {dayApts.slice(0, 2).map((apt) => {
                    const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
                    const start = new Date(apt.startTime);
                    return (
                      <button
                        key={apt.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAptClick(apt);
                        }}
                        className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-start text-[10px] leading-tight transition-opacity hover:opacity-80"
                        style={{ backgroundColor: clr.bg, color: clr.text }}
                      >
                        <span className="font-semibold tabular-nums">
                          {formatTime(start, dateLocale)}
                        </span>
                        <span className="truncate">
                          {staff.length > 1 ? apt.staffName.split(" ")[0] : apt.serviceName}
                        </span>
                      </button>
                    );
                  })}
                  {dayApts.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onDayClick(day)}
                      className="w-full rounded px-1 py-0.5 text-center text-[10px] font-medium text-muted-foreground hover:bg-muted/50"
                    >
                      +{dayApts.length - 2}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
