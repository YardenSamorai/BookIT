"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { rescheduleAppointment } from "@/actions/booking";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { BUSINESS_TZ } from "@/lib/tz";
import type { DayAvailability } from "@/lib/scheduling/types";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  businessId: string;
  serviceId: string;
  currentStaffId: string;
  secondaryColor: string;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointmentId,
  businessId,
  serviceId,
  currentStaffId,
  secondaryColor,
}: RescheduleDialogProps) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  const router = useRouter();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [activeDate, setActiveDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const dateFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const lastDayNum = new Date(viewYear, viewMonth + 1, 0).getDate();
  const dateTo = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(lastDayNum).padStart(2, "0")}`;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const params = new URLSearchParams({
      businessId,
      serviceId,
      staffId: currentStaffId,
      dateFrom,
      dateTo,
    });
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data: { days: DayAvailability[] }) => {
        const days = data.days ?? data;
        setAvailability(Array.isArray(days) ? days : []);
      })
      .finally(() => setLoading(false));
  }, [open, businessId, serviceId, currentStaffId, dateFrom, dateTo]);

  useEffect(() => {
    if (!open) {
      setActiveDate("");
      setSelectedTime("");
      setSuccess(false);
      setError("");
    }
  }, [open]);

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
      sa.slots.map((slot) => ({ start: slot.start }))
    ) ?? [];

  const uniqueTimes = Array.from(
    new Map(
      allSlots.map((s) => [new Date(s.start).toISOString(), s])
    ).values()
  ).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const monthCells = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  async function handleConfirm() {
    if (!selectedTime) return;
    setSubmitting(true);
    setError("");
    const result = await rescheduleAppointment(appointmentId, selectedTime);
    setSubmitting(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        router.refresh();
      }, 1500);
    } else {
      setError(result.error);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  const dayHeaders = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, i).toLocaleDateString(dateLocale, { weekday: "narrow" })
  );

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-12 text-green-500" />
            <p className="text-lg font-semibold">{t("myapt.reschedule_success")}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("myapt.reschedule_title")}</DialogTitle>
          <DialogDescription>{t("myapt.reschedule_desc")}</DialogDescription>
        </DialogHeader>

        {/* Mini calendar */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("myapt.select_date")}
          </label>
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="rounded p-1 hover:bg-gray-100">
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-medium">{monthLabel}</span>
              <button type="button" onClick={nextMonth} className="rounded p-1 hover:bg-gray-100">
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
              {dayHeaders.map((d, i) => (
                <div key={i} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthCells.map((cell, i) => {
                if (!cell) return <div key={i} />;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(cell).padStart(2, "0")}`;
                const isAvailable = availableDates.has(dateStr);
                const isActive = activeDate === dateStr;
                const isPast = new Date(dateStr) < new Date(new Date().toDateString());
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!isAvailable || isPast}
                    onClick={() => {
                      setActiveDate(dateStr);
                      setSelectedTime("");
                    }}
                    className={`rounded-md py-1.5 text-xs transition-colors ${
                      isActive
                        ? "font-bold text-white"
                        : isAvailable && !isPast
                          ? "hover:bg-gray-100 font-medium text-gray-900"
                          : "text-gray-300 cursor-default"
                    }`}
                    style={isActive ? { backgroundColor: secondaryColor } : undefined}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time slots */}
        {activeDate && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t("myapt.select_time")}
            </label>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-gray-400" />
              </div>
            ) : uniqueTimes.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">{t("myapt.no_slots")}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {uniqueTimes.map((slot) => {
                  const iso = new Date(slot.start).toISOString();
                  const isSelected = selectedTime === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedTime(iso)}
                      className={`rounded-lg border py-2 text-sm transition-colors ${
                        isSelected
                          ? "border-transparent font-semibold text-white"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={isSelected ? { backgroundColor: secondaryColor } : undefined}
                    >
                      {new Date(slot.start).toLocaleTimeString(dateLocale, {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: dateLocale === "en-US",
                        timeZone: BUSINESS_TZ,
                      })}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTime || submitting}
            style={{ backgroundColor: secondaryColor }}
          >
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("myapt.reschedule")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}
