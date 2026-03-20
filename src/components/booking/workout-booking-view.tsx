"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Dumbbell,
  User,
  Loader2,
  Check,
  Calendar,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { getDir } from "@/lib/i18n";
import { createAppointment } from "@/actions/booking";
import { BookingAuth } from "./booking-auth";

interface WorkoutInstance {
  id: string;
  classScheduleId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  bookedCount: number;
  serviceName: string;
  staffName: string;
  scheduleTitle: string | null;
}

interface WorkoutBookingViewProps {
  businessId: string;
  businessName: string;
  secondaryColor: string;
  primaryColor: string;
}

type ViewState = "calendar" | "confirm" | "auth" | "success";

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function WorkoutBookingView({
  businessId,
  businessName,
  secondaryColor,
  primaryColor,
}: WorkoutBookingViewProps) {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const { data: session } = useSession();

  const dayNames = locale === "he" ? DAYS_HE : DAYS_EN;

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [instances, setInstances] = useState<WorkoutInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<WorkoutInstance | null>(null);
  const [viewState, setViewState] = useState<ViewState>("calendar");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [weekDir, setWeekDir] = useState(0);
  const [appointmentId, setAppointmentId] = useState("");

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const dateFrom = useMemo(
    () =>
      `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`,
    [weekStart]
  );
  const dateTo = useMemo(
    () =>
      `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, "0")}-${String(weekEnd.getDate()).padStart(2, "0")}`,
    [weekEnd]
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workout-instances?businessId=${businessId}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then((r) => r.json())
      .then((data) => {
        setInstances(data.instances ?? []);
      })
      .catch(() => setInstances([]))
      .finally(() => setLoading(false));
  }, [businessId, dateFrom, dateTo]);

  const weekDays = useMemo(() => {
    const days: { date: Date; dateStr: string; dayIdx: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      days.push({ date: d, dateStr: `${y}-${m}-${day}`, dayIdx: d.getDay() });
    }
    return days;
  }, [weekStart]);

  const instancesByDay = useMemo(() => {
    const map: Record<string, WorkoutInstance[]> = {};
    for (const inst of instances) {
      if (!map[inst.date]) map[inst.date] = [];
      map[inst.date].push(inst);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    }
    return map;
  }, [instances]);

  const today = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }, []);

  const prevWeek = useCallback(() => {
    const newStart = addDays(weekStart, -7);
    if (newStart < getWeekStart(new Date())) return;
    setWeekDir(-1);
    setWeekStart(newStart);
  }, [weekStart]);

  const nextWeek = useCallback(() => {
    setWeekDir(1);
    setWeekStart(addDays(weekStart, 7));
  }, [weekStart]);

  const isPrevDisabled = addDays(weekStart, -7) < getWeekStart(new Date());

  function handleSelectInstance(inst: WorkoutInstance) {
    if (inst.bookedCount >= inst.maxParticipants) return;
    if (new Date(inst.startTime) < new Date()) return;
    setSelectedInstance(inst);
    setError("");

    if (!session?.user?.id) {
      setViewState("auth");
    } else {
      setViewState("confirm");
    }
  }

  function handleAuthComplete() {
    setViewState("confirm");
  }

  async function handleConfirmBooking() {
    if (!session?.user?.id || !selectedInstance) return;
    setBooking(true);
    setError("");

    const result = await createAppointment(businessId, session.user.id, {
      serviceId: selectedInstance.serviceId,
      staffId: selectedInstance.staffId,
      startTime: selectedInstance.startTime,
      classInstanceId: selectedInstance.id,
    });

    if (!result.success) {
      if (result.error === "ALREADY_REGISTERED") {
        setError(t("book.workout_already_registered" as Parameters<typeof t>[0]));
      } else {
        setError(result.error);
      }
      setBooking(false);
      return;
    }

    setAppointmentId(result.data!.appointmentId);
    setViewState("success");
    setBooking(false);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: [secondaryColor, primaryColor, "#fbbf24", "#34d399"],
    });
  }

  function handleBackToCalendar() {
    setSelectedInstance(null);
    setViewState("calendar");
    setError("");
    setLoading(true);
    fetch(`/api/workout-instances?businessId=${businessId}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      .then((r) => r.json())
      .then((data) => setInstances(data.instances ?? []))
      .catch(() => setInstances([]))
      .finally(() => setLoading(false));
  }

  if (viewState === "auth" && selectedInstance) {
    return (
      <div className="flex flex-1 flex-col">
        <button
          onClick={handleBackToCalendar}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronRight className={dir === "rtl" ? "" : "rotate-180"} size={16} />
          <span>{t("common.back" as Parameters<typeof t>[0])}</span>
        </button>
        <BookingAuth secondaryColor={secondaryColor} onAuthenticated={handleAuthComplete} />
      </div>
    );
  }

  if (viewState === "confirm" && selectedInstance) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col"
      >
        <button
          onClick={handleBackToCalendar}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronRight className={dir === "rtl" ? "" : "rotate-180"} size={16} />
          <span>{t("common.back" as Parameters<typeof t>[0])}</span>
        </button>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${secondaryColor}15` }}
          >
            <Dumbbell size={28} style={{ color: secondaryColor }} />
          </div>

          <h3 className="mb-1 text-center text-lg font-bold text-gray-900">
            {selectedInstance.scheduleTitle || selectedInstance.serviceName}
          </h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar size={16} className="shrink-0 text-gray-400" />
              <span>
                {new Date(selectedInstance.startTime).toLocaleDateString(
                  locale === "he" ? "he-IL" : "en-US",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock size={16} className="shrink-0 text-gray-400" />
              <span>
                {formatTime(selectedInstance.startTime)} - {formatTime(selectedInstance.endTime)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <User size={16} className="shrink-0 text-gray-400" />
              <span>
                {t("book.workout_with" as Parameters<typeof t>[0]).replace("{name}", selectedInstance.staffName)}
              </span>
            </div>
            {(() => {
              const spots = selectedInstance.maxParticipants - selectedInstance.bookedCount;
              return spots <= 3 ? (
                <div className="flex items-center gap-3 text-amber-600">
                  <Users size={16} className="shrink-0" />
                  <span className="font-medium">
                    {t("book.workout_last_spots" as Parameters<typeof t>[0]).replace("{n}", String(spots))}
                  </span>
                </div>
              ) : null;
            })()}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handleConfirmBooking}
            disabled={booking}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: secondaryColor }}
          >
            {booking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Check size={18} />
                {t("book.workout_register" as Parameters<typeof t>[0])}
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  if (viewState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-1 flex-col items-center justify-center py-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mb-6 flex size-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${secondaryColor}15` }}
        >
          <Sparkles size={36} style={{ color: secondaryColor }} />
        </motion.div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">
          {t("book.workout_registered" as Parameters<typeof t>[0])}
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          {t("book.workout_registered_desc" as Parameters<typeof t>[0])}
        </p>

        {selectedInstance && (
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 text-start shadow-sm">
            <div className="mb-3 text-sm font-semibold text-gray-900">
              {selectedInstance.scheduleTitle || selectedInstance.serviceName}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                {new Date(selectedInstance.startTime).toLocaleDateString(
                  locale === "he" ? "he-IL" : "en-US",
                  { weekday: "long", month: "long", day: "numeric" }
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                {formatTime(selectedInstance.startTime)} - {formatTime(selectedInstance.endTime)}
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                {selectedInstance.staffName}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleBackToCalendar}
          className="mt-6 text-sm font-medium transition-colors hover:underline"
          style={{ color: secondaryColor }}
        >
          {t("book.back_to_site" as Parameters<typeof t>[0])}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevWeek}
          disabled={isPrevDisabled}
          className="flex size-9 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-30"
        >
          {dir === "rtl" ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <div className="text-sm font-semibold text-gray-800">
          {formatDate(weekStart, locale)} – {formatDate(weekEnd, locale)}
        </div>
        <button
          onClick={nextWeek}
          className="flex size-9 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition-all hover:bg-gray-50"
        >
          {dir === "rtl" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && instances.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-gray-50">
            <Dumbbell size={24} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">
            {t("book.workout_no_upcoming" as Parameters<typeof t>[0])}
          </p>
        </div>
      )}

      {/* Week grid */}
      {!loading && instances.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={dateFrom}
            initial={{ opacity: 0, x: weekDir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: weekDir * -40 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {weekDays.map(({ date, dateStr, dayIdx }) => {
              const dayInstances = instancesByDay[dateStr] ?? [];
              const isToday = dateStr === today;
              const isPast = dateStr < today;

              if (dayInstances.length === 0 && isPast) return null;

              return (
                <div key={dateStr}>
                  {/* Day header */}
                  <div
                    className={`mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2 ${
                      isToday ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase">
                      {dayNames[dayIdx]}
                    </span>
                    <span className={`text-xs ${isToday ? "text-gray-300" : "text-gray-400"}`}>
                      {date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Day instances */}
                  {dayInstances.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-300">—</div>
                  ) : (
                    <div className="space-y-1.5 px-1">
                      {dayInstances.map((inst) => {
                        const isFull = inst.bookedCount >= inst.maxParticipants;
                        const isExpired = new Date(inst.startTime) < new Date();
                        const spotsLeft = inst.maxParticipants - inst.bookedCount;
                        const fillPercent = (inst.bookedCount / inst.maxParticipants) * 100;
                        const canBook = !isFull && !isExpired;

                        return (
                          <motion.button
                            key={inst.id}
                            whileTap={canBook ? { scale: 0.98 } : undefined}
                            onClick={() => canBook && handleSelectInstance(inst)}
                            disabled={!canBook}
                            className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-all ${
                              canBook
                                ? "border-gray-100 bg-white shadow-sm hover:border-gray-200 hover:shadow-md"
                                : "border-gray-50 bg-gray-50/50 opacity-60"
                            }`}
                          >
                            {/* Time badge */}
                            <div
                              className="flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5"
                              style={{
                                backgroundColor: canBook ? `${secondaryColor}12` : "#f3f4f6",
                              }}
                            >
                              <span
                                className="text-xs font-bold"
                                style={{ color: canBook ? secondaryColor : "#9ca3af" }}
                              >
                                {formatTime(inst.startTime)}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {formatTime(inst.endTime)}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {inst.scheduleTitle || inst.serviceName}
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User size={11} />
                                  {inst.staffName}
                                </span>
                              </div>
                            </div>

                            {/* Spots indicator - only show when nearly full or full */}
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {isFull ? (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">
                                  {t("book.workout_full" as Parameters<typeof t>[0])}
                                </span>
                              ) : isExpired ? (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                                  —
                                </span>
                              ) : spotsLeft <= 3 ? (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: spotsLeft === 1 ? "#fef2f2" : "#fff7ed",
                                    color: spotsLeft === 1 ? "#ef4444" : "#ea580c",
                                  }}
                                >
                                  {t("book.workout_last_spots" as Parameters<typeof t>[0]).replace("{n}", String(spotsLeft))}
                                </span>
                              ) : null}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
