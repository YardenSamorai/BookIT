"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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

function formatSlotTime(iso: string, dateLocale: string): string {
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
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isGroupService, setIsGroupService] = useState(false);
  const [loading, setLoading] = useState(false);

  const monthCells = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const lastDayNum = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      businessId,
      serviceId,
      staffId,
      dateFrom,
      dateTo,
    });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data: { days: DayAvailability[]; isGroup: boolean; maxParticipants: number }) => {
        const days = data.days ?? data;
        setAvailability(Array.isArray(days) ? days : []);
        setIsGroupService(data.isGroup ?? false);
        if (!activeDate) {
          const arr = Array.isArray(days) ? days : [];
          const first = arr.find((d: DayAvailability) =>
            d.staffAvailability.some((sa) => sa.slots.length > 0)
          );
          if (first) setActiveDate(first.date);
        }
      })
      .finally(() => setLoading(false));
  }, [businessId, serviceId, staffId, dateFrom, dateTo]);

  const availableDates = useMemo(() => {
    const set = new Set<string>();
    availability.forEach((d) => {
      if (d.staffAvailability.some((sa) => sa.slots.length > 0)) {
        set.add(d.date);
      }
    });
    return set;
  }, [availability]);

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
    new Map(
      allSlots.map((s) => [new Date(s.start).toISOString(), s])
    ).values()
  ).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  function getSlotHour(s: { start: Date }) {
    const d =
      s.start instanceof Date
        ? s.start
        : new Date(s.start as unknown as string);
    return d.getHours();
  }

  const morningSlots = uniqueTimes.filter((s) => getSlotHour(s) < 12);
  const afternoonSlots = uniqueTimes.filter((s) => {
    const h = getSlotHour(s);
    return h >= 12 && h < 17;
  });
  const eveningSlots = uniqueTimes.filter((s) => getSlotHour(s) >= 17);

  const todayStr = now.toISOString().slice(0, 10);

  const dayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(dateLocale, { weekday: "narrow" });
    });
  }, [dateLocale]);

  function prevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const isPrevDisabled =
    viewYear === now.getFullYear() && viewMonth <= now.getMonth();

  return (
    <div className="flex flex-1 flex-col">
      {/* Back + staff chip row */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          <ChevronLeft className="size-4" />
          {t("book.change_service")}
        </button>

        {staffName && (
          <div className="flex items-center gap-2 rounded-full bg-gray-50 py-1 pe-3 ps-1">
            {staffImage ? (
              <img
                src={staffImage}
                alt={staffName}
                className="size-6 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                {staffName.charAt(0)}
              </div>
            )}
            <span className="text-xs font-medium text-gray-500">
              {staffName}
            </span>
          </div>
        )}
      </div>

      <h2 className="text-lg font-bold text-gray-900">
        {t("book.pick_datetime")}
      </h2>

      {/* Calendar card */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Month header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={isPrevDisabled}
            onClick={prevMonth}
            className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold text-gray-800">
            {new Date(viewYear, viewMonth).toLocaleDateString(dateLocale, {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Day-of-week labels */}
        <div className="mt-3 grid grid-cols-7 text-center">
          {dayLabels.map((label, i) => (
            <span
              key={i}
              className="pb-2 text-[11px] font-semibold text-gray-400"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 text-center">
          {monthCells.map((day, idx) => {
            if (day === null) {
              return <div key={`e-${idx}`} className="h-9" />;
            }

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isAvailable = availableDates.has(dateStr);
            const isActive = activeDate === dateStr;
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isPast || !isAvailable}
                onClick={() => setActiveDate(dateStr)}
                className={`mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-all ${
                  isActive
                    ? "font-bold text-white"
                    : isToday
                      ? "font-semibold"
                      : isAvailable && !isPast
                        ? "font-medium text-gray-700 hover:bg-gray-50"
                        : "text-gray-300"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: secondaryColor,
                        boxShadow: `0 2px 8px ${secondaryColor}40`,
                      }
                    : isToday && !isActive
                      ? { color: secondaryColor }
                      : undefined
                }
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="mt-4">
        {loading ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="size-6 animate-spin text-gray-300" />
            <p className="mt-2 text-xs text-gray-400">
              {t("book.loading_availability")}
            </p>
          </div>
        ) : uniqueTimes.length === 0 && activeDate ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
            <p className="text-sm text-gray-400">{t("book.no_times")}</p>
            <p className="mt-1 text-xs text-gray-300">
              {t("book.try_another")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <TimeGroup
              label={t("book.morning")}
              slots={morningSlots}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              activeDate={activeDate}
              secondaryColor={secondaryColor}
              dateLocale={dateLocale}
              isGroup={isGroupService}
              onSelect={onSelect}
            />
            <TimeGroup
              label={t("book.afternoon")}
              slots={afternoonSlots}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              activeDate={activeDate}
              secondaryColor={secondaryColor}
              dateLocale={dateLocale}
              isGroup={isGroupService}
              onSelect={onSelect}
            />
            <TimeGroup
              label={t("book.evening")}
              slots={eveningSlots}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              activeDate={activeDate}
              secondaryColor={secondaryColor}
              dateLocale={dateLocale}
              isGroup={isGroupService}
              onSelect={onSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface SlotItem {
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  bookedCount?: number;
  maxParticipants?: number;
}

function TimeGroup({
  label,
  slots,
  selectedDate,
  selectedTime,
  activeDate,
  secondaryColor,
  dateLocale,
  isGroup,
  onSelect,
}: {
  label: string;
  slots: SlotItem[];
  selectedDate: string;
  selectedTime: string;
  activeDate: string;
  secondaryColor: string;
  dateLocale: string;
  isGroup: boolean;
  onSelect: (date: string, startTime: string) => void;
}) {
  if (slots.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const startDate =
            slot.start instanceof Date
              ? slot.start
              : new Date(slot.start as unknown as string);
          const iso = startDate.toISOString();
          const isSelected =
            selectedTime === iso && activeDate === selectedDate;

          const spotsLeft = isGroup && slot.maxParticipants
            ? slot.maxParticipants - (slot.bookedCount ?? 0)
            : null;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(activeDate, iso)}
              className={`flex flex-col items-center rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-transparent text-white shadow-md"
                  : "border-gray-100 bg-white text-gray-700 shadow-sm hover:border-gray-200 hover:shadow-md"
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: secondaryColor,
                      boxShadow: `0 2px 10px ${secondaryColor}40`,
                    }
                  : undefined
              }
            >
              <span dir="ltr">{formatSlotTime(iso, dateLocale)}</span>
              {spotsLeft !== null && (
                <span
                  className={`mt-0.5 text-[10px] font-normal ${
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
