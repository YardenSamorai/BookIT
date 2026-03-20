"use client";

import { useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff, ClassInstance } from "./calendar-types";
import { STAFF_COLORS, isSameDay, formatTime } from "./calendar-types";

interface WeekViewProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  staffFilter: string | null;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onDayClick: (date: Date) => void;
}

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "שבת"];
const DAY_NAMES_HE_FULL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export function WeekView({
  appointments,
  classInstances = [],
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
  const dayNamesFull = isRtl ? DAY_NAMES_HE_FULL : DAY_NAMES_EN;
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
      {/* ── Desktop: grid layout ── */}
      <div className="hidden md:grid md:grid-cols-7 md:gap-1.5">
        {weekDays.map((day, i) => {
          const isCurrentDay = isSameDay(day, today);
          const dayApts = appointmentsByDay.get(i) ?? [];
          const dayCIs = classInstancesByDay.get(i) ?? [];

          return (
            <div
              key={i}
              className={`min-h-[180px] rounded-xl border p-1.5 transition-colors ${
                isCurrentDay
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className="mb-1.5 w-full text-center transition-colors hover:text-primary"
              >
                <p className="text-[10px] text-muted-foreground">{dayNamesFull[day.getDay()]}</p>
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
                  {dayApts.length === 0 && dayCIs.length === 0 && (
                    <p className="py-3 text-center text-[10px] text-muted-foreground/50">—</p>
                  )}
                </div>
              )}

              {dayCIs.map((ci) => (
                <ClassCard key={ci.id} instance={ci} dateLocale={dateLocale} />
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Mobile: vertical list layout ── */}
      <div className="flex flex-col gap-2 md:hidden">
        {weekDays.map((day, i) => {
          const isCurrentDay = isSameDay(day, today);
          const dayApts = appointmentsByDay.get(i) ?? [];
          const dayCIs = classInstancesByDay.get(i) ?? [];

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(day)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-start transition-colors active:scale-[0.99] ${
                isCurrentDay
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {/* Date badge */}
              <div className="flex w-11 shrink-0 flex-col items-center">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {dayNames[day.getDay()]}
                </span>
                <span
                  className={`mt-0.5 flex size-9 items-center justify-center rounded-full text-base font-bold ${
                    isCurrentDay
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Appointments & class instances list */}
              <div className="flex-1 min-w-0">
                {dayApts.length === 0 && dayCIs.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground/50">—</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {dayApts.map((apt) => {
                      const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
                      const start = new Date(apt.startTime);
                      return (
                        <div
                          key={apt.id}
                          className="flex items-center gap-1.5 rounded-lg border-s-2 px-2 py-1 text-[12px] leading-tight shadow-sm"
                          style={{
                            backgroundColor: clr.bg,
                            borderColor: clr.border,
                            color: clr.text,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAptClick(apt);
                          }}
                        >
                          <span className="font-semibold tabular-nums whitespace-nowrap">
                            {formatTime(start, dateLocale)}
                          </span>
                          <span className="truncate opacity-80">{apt.serviceName}</span>
                          {apt.customerName && (
                            <span className="hidden xs:inline truncate text-[11px] opacity-60">
                              · {apt.customerName}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {dayCIs.map((ci) => {
                      const start = new Date(ci.startTime);
                      const booked = ci.bookedCount ?? 0;
                      return (
                        <div
                          key={ci.id}
                          className="flex items-center gap-1.5 rounded-lg border-s-2 border-dashed px-2 py-1 text-[12px] leading-tight shadow-sm"
                          style={{
                            backgroundColor: "#EDE9FE",
                            borderColor: "#8B5CF6",
                            color: "#4C1D95",
                          }}
                        >
                          <span className="font-semibold tabular-nums whitespace-nowrap">
                            {formatTime(start, dateLocale)}
                          </span>
                          <span className="truncate opacity-80">⟳ {ci.serviceName}</span>
                          <span className="text-[11px] opacity-60 shrink-0">
                            {booked}/{ci.maxParticipants}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chevron */}
              <ChevronLeft
                className={`mt-2 size-4 shrink-0 text-muted-foreground/40 ${isRtl ? "" : "rotate-180"}`}
              />
            </button>
          );
        })}
      </div>
    </>
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

function ClassCard({
  instance,
  dateLocale,
}: {
  instance: ClassInstance;
  dateLocale: string;
}) {
  const start = new Date(instance.startTime);
  const booked = instance.bookedCount ?? 0;

  return (
    <div
      className="mt-1 w-full rounded-lg border-s-2 border-dashed px-2 py-1.5 text-start text-[11px] leading-tight shadow-sm"
      style={{
        backgroundColor: "#EDE9FE",
        borderColor: "#8B5CF6",
        color: "#4C1D95",
      }}
    >
      <p className="font-semibold tabular-nums">
        {formatTime(start, dateLocale)} · ⟳ {instance.serviceName}
      </p>
      <p className="truncate opacity-75">
        {booked}/{instance.maxParticipants}
      </p>
    </div>
  );
}
