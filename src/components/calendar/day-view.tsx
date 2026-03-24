"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { ProviderHeaderPopover } from "./provider-header-popover";
import type {
  Appointment,
  Staff,
  ClassInstance,
  StaffDaySchedule,
  BlockedSlot,
  TimeOffPeriod,
  BusinessHoursEntry,
  CardTier,
} from "./calendar-types";
import {
  STAFF_COLORS,
  isSameDay,
  formatTime,
  getHoursInTz,
  getMinutesInTz,
  wallClockToDate,
  getStatusStyle,
  CLASS_STYLE,
  getCardTier,
  getStaffScheduleForDay,
  getBlockedSlotsForStaffDay,
  isStaffOnTimeOff,
  timeToMinutes,
} from "./calendar-types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DayViewProps {
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staff: Staff[];
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  staffFilter: string | null;
  staffSchedules?: StaffDaySchedule[];
  staffBlockedSlots?: BlockedSlot[];
  staffTimeOff?: TimeOffPeriod[];
  businessHours?: BusinessHoursEntry[];
  currentDate: Date;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  onClassTimeChange?: (instanceId: string, newStart: Date, newEnd: Date) => void;
  onEmptySlotClick?: (staffId: string, time: Date) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_HOUR_START = 7;
const DEFAULT_HOUR_END = 22;
const ROW_HEIGHT = 64;
const PX_PER_MIN = ROW_HEIGHT / 60;
const SNAP_MINUTES = 5;
const DRAG_THRESHOLD = 5;

function snapMinutes(mins: number): number {
  return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES;
}

