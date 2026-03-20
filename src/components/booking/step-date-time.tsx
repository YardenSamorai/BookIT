"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DayAvailability } from "@/lib/scheduling/types";
import { useT, useLocale } from "@/lib/i18n/locale-context";

interface StepDateTimeProps {
  businessId: string;
  serviceId: string;
  staffId: string;
  selectedDate: string;
  selectedTime: string;
  secondaryColor: string;
  durationMin: number;
  staffName?: string;
  staffImage?: string | null;
  onSelect: (date: string, startTime: string) => void;
  onBack: () => void;
}

function fmtSlotTime(iso: string, dateLocale: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: dateLocale === "en-US",
  });
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface ClassInstanceSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  bookedCount: number;
  staffId: string;
  staffName: string;
  serviceName: string;
}

const FEW_SLOTS_THRESHOLD = 3;

export function StepDateTime({
  businessId,
  serviceId,
  staffId,
  selectedDate,
  selectedTime,
  secondaryColor,
  durationMin,
  staffName,
  staffImage,
  onSelect,
  onBack,
}: StepDateTimeProps) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [activeDate, setActiveDate] = useState(selectedDate);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isGroupService, setIsGroupService] = useState(false);
  const [classInstanceSlots, setClassInstanceSlots] = useState<ClassInstanceSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthDir, setMonthDir] = useState(0);

  const timeSlotsRef = useRef<HTMLDivElement>(null);

  const monthCells = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const lastDayNum = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ businessId, serviceId, staffId, dateFrom, dateTo });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data: { days: DayAvailability[]; isGroup: boolean; maxParticipants: number; classInstances?: ClassInstanceSlot[] }) => {
        const days = data.days ?? data;
        setAvailability(Array.isArray(days) ? days : []);
        setIsGroupService(data.isGroup ?? false);
        setClassInstanceSlots(data.classInstances ?? []);

        const hasClassSchedule = (data.classInstances ?? []).length > 0;

        if (!activeDate) {
          if (hasClassSchedule) {
            const firstCI = (data.classInstances ?? []).find((ci) => ci.bookedCount < ci.maxParticipants);
            if (firstCI) setActiveDate(firstCI.date);
          } else {
            const arr = Array.isArray(days) ? days : [];
            const first = arr.find((d: DayAvailability) =>
              d.staffAvailability.some((sa) => sa.slots.length > 0)
            );
            if (first) setActiveDate(first.date);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [businessId, serviceId, staffId, dateFrom, dateTo]);

  const hasClassSchedule = classInstanceSlots.length > 0;
  const activeDateCIs = classInstanceSlots.filter((ci) => ci.date === activeDate);

  const slotCountMap = useMemo(() => {
    const map = new Map<string, number>();

    if (hasClassSchedule) {
      classInstanceSlots.forEach((ci) => {
        const spotsLeft = ci.maxParticipants - ci.bookedCount;
        map.set(ci.date, (map.get(ci.date) ?? 0) + (spotsLeft > 0 ? 1 : 0));
      });
    } else {
      availability.forEach((d) => {
        const count = d.staffAvailability.reduce((sum, sa) => sum + sa.slots.length, 0);
        map.set(d.date, count);
      });
    }
    return map;
  }, [availability, classInstanceSlots, hasClassSchedule]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    if (hasClassSchedule) {
      classInstanceSlots.forEach((ci) => {
        if (ci.bookedCount < ci.maxParticipants) set.add(ci.date);
      });
    } else {
      availability.forEach((d) => {
        if (d.staffAvailability.some((sa) => sa.slots.length > 0)) set.add(d.date);
      });
    }
    return set;
  }, [availability, classInstanceSlots, hasClassSchedule]);

  const daySlots = availability.find((d) => d.date === activeDate);
  const allSlots =
    daySlots?.staffAvailability.flatMap((sa) =>
      sa.slots.map((slot) => ({
        staffId: sa.staffId,
        staffName: sa.staffName,
        start: slot.start,
        end: slot.end,
        bookedCount: slot.bookedCount,
        maxParticipants: slot.maxParticipants,
      }))
    ) ?? [];

  const uniqueTimes = Array.from(
    new Map(allSlots.map((s) => [new Date(s.start).toISOString(), s])).values()
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  function getSlotHour(s: { start: Date }) {
    const d = s.start instanceof Date ? s.start : new Date(s.start as unknown as string);
    return d.getHours();
  }

  const morningSlots = uniqueTimes.filter((s) => getSlotHour(s) < 12);
  const afternoonSlots = uniqueTimes.filter((s) => { const h = getSlotHour(s); return h >= 12 && h < 17; });
  const eveningSlots = uniqueTimes.filter((s) => getSlotHour(s) >= 17);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const dayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(dateLocale, { weekday: "narrow" });
    });
  }, [dateLocale]);

  function prevMonth() {
    setMonthDir(-1);
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }

  function nextMonth() {
    setMonthDir(1);
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }

  const isPrevDisabled = viewYear === now.getFullYear() && viewMonth <= now.getMonth();

  const activeDateFormatted = activeDate
    ? new Date(activeDate + "T00:00:00").toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  function handleDateClick(dateStr: string) {
    setActiveDate(dateStr);
    // Scroll to time slots after a short delay to let React render
    setTimeout(() => {
      timeSlotsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleTimeClick(iso: string) {
    setPickedTime(iso);
  }

  function handleConfirmTime() {
    if (pickedTime && activeDate) {
      onSelect(activeDate, pickedTime);
    }
  }

  useEffect(() => {
    setPickedTime(null);
  }, [activeDate]);

  const pickedEndTime = pickedTime
    ? new Date(new Date(pickedTime).getTime() + durationMin * 60_000).toISOString()
    : null;

  /**
   * Determine the status indicator color for a calendar day cell.
   * - green:  available with plenty of slots
   * - orange: available but few slots left (≤ FEW_SLOTS_THRESHOLD)
   * - red:    future date with zero available slots (closed / fully booked)
   * - null:   past date or not in data range (no indicator)
   */
  function getDayStatus(dateStr: string, isPast: boolean): "green" | "orange" | "red" | null {
    if (isPast) return null;
    const count = slotCountMap.get(dateStr);
    if (count === undefined || count === 0) return "red";
    if (count <= FEW_SLOTS_THRESHOLD) return "orange";
    return "green";
  }

  const STATUS_COLORS = {
    green: "#22c55e",
    orange: "#f59e0b",
    red: "#ef4444",
  };

  return (
    <div className="flex flex-1 flex-col pb-24">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("book.change_service")}
        </button>

        {staffName && (
          <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-white py-1 pe-3 ps-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {staffImage ? (
              <img src={staffImage} alt={staffName} className="size-6 rounded-full object-cover ring-1 ring-black/5" />
            ) : (
              <div
                className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                {staffName.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-gray-500">{staffName}</span>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold tracking-tight text-gray-900">
        {t("book.pick_datetime")}
      </h2>

      {/* Calendar card */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        {/* Month header */}
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            disabled={isPrevDisabled}
            onClick={prevMonth}
            className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700 disabled:opacity-20"
          >
            <ChevronLeft className="size-4" />
          </button>

          <AnimatePresence mode="wait" custom={monthDir}>
            <motion.span
              key={`${viewYear}-${viewMonth}`}
              custom={monthDir}
              initial={{ opacity: 0, y: monthDir > 0 ? 12 : -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: monthDir > 0 ? -12 : 12 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-gray-800"
            >
              {new Date(viewYear, viewMonth).toLocaleDateString(dateLocale, {
                month: "long",
                year: "numeric",
              })}
            </motion.span>
          </AnimatePresence>

          <button
            type="button"
            onClick={nextMonth}
            className="flex size-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Day labels */}
        <div className="mt-3 grid grid-cols-7 px-3 text-center">
          {dayLabels.map((label, i) => (
            <span key={i} className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
              {label}
            </span>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-4 text-center">
          {monthCells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="h-11" />;

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isAvailable = availableDates.has(dateStr);
            const isActive = activeDate === dateStr;
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;
            const status = !loading ? getDayStatus(dateStr, isPast) : null;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast || !isAvailable}
                onClick={() => handleDateClick(dateStr)}
                className="group relative mx-auto flex size-11 flex-col items-center justify-center rounded-xl text-[13px] transition-all duration-200"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeDate"
                    className="absolute inset-0.5 rounded-xl"
                    style={{
                      backgroundColor: secondaryColor,
                      boxShadow: `0 3px 12px ${secondaryColor}35`,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive
                      ? "font-bold text-white"
                      : isToday
                        ? "font-bold"
                        : isAvailable && !isPast
                          ? "font-medium text-gray-700 group-hover:text-gray-900"
                          : isPast
                            ? "text-gray-200"
                            : "text-gray-300"
                  }`}
                  style={isToday && !isActive ? { color: secondaryColor } : undefined}
                >
                  {day}
                </span>
                {/* Status dot */}
                {status && !isActive && (
                  <span
                    className="relative z-10 mt-0.5 size-[5px] rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                )}
                {/* White dot when active */}
                {isActive && (
                  <span className="relative z-10 mt-0.5 size-[5px] rounded-full bg-white/70" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        {!loading && (
          <div className="flex items-center justify-center gap-4 border-t border-gray-50 px-4 py-2.5">
            <LegendItem color={STATUS_COLORS.green} label={t("book.available_times")} />
            <LegendItem color={STATUS_COLORS.orange} label={t("book.few_left")} />
            <LegendItem color={STATUS_COLORS.red} label={t("book.unavailable")} />
          </div>
        )}
      </div>

      {/* Time slots section */}
      <div className="mt-5 scroll-mt-4" ref={timeSlotsRef}>
        {activeDate && !loading && (hasClassSchedule ? activeDateCIs.length > 0 : uniqueTimes.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2.5"
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${secondaryColor}10`, color: secondaryColor }}
            >
              <CalendarDays className="size-4" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-800">{activeDateFormatted}</p>
              <p className="text-[11px] text-gray-400">{t("book.select_time")}</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-10"
            >
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: `${secondaryColor}10` }}
              >
                <Loader2 className="size-5 animate-spin" style={{ color: secondaryColor }} />
              </div>
              <p className="mt-3 text-xs text-gray-400">{t("book.loading_availability")}</p>
            </motion.div>
          ) : hasClassSchedule && activeDate ? (
            activeDateCIs.length === 0 ? (
              <motion.div
                key="empty-ci"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center"
              >
                <CalendarDays className="size-8 text-gray-200" />
                <p className="mt-3 text-sm font-medium text-gray-400">{t("book.no_times")}</p>
                <p className="mt-1 text-xs text-gray-300">{t("book.try_another")}</p>
              </motion.div>
            ) : (
              <motion.div
                key={`ci-${activeDate}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {activeDateCIs.map((ci, i) => {
                  const startDate = new Date(ci.startTime);
                  const endDate = new Date(ci.endTime);
                  const spotsLeft = ci.maxParticipants - ci.bookedCount;
                  const isFull = spotsLeft <= 0;
                  const isSelected = pickedTime === ci.startTime;

                  return (
                    <motion.button
                      key={ci.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => handleTimeClick(ci.startTime)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 transition-all ${
                        isFull
                          ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50"
                          : isSelected
                            ? "border-transparent text-white"
                            : "border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: secondaryColor, boxShadow: `0 4px 16px ${secondaryColor}40` }
                          : undefined
                      }
                    >
                      <div className="text-start">
                        <p className={`text-base font-bold ${isSelected ? "text-white" : "text-gray-800"}`} dir="ltr">
                          {fmtSlotTime(ci.startTime, dateLocale)} – {fmtSlotTime(ci.endTime, dateLocale)}
                        </p>
                        <p className={`mt-0.5 text-xs ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                          {ci.staffName}
                        </p>
                      </div>
                      <div className="text-end">
                        {isFull ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                            {t("cls.full")}
                          </span>
                        ) : (
                          <span className={`text-sm font-semibold ${isSelected ? "text-white/90" : spotsLeft <= 3 ? "text-orange-500" : "text-green-600"}`}>
                            {spotsLeft} {t("cls.spots_left")}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )
          ) : uniqueTimes.length === 0 && activeDate ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-10 text-center"
            >
              <CalendarDays className="size-8 text-gray-200" />
              <p className="mt-3 text-sm font-medium text-gray-400">{t("book.no_times")}</p>
              <p className="mt-1 text-xs text-gray-300">{t("book.try_another")}</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeDate}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <TimeGroup
                label={t("book.morning")}
                icon={<Sun className="size-3.5" />}
                iconBg="#FEF3C7"
                iconColor="#D97706"
                slots={morningSlots}
                pickedTime={pickedTime}
                activeDate={activeDate}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
                durationMin={durationMin}
                isGroup={isGroupService}
                onTimeClick={handleTimeClick}
              />
              <TimeGroup
                label={t("book.afternoon")}
                icon={<Sunset className="size-3.5" />}
                iconBg="#FEE2E2"
                iconColor="#DC2626"
                slots={afternoonSlots}
                pickedTime={pickedTime}
                activeDate={activeDate}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
                durationMin={durationMin}
                isGroup={isGroupService}
                onTimeClick={handleTimeClick}
              />
              <TimeGroup
                label={t("book.evening")}
                icon={<Moon className="size-3.5" />}
                iconBg="#EDE9FE"
                iconColor="#7C3AED"
                slots={eveningSlots}
                pickedTime={pickedTime}
                activeDate={activeDate}
                secondaryColor={secondaryColor}
                dateLocale={dateLocale}
                durationMin={durationMin}
                isGroup={isGroupService}
                onTimeClick={handleTimeClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating confirm bar */}
      <AnimatePresence>
        {pickedTime && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-xl"
          >
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-800">{activeDateFormatted}</p>
                <p className="text-[12px] text-gray-400" dir="ltr">
                  <Clock className="me-1 inline size-3" />
                  {fmtSlotTime(pickedTime, dateLocale)} – {pickedEndTime && fmtSlotTime(pickedEndTime, dateLocale)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConfirmTime}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
                  boxShadow: `0 4px 16px ${secondaryColor}35`,
                }}
              >
                {t("book.continue")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Legend item ---------- */

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-[6px] rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

/* ---------- Slot item type ---------- */

interface SlotItem {
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  bookedCount?: number;
  maxParticipants?: number;
}

/* ---------- Time group ---------- */

function TimeGroup({
  label,
  icon,
  iconBg,
  iconColor,
  slots,
  pickedTime,
  activeDate,
  secondaryColor,
  dateLocale,
  durationMin,
  isGroup,
  onTimeClick,
}: {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  slots: SlotItem[];
  pickedTime: string | null;
  activeDate: string;
  secondaryColor: string;
  dateLocale: string;
  durationMin: number;
  isGroup: boolean;
  onTimeClick: (iso: string) => void;
}) {
  if (slots.length === 0) return null;

  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <div
          className="flex size-6 items-center justify-center rounded-md"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <span className="text-[12px] font-semibold text-gray-500">{label}</span>
        <span className="text-[11px] text-gray-300">({slots.length})</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot, i) => {
          const startDate = slot.start instanceof Date ? slot.start : new Date(slot.start as unknown as string);
          const iso = startDate.toISOString();
          const endDate = new Date(startDate.getTime() + durationMin * 60_000);
          const isSelected = pickedTime === iso;

          const spotsLeft = isGroup && slot.maxParticipants
            ? slot.maxParticipants - (slot.bookedCount ?? 0)
            : null;

          return (
            <motion.button
              key={iso}
              type="button"
              onClick={() => onTimeClick(iso)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.15 }}
              className={`relative flex flex-col items-center rounded-xl border py-2.5 transition-all duration-200 ${
                isSelected
                  ? "border-transparent text-white"
                  : "border-gray-100 bg-white text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-gray-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] active:scale-[0.97]"
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: secondaryColor,
                      boxShadow: `0 4px 16px ${secondaryColor}40`,
                    }
                  : undefined
              }
            >
              <span className="text-[14px] font-semibold" dir="ltr">
                {fmtSlotTime(iso, dateLocale)}
              </span>
              <span
                className={`mt-0.5 text-[10px] ${isSelected ? "text-white/70" : "text-gray-300"}`}
                dir="ltr"
              >
                {fmtSlotTime(endDate.toISOString(), dateLocale)}
              </span>
              {spotsLeft !== null && (
                <span
                  className={`mt-1 text-[9px] font-medium ${
                    isSelected
                      ? "text-white/80"
                      : spotsLeft <= 3
                        ? "text-orange-500"
                        : "text-gray-400"
                  }`}
                >
                  {slot.bookedCount}/{slot.maxParticipants}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
