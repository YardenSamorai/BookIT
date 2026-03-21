"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Appointment, Staff, ClassInstance } from "./calendar-types";
import { STAFF_COLORS, isSameDay, formatTime } from "./calendar-types";

interface DayViewProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  staffFilter: string | null;
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
}

const HOUR_START = 7;
const HOUR_END = 22;
const ROW_HEIGHT = 64;
const PX_PER_MIN = ROW_HEIGHT / 60;

export function DayView({
  appointments,
  classInstances = [],
  staff,
  staffColorMap,
  staffFilter,
  currentDate,
  onAptClick,
  onClassClick,
}: DayViewProps) {
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const gridRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  const dayApts = useMemo(() => {
    return appointments.filter((a) => isSameDay(new Date(a.startTime), currentDate));
  }, [appointments, currentDate]);

  const dayClassInstances = useMemo(() => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    return classInstances.filter((ci) => ci.date === dateStr && ci.status === "SCHEDULED");
  }, [classInstances, currentDate]);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i < HOUR_END; i++) h.push(i);
    return h;
  }, []);

  const gridHeight = hours.length * ROW_HEIGHT;
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const multiStaff = staff.length > 1;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    if (!isSameDay(now, currentDate)) {
      gridRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const mins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
    if (mins < 0) return;
    const scrollTarget = Math.max(0, (mins / 60) * ROW_HEIGHT - 120);
    gridRef.current.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [currentDate, now]);

  const currentTimeTop = useMemo(() => {
    if (!isSameDay(now, currentDate)) return null;
    const mins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
    if (mins < 0 || mins > totalMinutes) return null;
    return (mins / 60) * ROW_HEIGHT;
  }, [now, currentDate, totalMinutes]);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Sticky staff column headers */}
      {multiStaff && (
        <div className="sticky top-0 z-20 flex border-b bg-card/95 backdrop-blur-sm">
          <div className="w-14 shrink-0" />
          {staff.map((s, i) => {
            const clr = STAFF_COLORS[i % STAFF_COLORS.length];
            const dimmed = staffFilter !== null && staffFilter !== s.id;
            return (
              <div
                key={s.id}
                className={`flex flex-1 items-center justify-center gap-1.5 border-s border-border/30 py-2.5 transition-opacity ${dimmed ? "opacity-40" : ""}`}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: clr.border }}
                />
                <span className="text-xs font-semibold">
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
          <div className="w-14 shrink-0 border-e border-border/30">
            {hours.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end pe-2 pt-1"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Staff columns (always shown when multi-staff) */}
          {multiStaff ? (
            staff.map((s, si) => {
              const dimmed = staffFilter !== null && staffFilter !== s.id;
              return (
                <div
                  key={s.id}
                  className={`relative flex-1 ${si > 0 ? "border-s border-border/20" : ""} transition-opacity ${dimmed ? "opacity-30" : ""}`}
                >
                  {dayApts
                    .filter((a) => a.staffId === s.id)
                    .map((apt) => (
                      <AptBlock
                        key={apt.id}
                        apt={apt}
                        staffColorMap={staffColorMap}
                        dateLocale={dateLocale}
                        onAptClick={onAptClick}
                      />
                    ))}
                  {dayClassInstances
                    .filter((ci) => ci.staffId === s.id)
                    .map((ci) => (
                      <ClassBlock
                        key={ci.id}
                        instance={ci}
                        dateLocale={dateLocale}
                        onClassClick={onClassClick}
                      />
                    ))}
                </div>
              );
            })
          ) : (
            <div className="relative flex-1">
              {dayApts.map((apt) => (
                <AptBlock
                  key={apt.id}
                  apt={apt}
                  staffColorMap={staffColorMap}
                  dateLocale={dateLocale}
                  onAptClick={onAptClick}
                />
              ))}
              {dayClassInstances.map((ci) => (
                <ClassBlock
                  key={ci.id}
                  instance={ci}
                  dateLocale={dateLocale}
                  onClassClick={onClassClick}
                />
              ))}
            </div>
          )}

          {/* Hour grid lines */}
          {hours.map((h, i) => (
            <div
              key={h}
              className="pointer-events-none absolute border-t border-border/30"
              style={{ top: i * ROW_HEIGHT, left: 56, right: 0 }}
            />
          ))}

          {/* Half-hour grid lines */}
          {hours.map((h) => (
            <div
              key={`half-${h}`}
              className="pointer-events-none absolute border-t border-dashed border-border/15"
              style={{ top: (h - HOUR_START) * ROW_HEIGHT + ROW_HEIGHT / 2, left: 56, right: 0 }}
            />
          ))}

          {/* Current time indicator */}
          {currentTimeTop !== null && (
            <div
              className="pointer-events-none absolute z-10"
              style={{ top: currentTimeTop, left: 48, right: 0 }}
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
  const heightPx = Math.max(durationMins * PX_PER_MIN, 24);
  const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
  const timeStr = `${formatTime(start, dateLocale)}–${formatTime(end, dateLocale)}`;

  if (startMins < 0) return null;

  return (
    <button
      type="button"
      onClick={() => onAptClick(apt)}
      className="absolute inset-x-1 cursor-pointer overflow-hidden rounded-lg border-s-[3px] text-start shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-black/10"
      style={{
        top,
        height: heightPx,
        backgroundColor: clr.bg,
        borderColor: clr.border,
        color: clr.text,
      }}
    >
      {heightPx < 28 ? (
        <p className="flex items-center h-full px-1.5 text-[11px] truncate gap-1">
          <span className="font-semibold">{apt.serviceName}</span>
          <span className="opacity-60 tabular-nums shrink-0">{timeStr}</span>
        </p>
      ) : heightPx < 46 ? (
        <div className="px-1.5 py-0.5">
          <p className="truncate text-xs font-semibold leading-tight">{apt.serviceName}</p>
          <p className="truncate text-[11px] opacity-70 leading-tight">
            {apt.customerName} · {timeStr}
          </p>
        </div>
      ) : (
        <div className="px-2 py-1">
          <p className="truncate text-xs font-semibold leading-tight">{apt.serviceName}</p>
          <p className="truncate text-[11px] opacity-75 leading-tight">{apt.customerName}</p>
          <p className="text-[10px] tabular-nums opacity-60 leading-tight">{timeStr}</p>
        </div>
      )}
    </button>
  );
}

function ClassBlock({
  instance,
  dateLocale,
  onClassClick,
}: {
  instance: ClassInstance;
  dateLocale: string;
  onClassClick?: (ci: ClassInstance) => void;
}) {
  const start = new Date(instance.startTime);
  const end = new Date(instance.endTime);
  const startMins = start.getHours() * 60 + start.getMinutes() - HOUR_START * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  const top = (startMins / 60) * ROW_HEIGHT;
  const heightPx = Math.max(durationMins * PX_PER_MIN, 24);
  const timeStr = `${formatTime(start, dateLocale)}–${formatTime(end, dateLocale)}`;
  const booked = instance.bookedCount ?? 0;
  const capacityStr = `${booked}/${instance.maxParticipants}`;

  if (startMins < 0) return null;

  return (
    <button
      type="button"
      onClick={() => onClassClick?.(instance)}
      className="absolute inset-x-1 cursor-pointer overflow-hidden rounded-lg border-s-[3px] border-dashed text-start shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-violet-300"
      style={{
        top,
        height: heightPx,
        backgroundColor: "#EDE9FE",
        borderColor: "#8B5CF6",
        color: "#4C1D95",
      }}
    >
      {heightPx < 28 ? (
        <p className="flex items-center h-full px-1.5 text-[11px] truncate gap-1">
          <span className="font-semibold">⟳ {instance.serviceName}</span>
          <span className="opacity-60 shrink-0">{capacityStr}</span>
        </p>
      ) : heightPx < 46 ? (
        <div className="px-1.5 py-0.5">
          <p className="truncate text-xs font-semibold leading-tight">⟳ {instance.serviceName}</p>
          <p className="truncate text-[11px] opacity-70 leading-tight">
            {capacityStr} · {timeStr}
          </p>
        </div>
      ) : (
        <div className="px-2 py-1">
          <p className="truncate text-xs font-semibold leading-tight">⟳ {instance.serviceName}</p>
          <p className="truncate text-[11px] opacity-75 leading-tight">{capacityStr}</p>
          <p className="text-[10px] tabular-nums opacity-60 leading-tight">{timeStr}</p>
        </div>
      )}
    </button>
  );
}
