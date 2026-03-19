"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff } from "./calendar-types";
import { STAFF_COLORS, isSameDay, formatTime } from "./calendar-types";

interface WeekViewProps {
  appointments: Appointment[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  staffFilter: string | null;
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
  staffFilter,
  currentDate,
  onAptClick,
  onDayClick,
}: WeekViewProps) {
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";
  const dayNames = isRtl ? DAY_NAMES_HE : DAY_NAMES_EN;
  const today = new Date();
  const multiStaff = staff.length > 1;

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
    <div className="grid grid-cols-7 gap-1.5">
      {weekDays.map((day, i) => {
        const isCurrentDay = isSameDay(day, today);
        const dayApts = appointmentsByDay.get(i) ?? [];

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
              <p className="text-[10px] text-muted-foreground">{dayNames[day.getDay()]}</p>
              <p
                className={`text-lg font-bold leading-none ${
                  isCurrentDay ? "text-primary" : "text-foreground"
                }`}
              >
                {day.getDate()}
              </p>
            </button>

            {multiStaff ? (
              <StaffSubColumns
                staff={staff}
                staffFilter={staffFilter}
                staffColorMap={staffColorMap}
                dayApts={dayApts}
                dateLocale={dateLocale}
                onAptClick={onAptClick}
              />
            ) : (
              <div className="space-y-1">
                {dayApts.map((apt) => (
                  <AptCard
                    key={apt.id}
                    apt={apt}
                    staffColorMap={staffColorMap}
                    dateLocale={dateLocale}
                    onAptClick={onAptClick}
                  />
                ))}
                {dayApts.length === 0 && (
                  <p className="py-3 text-center text-[10px] text-muted-foreground/50">-</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
            {/* Mini staff header */}
            <div className="mb-1 flex items-center justify-center gap-0.5 rounded-md py-0.5" style={{ backgroundColor: `${clr.border}18` }}>
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: clr.border }}
              />
              <span className="text-[9px] font-medium truncate" style={{ color: clr.text }}>
                {staff.length > 3 ? s.name.charAt(0) : s.name.split(" ")[0]}
              </span>
            </div>

            {/* Appointments */}
            <div className="space-y-0.5">
              {staffApts.map((apt) => (
                <AptCard
                  key={apt.id}
                  apt={apt}
                  staffColorMap={staffColorMap}
                  dateLocale={dateLocale}
                  onAptClick={onAptClick}
                  compact
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AptCard({
  apt,
  staffColorMap,
  dateLocale,
  onAptClick,
  compact,
}: {
  apt: Appointment;
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
  compact?: boolean;
}) {
  const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onAptClick(apt)}
        className="w-full cursor-pointer rounded border-s-2 px-1 py-0.5 text-start text-[9px] leading-tight shadow-sm transition-shadow hover:shadow-md"
        style={{
          backgroundColor: clr.bg,
          borderColor: clr.border,
          color: clr.text,
        }}
      >
        <p className="font-semibold tabular-nums truncate">
          {formatTime(start, dateLocale)}
        </p>
        <p className="truncate opacity-75">{apt.serviceName}</p>
      </button>
    );
  }

  return (
    <button
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
      <p className="truncate opacity-75">{apt.serviceName}</p>
    </button>
  );
}
