"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff } from "./calendar-types";
import { STAFF_COLORS, isSameDay, formatTime } from "./calendar-types";

interface DayViewProps {
  appointments: Appointment[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  staffFilter: string | null;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
}

const HOUR_START = 8;
const HOUR_END = 20;
const ROW_HEIGHT = 60;

export function DayView({
  appointments,
  staff,
  staffColorMap,
  staffFilter,
  currentDate,
  onAptClick,
}: DayViewProps) {
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const gridRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  const dayApts = useMemo(() => {
    return appointments.filter((a) => isSameDay(new Date(a.startTime), currentDate));
  }, [appointments, currentDate]);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i < HOUR_END; i++) h.push(i);
    return h;
  }, []);

  const gridHeight = hours.length * ROW_HEIGHT;
  const totalMinutes = (HOUR_END - HOUR_START) * 60;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const mins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
    if (mins < 0) return;
    const scrollTarget = Math.max(0, (mins / 60) * ROW_HEIGHT - 120);
    gridRef.current.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [currentDate]);

  const currentTimeTop = useMemo(() => {
    if (!isSameDay(now, currentDate)) return null;
    const mins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
    if (mins < 0 || mins > totalMinutes) return null;
    return (mins / 60) * ROW_HEIGHT;
  }, [now, currentDate, totalMinutes]);

  const visibleStaff = staffFilter
    ? staff.filter((s) => s.id === staffFilter)
    : staff;
  const showColumns = visibleStaff.length > 1 && !staffFilter;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Staff column headers (multi-staff, no filter) */}
      {showColumns && (
        <div className="flex border-b bg-muted/30">
          <div className="w-16 shrink-0" />
          {visibleStaff.map((s, i) => {
            const clr = STAFF_COLORS[i % STAFF_COLORS.length];
            return (
              <div
                key={s.id}
                className="flex flex-1 items-center justify-center gap-1.5 border-s border-border/30 py-2"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: clr.border }}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div
        ref={gridRef}
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        <div className="relative flex" style={{ height: gridHeight }}>
          {/* Time axis */}
          <div className="w-16 shrink-0 border-e border-border/30">
            {hours.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pe-2 pt-1"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Appointment columns */}
          {showColumns ? (
            visibleStaff.map((s, si) => (
              <StaffColumn
                key={s.id}
                staffId={s.id}
                appointments={dayApts.filter((a) => a.staffId === s.id)}
                staffColorMap={staffColorMap}
                dateLocale={dateLocale}
                onAptClick={onAptClick}
                showBorder={si > 0}
              />
            ))
          ) : (
            <SingleColumn
              appointments={dayApts}
              staffColorMap={staffColorMap}
              dateLocale={dateLocale}
              onAptClick={onAptClick}
            />
          )}

          {/* Hour grid lines */}
          {hours.map((h, i) => (
            <div
              key={h}
              className="pointer-events-none absolute border-t border-border/30"
              style={{
                top: i * ROW_HEIGHT,
                left: 64,
                right: 0,
              }}
            />
          ))}

          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="pointer-events-none absolute z-10"
              style={{ top: currentTimeTop, left: 56, right: 0 }}
            >
              <div className="relative flex items-center">
                <div className="absolute -start-1 size-2.5 rounded-full bg-red-500" />
                <div className="h-px w-full bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffColumn({
  staffId,
  appointments,
  staffColorMap,
  dateLocale,
  onAptClick,
  showBorder,
}: {
  staffId: string;
  appointments: Appointment[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
  showBorder: boolean;
}) {
  return (
    <div
      className={`relative flex-1 ${showBorder ? "border-s border-border/20" : ""}`}
    >
      {appointments.map((apt) => (
        <AptBlock
          key={apt.id}
          apt={apt}
          staffColorMap={staffColorMap}
          dateLocale={dateLocale}
          onAptClick={onAptClick}
        />
      ))}
    </div>
  );
}

function SingleColumn({
  appointments,
  staffColorMap,
  dateLocale,
  onAptClick,
}: {
  appointments: Appointment[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
}) {
  return (
    <div className="relative flex-1">
      {appointments.map((apt) => (
        <AptBlock
          key={apt.id}
          apt={apt}
          staffColorMap={staffColorMap}
          dateLocale={dateLocale}
          onAptClick={onAptClick}
        />
      ))}
    </div>
  );
}

function AptBlock({
  apt,
  staffColorMap,
  dateLocale,
  onAptClick,
}: {
  apt: Appointment;
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
}) {
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const startMins = start.getHours() * 60 + start.getMinutes() - HOUR_START * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  const top = (startMins / 60) * ROW_HEIGHT;
  const height = Math.max((durationMins / 60) * ROW_HEIGHT, ROW_HEIGHT * 0.4);
  const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];

  if (startMins < 0) return null;

  return (
    <button
      type="button"
      onClick={() => onAptClick(apt)}
      className="absolute inset-x-1 cursor-pointer overflow-hidden rounded-lg border-s-[3px] px-2 py-1 text-start shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-black/10"
      style={{
        top,
        height,
        backgroundColor: clr.bg,
        borderColor: clr.border,
        color: clr.text,
      }}
    >
      <p className="truncate text-xs font-semibold">{apt.serviceName}</p>
      <p className="truncate text-[11px] opacity-75">{apt.customerName}</p>
      <p className="text-[10px] tabular-nums opacity-60">
        {formatTime(start, dateLocale)}–{formatTime(end, dateLocale)}
      </p>
    </button>
  );
}
