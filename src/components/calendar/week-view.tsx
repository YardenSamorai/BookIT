"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff } from "./calendar-types";
import { STAFF_COLORS, isSameDay, formatTime } from "./calendar-types";

interface WeekViewProps {
  appointments: Appointment[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onDayClick: (date: Date) => void;
}

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function WeekView({
  appointments,
  staff,
  staffColorMap,
  currentDate,
  onAptClick,
  onDayClick,
}: WeekViewProps) {
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";
  const dayNames = isRtl ? DAY_NAMES_HE : DAY_NAMES_EN;
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

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, i) => {
        const isCurrentDay = isSameDay(day, today);
        const dayApts = appointmentsByDay.get(i) ?? [];

        return (
          <div
            key={i}
            className={`min-h-[180px] rounded-xl border p-2 transition-colors ${
              isCurrentDay
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            {/* Day header */}
            <button
              type="button"
              onClick={() => onDayClick(day)}
              className="mb-2 w-full text-center transition-colors hover:text-primary"
            >
              <p className="text-xs text-muted-foreground">{dayNames[day.getDay()]}</p>
              <p
                className={`text-2xl font-bold ${
                  isCurrentDay ? "text-primary" : "text-foreground"
                }`}
              >
                {day.getDate()}
              </p>
            </button>

            {/* Appointments */}
            <div className="space-y-1.5">
              {dayApts.map((apt) => {
                const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
                const start = new Date(apt.startTime);
                const end = new Date(apt.endTime);

                return (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => onAptClick(apt)}
                    className="w-full cursor-pointer rounded-lg border-s-2 px-2 py-1.5 text-start text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md"
                    style={{
                      backgroundColor: clr.bg,
                      borderColor: clr.border,
                      color: clr.text,
                    }}
                  >
                    <p className="font-semibold tabular-nums">
                      {formatTime(start, dateLocale)}-{formatTime(end, dateLocale)}
                    </p>
                    {staff.length > 1 && (
                      <p className="truncate font-medium">{apt.staffName}</p>
                    )}
                    <p className="truncate opacity-75">{apt.serviceName}</p>
                  </button>
                );
              })}
              {dayApts.length === 0 && (
                <p className="py-4 text-center text-[11px] text-muted-foreground/50">-</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