function minsToTimeStr(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type DragState = {
  instanceId: string;
  durationMins: number;
  startY: number;
  originalTopMins: number;
  currentTopMins: number;
  hasMoved: boolean;
  heightPx: number;
};

// ---------------------------------------------------------------------------
// Conflict detection: groups overlapping appointments per staff column
// ---------------------------------------------------------------------------

type LayoutInfo = { overlapIndex: number; overlapCount: number };

function computeOverlapLayout(apts: Appointment[]): Map<string, LayoutInfo> {
  const sorted = [...apts].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const result = new Map<string, LayoutInfo>();

  const active: { apt: Appointment; end: number; idx: number }[] = [];
  for (const apt of sorted) {
    const start = new Date(apt.startTime).getTime();
    const end = new Date(apt.endTime).getTime();

    // Remove expired
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].end <= start) active.splice(i, 1);
    }

    const idx = active.length;
    active.push({ apt, end, idx });

    const count = active.length;
    for (const a of active) {
      const prev = result.get(a.apt.id);
      result.set(a.apt.id, {
        overlapIndex: prev?.overlapIndex ?? a.idx,
        overlapCount: Math.max(prev?.overlapCount ?? 0, count),
      });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DayView({
  appointments,
  classInstances = [],
  staff,
  staffColorMap,
  staffFilter,
  staffSchedules = [],
  staffBlockedSlots = [],
  staffTimeOff = [],
  businessHours = [],
  currentDate,
  onAptClick,
  onClassClick,
  onClassTimeChange,
  onEmptySlotClick,
}: DayViewProps) {
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const gridRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // ── Dynamic time range ──────────────────────────────────
  const { hourStart, hourEnd } = useMemo(() => {
    const dow = currentDate.getDay();
    let minHour = DEFAULT_HOUR_START;
    let maxHour = DEFAULT_HOUR_END;

    for (const s of staff) {
      const sched = getStaffScheduleForDay(s.id, dow, staffSchedules);
      if (sched) {
        const start = timeToMinutes(sched.startTime);
        const end = timeToMinutes(sched.endTime);
        minHour = Math.min(minHour, Math.floor(start / 60));
        maxHour = Math.max(maxHour, Math.ceil(end / 60));
      }
    }

    const bhEntry = businessHours.find((b) => b.dayOfWeek === dow && b.isOpen);
    if (bhEntry) {
      minHour = Math.min(minHour, Math.floor(timeToMinutes(bhEntry.startTime) / 60));
      maxHour = Math.max(maxHour, Math.ceil(timeToMinutes(bhEntry.endTime) / 60));
    }

    return { hourStart: Math.max(0, minHour - 1), hourEnd: Math.min(24, maxHour + 1) };
  }, [currentDate, staff, staffSchedules, businessHours]);

  // ── Day-scoped data ─────────────────────────────────────
  const dayApts = useMemo(() => {
    return appointments.filter((a) =>
      isSameDay(new Date(a.startTime), currentDate)
    );
  }, [appointments, currentDate]);

  const dayClassInstances = useMemo(() => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    return classInstances.filter(
      (ci) => ci.date === dateStr && ci.status === "SCHEDULED"
    );
  }, [classInstances, currentDate]);

  const dateStr = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  }, [currentDate]);

  // ── Grid geometry ───────────────────────────────────────
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = hourStart; i < hourEnd; i++) h.push(i);
    return h;
  }, [hourStart, hourEnd]);

  const gridHeight = hours.length * ROW_HEIGHT;
  const totalMinutes = (hourEnd - hourStart) * 60;
  const multiStaff = staff.length > 1;

  // ── Now indicator ───────────────────────────────────────
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
    const mins =
      getHoursInTz(now) * 60 + getMinutesInTz(now) - hourStart * 60;
    if (mins < 0) return;
    const scrollTarget = Math.max(0, (mins / 60) * ROW_HEIGHT - 120);
    gridRef.current.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [currentDate, now, hourStart]);

  const currentTimeTop = useMemo(() => {
    if (!isSameDay(now, currentDate)) return null;
    const mins =
      getHoursInTz(now) * 60 + getMinutesInTz(now) - hourStart * 60;
    if (mins < 0 || mins > totalMinutes) return null;
    return (mins / 60) * ROW_HEIGHT;
  }, [now, currentDate, totalMinutes, hourStart]);

  // ── Drag-and-drop for class instances ───────────────────
  const handleClassPointerDown = useCallback(
    (e: React.PointerEvent, ci: ClassInstance) => {
      if (!onClassTimeChange) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const start = new Date(ci.startTime);
      const end = new Date(ci.endTime);
      const startMins =
        getHoursInTz(start) * 60 + getMinutesInTz(start);
      const durationMins = (end.getTime() - start.getTime()) / 60_000;
      const offsetMins = startMins - hourStart * 60;
      const heightPx = Math.max(durationMins * PX_PER_MIN, 24);

      const state: DragState = {
        instanceId: ci.id,
        durationMins,
        startY: e.clientY,
        originalTopMins: offsetMins,
        currentTopMins: offsetMins,
        hasMoved: false,
        heightPx,
      };
      dragRef.current = state;
      setDrag(state);
    },
    [onClassTimeChange, hourStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const deltaY = e.clientY - d.startY;
      if (!d.hasMoved && Math.abs(deltaY) < DRAG_THRESHOLD) return;
      const deltaMins = (deltaY / ROW_HEIGHT) * 60;
      const rawMins = d.originalTopMins + deltaMins;
      const snapped = snapMinutes(rawMins);
      const clamped = Math.max(
        0,
        Math.min(totalMinutes - d.durationMins, snapped)
      );
      const updated: DragState = {
        ...d,
        currentTopMins: clamped,
        hasMoved: true,
      };
      dragRef.current = updated;
      setDrag(updated);
    },
    [totalMinutes]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (!d) return;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

      if (!d.hasMoved) {
        const ci = dayClassInstances.find((c) => c.id === d.instanceId);
        if (ci) onClassClick?.(ci);
        return;
      }
      if (d.currentTopMins === d.originalTopMins) return;

      const newStartMins = hourStart * 60 + d.currentTopMins;
      const newEndMins = newStartMins + d.durationMins;
      const newStart = wallClockToDate(
        currentDate,
        Math.floor(newStartMins / 60),
        newStartMins % 60
      );
      const newEnd = wallClockToDate(
        currentDate,
        Math.floor(newEndMins / 60),
        newEndMins % 60
      );
      onClassTimeChange?.(d.instanceId, newStart, newEnd);
    },
    [dayClassInstances, onClassClick, onClassTimeChange, currentDate, hourStart]
  );

  // ── Empty slot click ────────────────────────────────────
  const handleColumnClick = useCallback(
    (e: React.MouseEvent, staffId: string) => {
      if (!onEmptySlotClick) return;
      if ((e.target as HTMLElement).closest("[data-event-block]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const mins = snapMinutes((y / ROW_HEIGHT) * 60) + hourStart * 60;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      onEmptySlotClick(staffId, wallClockToDate(currentDate, h, m));
    },
    [onEmptySlotClick, hourStart, currentDate]
  );

  const ghostTop = drag ? (drag.currentTopMins / 60) * ROW_HEIGHT : 0;
  const ghostTimeStr = drag
    ? `${minsToTimeStr(hourStart * 60 + drag.currentTopMins)} – ${minsToTimeStr(hourStart * 60 + drag.currentTopMins + drag.durationMins)}`
    : "";

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* ── Sticky staff column headers ──────────────────── */}
      {multiStaff && (
        <div className="sticky top-0 z-20 flex border-b bg-card/95 backdrop-blur-sm">
          <div className="w-14 shrink-0" />
          {staff.map((s, i) => {
            const clr = STAFF_COLORS[i % STAFF_COLORS.length];
            const dimmed = staffFilter !== null && staffFilter !== s.id;
            const isOff = isStaffOnTimeOff(s.id, dateStr, staffTimeOff);
            return (
              <ProviderHeaderPopover
                key={s.id}
                staff={s}
                staffIndex={i}
                appointments={appointments}
                classInstances={classInstances}
                currentDate={currentDate}
              >
                <span
                  className={`flex flex-1 items-center justify-center gap-1.5 border-s border-border/30 py-2.5 transition-opacity cursor-pointer hover:bg-muted/30 ${dimmed ? "opacity-40" : ""}`}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: clr.border }}
                  />
                  <span className="text-xs font-semibold truncate">
                    {s.name}
                  </span>
                  {isOff && (
                    <span className="rounded bg-gray-200 px-1 py-0.5 text-[9px] font-medium text-gray-500">
                      OFF
                    </span>
                  )}
                </span>
              </ProviderHeaderPopover>
            );
          })}
        </div>
      )}

      {/* ── Scrollable grid ──────────────────────────────── */}
      <div
        ref={gridRef}
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 340px)" }}
      >
        <div
          className="relative flex"
          style={{ height: gridHeight }}
          onPointerMove={drag ? handlePointerMove : undefined}
          onPointerUp={drag ? handlePointerUp : undefined}
        >
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

          {/* ── Staff columns ────────────────────────────── */}
          {multiStaff
            ? staff.map((s, si) => (
                <StaffColumn
                  key={s.id}
                  staff={s}
                  staffIndex={si}
                  staffColorMap={staffColorMap}
                  appointments={dayApts.filter((a) => a.staffId === s.id)}
                  classInstances={dayClassInstances.filter((ci) => ci.staffId === s.id)}
                  dimmed={staffFilter !== null && staffFilter !== s.id}
                  hourStart={hourStart}
                  hourEnd={hourEnd}
                  gridHeight={gridHeight}
                  totalMinutes={totalMinutes}
                  dateLocale={dateLocale}
                  dateStr={dateStr}
                  currentDate={currentDate}
                  staffSchedules={staffSchedules}
                  staffBlockedSlots={staffBlockedSlots}
                  staffTimeOff={staffTimeOff}
                  businessHours={businessHours}
                  showBorder={si > 0}
                  onAptClick={onAptClick}
                  onClassClick={onClassClick}
                  handleClassPointerDown={handleClassPointerDown}
                  onClassTimeChange={onClassTimeChange}
                  drag={drag}
                  onColumnClick={handleColumnClick}
                />
              ))
            : (
              <StaffColumn
                staff={staff[0]}
                staffIndex={0}
                staffColorMap={staffColorMap}
                appointments={dayApts}
                classInstances={dayClassInstances}
                dimmed={false}
                hourStart={hourStart}
                hourEnd={hourEnd}
                gridHeight={gridHeight}
                totalMinutes={totalMinutes}
                dateLocale={dateLocale}
                dateStr={dateStr}
                currentDate={currentDate}
                staffSchedules={staffSchedules}
                staffBlockedSlots={staffBlockedSlots}
                staffTimeOff={staffTimeOff}
                businessHours={businessHours}
                showBorder={false}
                onAptClick={onAptClick}
                onClassClick={onClassClick}
                handleClassPointerDown={handleClassPointerDown}
                onClassTimeChange={onClassTimeChange}
                drag={drag}
                onColumnClick={handleColumnClick}
              />
            )}

          {/* ── Hour grid lines ──────────────────────────── */}
          {hours.map((h, i) => (
            <div
              key={h}
              className="pointer-events-none absolute border-t border-border/30"
              style={{ top: i * ROW_HEIGHT, left: 56, right: 0 }}
            />
          ))}
          {hours.map((h) => (
            <div
              key={`half-${h}`}
              className="pointer-events-none absolute border-t border-dashed border-border/15"
              style={{
                top: (h - hourStart) * ROW_HEIGHT + ROW_HEIGHT / 2,
                left: 56,
                right: 0,
              }}
            />
          ))}

          {/* ── Current time indicator ───────────────────── */}
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

          {/* ── Drag ghost ───────────────────────────────── */}
          {drag && drag.hasMoved && (
            <div
              className="pointer-events-none absolute z-20 rounded-lg border-2 border-violet-500 bg-violet-200/70 shadow-lg"
              style={{
                top: ghostTop,
                height: drag.heightPx,
                left: 60,
                right: 4,
              }}
            >
              <div className="flex h-full items-center justify-center">
                <span className="rounded-md bg-violet-600 px-2 py-0.5 text-xs font-bold text-white tabular-nums shadow">
                  {ghostTimeStr}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff column — handles overlays, appointments, and classes for one provider
// ---------------------------------------------------------------------------

function StaffColumn({
  staff: s,
  staffIndex,
  staffColorMap,
  appointments,
  classInstances,
  dimmed,
  hourStart,
  hourEnd,
  gridHeight,
  totalMinutes,
  dateLocale,
  dateStr,
  currentDate,
  staffSchedules,
  staffBlockedSlots: allBlocked,
  staffTimeOff,
  businessHours,
  showBorder,
  onAptClick,
  onClassClick,
  handleClassPointerDown,
  onClassTimeChange,
  drag,
  onColumnClick,
}: {
  staff: Staff;
  staffIndex: number;
  staffColorMap: Map<string, (typeof STAFF_COLORS)[number]>;
  appointments: Appointment[];
  classInstances: ClassInstance[];
  dimmed: boolean;
  hourStart: number;
  hourEnd: number;
  gridHeight: number;
  totalMinutes: number;
  dateLocale: string;
  dateStr: string;
  currentDate: Date;
  staffSchedules: StaffDaySchedule[];
  staffBlockedSlots: BlockedSlot[];
  staffTimeOff: TimeOffPeriod[];
  businessHours: BusinessHoursEntry[];
  showBorder: boolean;
  onAptClick: (apt: Appointment) => void;
  onClassClick?: (ci: ClassInstance) => void;
  handleClassPointerDown: (e: React.PointerEvent, ci: ClassInstance) => void;
  onClassTimeChange?: (id: string, s: Date, e: Date) => void;
  drag: DragState | null;
  onColumnClick: (e: React.MouseEvent, staffId: string) => void;
}) {
  const dow = currentDate.getDay();
  const isOff = isStaffOnTimeOff(s.id, dateStr, staffTimeOff);
  const schedule = getStaffScheduleForDay(s.id, dow, staffSchedules);
  const blocked = getBlockedSlotsForStaffDay(s.id, currentDate, allBlocked);

  const overlapLayout = useMemo(
    () => computeOverlapLayout(appointments),
    [appointments]
  );

  return (
    <div
      className={`relative flex-1 ${showBorder ? "border-s border-border/20" : ""} transition-opacity ${dimmed ? "opacity-30" : ""}`}
      onClick={(e) => onColumnClick(e, s.id)}
    >
      {/* ── Availability background layers ───────────── */}
      {!isOff && schedule && (
        <>
          {/* Before working hours: gray overlay */}
          <OffHoursOverlay
            startMins={0}
            endMins={timeToMinutes(schedule.startTime) - hourStart * 60}
            gridHeight={gridHeight}
            hourStart={hourStart}
          />
          {/* After working hours: gray overlay */}
          <OffHoursOverlay
            startMins={timeToMinutes(schedule.endTime) - hourStart * 60}
            endMins={totalMinutes}
            gridHeight={gridHeight}
            hourStart={hourStart}
          />
        </>
      )}

      {/* Full day off overlay */}
      {isOff && (
        <div
          className="absolute inset-0 z-[1] flex items-center justify-center bg-gray-100/60"
          style={{ height: gridHeight }}
        >
          <span className="rounded-md bg-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
            יום חופש
          </span>
        </div>
      )}

      {/* Blocked slot overlays */}
      {blocked.map((b) => (
        <BlockedSlotOverlay
          key={b.id}
          slot={b}
          hourStart={hourStart}
          gridHeight={gridHeight}
          reason={b.reason}
        />
      ))}

      {/* ── Appointment blocks ───────────────────────── */}
      {appointments.map((apt) => {
        const layout = overlapLayout.get(apt.id);
        return (
          <AptBlock
            key={apt.id}
            apt={apt}
            hourStart={hourStart}
            dateLocale={dateLocale}
            onAptClick={onAptClick}
            overlapIndex={layout?.overlapIndex ?? 0}
            overlapCount={layout?.overlapCount ?? 1}
          />
        );
      })}

      {/* ── Class blocks ─────────────────────────────── */}
      {classInstances.map((ci) => (
        <ClassBlock
          key={ci.id}
          instance={ci}
          hourStart={hourStart}
          dateLocale={dateLocale}
          isDragging={drag?.instanceId === ci.id && drag.hasMoved}
          onPointerDown={(e) => handleClassPointerDown(e, ci)}
          draggable={!!onClassTimeChange}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Off-hours overlay
// ---------------------------------------------------------------------------

function OffHoursOverlay({
  startMins,
  endMins,
  gridHeight,
  hourStart,
}: {
  startMins: number;
  endMins: number;
  gridHeight: number;
  hourStart: number;
}) {
  if (endMins <= startMins || endMins <= 0) return null;
  const clampedStart = Math.max(0, startMins);
  const top = (clampedStart / 60) * ROW_HEIGHT;
  const height = Math.min(((endMins - clampedStart) / 60) * ROW_HEIGHT, gridHeight - top);
  if (height <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[1] bg-gray-50/70"
      style={{ top, height }}
    />
  );
}

// ---------------------------------------------------------------------------
// Blocked slot overlay (break / blocked time)
// ---------------------------------------------------------------------------

function BlockedSlotOverlay({
  slot,
  hourStart,
  gridHeight,
  reason,
}: {
  slot: BlockedSlot;
  hourStart: number;
  gridHeight: number;
  reason: string | null;
}) {
  const startMins =
    getHoursInTz(slot.startTime) * 60 +
    getMinutesInTz(slot.startTime) -
    hourStart * 60;
  const endMins =
    getHoursInTz(slot.endTime) * 60 +
    getMinutesInTz(slot.endTime) -
    hourStart * 60;

  if (endMins <= startMins) return null;
  const clampedStart = Math.max(0, startMins);
  const top = (clampedStart / 60) * ROW_HEIGHT;
  const height = Math.min(
    ((endMins - clampedStart) / 60) * ROW_HEIGHT,
    gridHeight - top
  );
  if (height <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0.5 z-[2] rounded-sm overflow-hidden"
      style={{
        top,
        height,
        background:
          "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.04) 4px, rgba(0,0,0,0.04) 8px)",
      }}
    >
      {height > 20 && (
        <div className="flex h-full items-center justify-center">
          <span className="text-[9px] font-medium text-gray-400">
            {reason || "הפסקה"}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appointment block — status-colored, tiered content
// ---------------------------------------------------------------------------

function AptBlock({
  apt,
  hourStart,
  dateLocale,
  onAptClick,
  overlapIndex,
  overlapCount,
}: {
  apt: Appointment;
  hourStart: number;
  dateLocale: string;
  onAptClick: (apt: Appointment) => void;
  overlapIndex: number;
  overlapCount: number;
}) {
  const start = new Date(apt.startTime);
  const end = new Date(apt.endTime);
  const startMins =
    getHoursInTz(start) * 60 + getMinutesInTz(start) - hourStart * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  const top = (startMins / 60) * ROW_HEIGHT;
  const heightPx = Math.max(durationMins * PX_PER_MIN, 24);
  const style = getStatusStyle(apt.status);
  const tier: CardTier = getCardTier(heightPx);

  const timeStart = formatTime(start, dateLocale);
  const timeEnd = formatTime(end, dateLocale);
  const durLabel = `${Math.round(durationMins)}m`;

  if (startMins < 0) return null;

  const hasConflict = overlapCount > 1;
  const widthPct = hasConflict ? 100 / overlapCount : 100;
  const leftPct = hasConflict ? overlapIndex * widthPct : 0;

  return (
    <button
      type="button"
      data-event-block
      onClick={() => onAptClick(apt)}
      className={`absolute overflow-hidden rounded-lg border-s-[3px] ${style.border} text-start shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-black/10 ${style.bg} ${hasConflict ? "ring-1 ring-red-300/50" : ""}`}
      style={{
        top,
        height: heightPx,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
    >
      {tier === "tiny" && (
        <p className="flex items-center h-full px-1.5 text-[11px] truncate gap-1">
          <span className={`size-1.5 rounded-full shrink-0 ${style.dot}`} />
          <span className={`font-semibold ${style.text} tabular-nums`}>
            {timeStart}
          </span>
        </p>
      )}
      {tier === "small" && (
        <div className="px-1.5 py-0.5">
          <p className="flex items-center gap-1 text-[11px] leading-tight">
            <span className={`size-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className={`font-medium ${style.text} tabular-nums`}>
              {timeStart}-{timeEnd}
            </span>
          </p>
          <p className={`truncate text-xs font-semibold leading-tight ${style.text}`}>
            {apt.serviceName}
          </p>
        </div>
      )}
      {tier === "medium" && (
        <div className="px-2 py-1">
          <p className="flex items-center gap-1 text-[11px] leading-tight">
            <span className={`size-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className={`font-medium ${style.text} tabular-nums`}>
              {timeStart}-{timeEnd}
            </span>
            <span className="text-[10px] opacity-60">· {durLabel}</span>
          </p>
          <p className={`truncate text-xs font-bold leading-tight mt-0.5 ${style.text}`}>
            {apt.serviceName}
          </p>
          <p className={`truncate text-[11px] leading-tight mt-0.5 ${style.text} opacity-75`}>
            {apt.customerName}
          </p>
        </div>
      )}
      {tier === "large" && (
        <div className="px-2 py-1">
          <p className="flex items-center gap-1 text-[11px] leading-tight">
            <span className={`size-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span className={`font-medium ${style.text} tabular-nums`}>
              {timeStart}-{timeEnd}
            </span>
            <span className="text-[10px] opacity-60">· {durLabel}</span>
          </p>
          <p className={`truncate text-xs font-bold leading-tight mt-0.5 ${style.text}`}>
            {apt.serviceName}
          </p>
          <p className={`truncate text-[11px] leading-tight mt-0.5 ${style.text} opacity-75`}>
            {apt.customerName}
          </p>
          {(apt.status === "PENDING" || apt.status === "NO_SHOW") && (
            <span
              className={`inline-block mt-0.5 rounded px-1 py-0.5 text-[9px] font-semibold ${style.bg} ${style.text} border ${style.border}`}
            >
              {style.label}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Class block — violet themed, capacity bar
// ---------------------------------------------------------------------------

function ClassBlock({
  instance,
  hourStart,
  dateLocale,
  isDragging,
  onPointerDown,
  draggable,
}: {
  instance: ClassInstance;
  hourStart: number;
  dateLocale: string;
  isDragging?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  draggable?: boolean;
}) {
  const start = new Date(instance.startTime);
  const end = new Date(instance.endTime);
  const startMins =
    getHoursInTz(start) * 60 + getMinutesInTz(start) - hourStart * 60;
  const durationMins = (end.getTime() - start.getTime()) / 60_000;
  const top = (startMins / 60) * ROW_HEIGHT;
  const heightPx = Math.max(durationMins * PX_PER_MIN, 24);
  const timeStart = formatTime(start, dateLocale);
  const timeEnd = formatTime(end, dateLocale);
  const booked = instance.bookedCount ?? 0;
  const capacityStr = `${booked}/${instance.maxParticipants}`;
  const isFull = booked >= instance.maxParticipants;
  const tier = getCardTier(heightPx);

  if (startMins < 0) return null;

  return (
    <div
      data-event-block
      onPointerDown={onPointerDown}
      className={`absolute inset-x-1 overflow-hidden rounded-lg border-s-[3px] border-dashed text-start shadow-sm transition-shadow select-none ${
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
        isDragging
          ? "opacity-30"
          : "hover:shadow-md hover:ring-1 hover:ring-violet-300"
      } ${CLASS_STYLE.bg} ${CLASS_STYLE.border}`}
      style={{
        top,
        height: heightPx,
        borderColor: "#8B5CF6",
        touchAction: draggable ? "none" : undefined,
      }}
    >
      {tier === "tiny" && (
        <p className="flex items-center h-full px-1.5 text-[11px] truncate gap-1">
          <span className={`size-1.5 rounded-full shrink-0 ${CLASS_STYLE.dot}`} />
          <span className={`font-semibold ${CLASS_STYLE.text}`}>
            ⟳ {timeStart}
          </span>
        </p>
      )}
      {tier === "small" && (
        <div className="px-1.5 py-0.5">
          <p className={`truncate text-xs font-semibold leading-tight ${CLASS_STYLE.text}`}>
            ⟳ {instance.serviceName}
          </p>
          <p className={`text-[11px] leading-tight opacity-70 ${CLASS_STYLE.text}`}>
            {capacityStr} · {timeStart}
          </p>
        </div>
      )}
      {(tier === "medium" || tier === "large") && (
        <div className="px-2 py-1">
          <p className="flex items-center gap-1 text-[11px] leading-tight">
            <span className={`size-1.5 rounded-full shrink-0 ${CLASS_STYLE.dot}`} />
            <span className={`font-medium ${CLASS_STYLE.text} tabular-nums`}>
              {timeStart}-{timeEnd}
            </span>
          </p>
          <p className={`truncate text-xs font-bold leading-tight mt-0.5 ${CLASS_STYLE.text}`}>
            ⟳ {instance.serviceName}
          </p>
          {/* Capacity bar */}
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-violet-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : "bg-violet-500"}`}
                style={{
                  width: `${Math.min(100, (booked / instance.maxParticipants) * 100)}%`,
                }}
              />
            </div>
            <span className={`text-[10px] font-semibold tabular-nums ${isFull ? "text-red-600" : CLASS_STYLE.text}`}>
              {capacityStr}
            </span>
            {isFull && (
              <span className="rounded bg-red-100 px-1 text-[8px] font-bold text-red-600">
                FULL
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
