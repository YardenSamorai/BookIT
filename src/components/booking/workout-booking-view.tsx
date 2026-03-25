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
  Ticket,
  BadgeCheck,
  CircleCheck,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { getDir } from "@/lib/i18n";
import { createAppointment } from "@/actions/booking";
import { formatTimeInTz, formatDateInTz } from "@/lib/tz";
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
  return formatDateInTz(date, locale === "he" ? "he-IL" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoStr: string): string {
  return formatTimeInTz(isoStr, "he-IL");
}

function getDurationMinutes(startIso: string, endIso: string): number {
  return Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000
  );
}

type CapLevel = "full" | "last" | "low" | "medium" | "plenty";

function getCapacity(booked: number, max: number): { level: CapLevel; spots: number } {
  const spots = max - booked;
  if (spots <= 0) return { level: "full", spots: 0 };
  if (spots === 1) return { level: "last", spots };
  if (spots <= 3) return { level: "low", spots };
  if (spots <= 5) return { level: "medium", spots };
  return { level: "plenty", spots };
}

function getCapacityLabel(
  cap: { level: CapLevel; spots: number },
  t: ReturnType<typeof useT>
): string | null {
  const k = (key: string) => key as Parameters<typeof t>[0];
  switch (cap.level) {
    case "full":
      return t(k("book.cap_full"));
    case "last":
      return t(k("book.cap_last_spot"));
    case "low":
    case "medium":
      return t(k("book.cap_n_left")).replace("{n}", String(cap.spots));
    case "plenty":
      return null;
  }
}

function getCapacityBadgeStyle(level: CapLevel): string {
  switch (level) {
    case "full":
      return "bg-red-50 text-red-500";
    case "last":
      return "bg-red-50 text-red-500";
    case "low":
      return "bg-amber-50 text-amber-600";
    case "medium":
      return "bg-gray-100 text-gray-500";
    case "plenty":
      return "";
  }
}

const viewTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
};

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
  const dtLocale = locale === "he" ? "he-IL" : "en-US";
  const k = (key: string) => key as Parameters<typeof t>[0];

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [instances, setInstances] = useState<WorkoutInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] =
    useState<WorkoutInstance | null>(null);
  const [viewState, setViewState] = useState<ViewState>("calendar");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [weekDir, setWeekDir] = useState(0);
  const [appointmentId, setAppointmentId] = useState("");
  const [activeCard, setActiveCard] = useState<{
    sessionsRemaining: number;
    sessionsTotal: number;
    name: string;
  } | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

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
    fetch(
      `/api/workout-instances?businessId=${businessId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
    )
      .then((r) => r.json())
      .then((data) => setInstances(data.instances ?? []))
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
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
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

  function checkForActiveCards(serviceId: string) {
    setCardLoading(true);
    setActiveCard(null);
    fetch(`/api/cards/check?businessId=${businessId}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.cards?.length > 0) {
          const card = data.cards[0];
          setActiveCard({
            sessionsRemaining: card.sessionsRemaining,
            sessionsTotal: card.sessionsTotal,
            name: card.name,
          });
        }
      })
      .catch(() => {})
      .finally(() => setCardLoading(false));
  }

  function handleSelectInstance(inst: WorkoutInstance) {
    if (inst.bookedCount >= inst.maxParticipants) return;
    if (new Date(inst.startTime) < new Date()) return;
    setSelectedInstance(inst);
    setError("");

    if (!session?.user?.id) {
      setViewState("auth");
    } else {
      checkForActiveCards(inst.serviceId);
      setViewState("confirm");
    }
  }

  function handleAuthComplete() {
    if (selectedInstance) checkForActiveCards(selectedInstance.serviceId);
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
      setError(
        result.error === "ALREADY_REGISTERED"
          ? t(k("book.workout_already_registered"))
          : result.error
      );
      setBooking(false);
      return;
    }

    setAppointmentId(result.data!.appointmentId);
    setViewState("success");
    setBooking(false);

    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.55 },
      colors: [secondaryColor, primaryColor, "#fbbf24", "#34d399"],
      gravity: 1.3,
      ticks: 120,
    });
  }

  function handleBackToCalendar() {
    setSelectedInstance(null);
    setViewState("calendar");
    setError("");
    setLoading(true);
    fetch(
      `/api/workout-instances?businessId=${businessId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
    )
      .then((r) => r.json())
      .then((data) => setInstances(data.instances ?? []))
      .catch(() => setInstances([]))
      .finally(() => setLoading(false));
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="flex flex-1 flex-col">
      <AnimatePresence mode="wait">
        {viewState === "auth" && selectedInstance && (
          <motion.div key="auth" {...viewTransition} className="flex flex-1 flex-col">
            <BackButton dir={dir} onClick={handleBackToCalendar} label={t(k("common.back"))} />
            <BookingAuth
              secondaryColor={secondaryColor}
              onAuthenticated={handleAuthComplete}
            />
          </motion.div>
        )}

        {viewState === "confirm" && selectedInstance && (
          <motion.div key="confirm" {...viewTransition} className="flex flex-1 flex-col">
            <ConfirmView
              inst={selectedInstance}
              secondaryColor={secondaryColor}
              primaryColor={primaryColor}
              activeCard={activeCard}
              cardLoading={cardLoading}
              booking={booking}
              error={error}
              dir={dir}
              locale={locale}
              dtLocale={dtLocale}
              t={t}
              onBack={handleBackToCalendar}
              onConfirm={handleConfirmBooking}
            />
          </motion.div>
        )}

        {viewState === "success" && (
          <motion.div key="success" {...viewTransition} className="flex flex-1 flex-col">
            <SuccessView
              inst={selectedInstance}
              secondaryColor={secondaryColor}
              primaryColor={primaryColor}
              activeCard={activeCard}
              locale={locale}
              dtLocale={dtLocale}
              t={t}
              onBack={handleBackToCalendar}
            />
          </motion.div>
        )}

        {viewState === "calendar" && (
          <motion.div key="calendar" {...viewTransition} className="flex flex-1 flex-col">
            {/* Week navigation */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevWeek}
                disabled={isPrevDisabled}
                className="flex size-9 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition-all hover:bg-gray-50 hover:border-gray-200 active:scale-95 disabled:opacity-30 sm:size-10"
              >
                {dir === "rtl" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              <div className="text-sm font-semibold text-gray-800">
                {formatDate(weekStart, locale)} – {formatDate(weekEnd, locale)}
              </div>
              <button
                onClick={nextWeek}
                className="flex size-9 items-center justify-center rounded-xl border border-gray-100 text-gray-500 transition-all hover:bg-gray-50 hover:border-gray-200 active:scale-95 sm:size-10"
              >
                {dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-1 items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin" style={{ color: secondaryColor }} />
              </div>
            )}

            {/* Empty state */}
            {!loading && instances.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-1 flex-col items-center justify-center py-16 text-center"
              >
                <div
                  className="mb-3 flex size-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${secondaryColor}08` }}
                >
                  <Dumbbell size={24} style={{ color: `${secondaryColor}50` }} />
                </div>
                <p className="text-sm text-gray-400">{t(k("book.workout_no_upcoming"))}</p>
              </motion.div>
            )}

            {/* Week grid */}
            {!loading && instances.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={dateFrom}
                  initial={{ opacity: 0, x: weekDir * 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: weekDir * -30 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* ── Desktop: 7-column weekly grid ── */}
                  <div className="hidden md:grid md:grid-cols-7 md:gap-3 h-[min(70vh,640px)] min-h-[280px] max-h-[calc(100vh-13rem)]">
                    {weekDays.map(({ date, dateStr, dayIdx }) => {
                      const dayInstances = instancesByDay[dateStr] ?? [];
                      const isToday = dateStr === today;

                      return (
                        <div
                          key={dateStr}
                          className={`flex flex-col overflow-hidden rounded-2xl border ${
                            isToday
                              ? "border-gray-200 shadow-sm"
                              : "border-gray-100"
                          }`}
                        >
                          <div
                            className={`shrink-0 border-b px-3 py-3.5 text-center ${
                              isToday
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-gray-50/70 border-gray-100"
                            }`}
                          >
                            <p
                              className={`text-xs font-medium ${
                                isToday ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {dayNames[dayIdx]}
                            </p>
                            <p
                              className={`mt-1 inline-flex size-9 items-center justify-center rounded-full text-base font-bold leading-none ${
                                isToday
                                  ? "bg-white/15 text-white"
                                  : "text-gray-900"
                              }`}
                            >
                              {date.getDate()}
                            </p>
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
                            <div className="space-y-2">
                            {dayInstances.length === 0 ? (
                              <p className="py-10 text-center text-xs text-gray-300">
                                —
                              </p>
                            ) : (
                              dayInstances.map((inst, instIdx) => {
                                const isFull =
                                  inst.bookedCount >= inst.maxParticipants;
                                const isExpired =
                                  new Date(inst.startTime) < new Date();
                                const canBook = !isFull && !isExpired;
                                const cap = getCapacity(
                                  inst.bookedCount,
                                  inst.maxParticipants
                                );
                                const capLabel = getCapacityLabel(cap, t);
                                const duration = getDurationMinutes(
                                  inst.startTime,
                                  inst.endTime
                                );

                                return (
                                  <motion.button
                                    key={inst.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                      delay: instIdx * 0.03,
                                      duration: 0.2,
                                    }}
                                    whileTap={
                                      canBook ? { scale: 0.97 } : undefined
                                    }
                                    onClick={() =>
                                      canBook && handleSelectInstance(inst)
                                    }
                                    disabled={!canBook}
                                    className={`group w-full rounded-xl border p-3 text-start transition-all duration-150 ${
                                      canBook
                                        ? "border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-gray-200"
                                        : "border-transparent bg-gray-50/60 opacity-40"
                                    }`}
                                    style={
                                      canBook
                                        ? {
                                            borderInlineStartWidth: "3px",
                                            borderInlineStartColor:
                                              secondaryColor,
                                          }
                                        : undefined
                                    }
                                  >
                                    <div className="mb-1.5 flex items-baseline gap-1">
                                      <span
                                        className="text-sm font-bold tabular-nums"
                                        style={{
                                          color: canBook
                                            ? secondaryColor
                                            : "#9ca3af",
                                        }}
                                      >
                                        {formatTime(inst.startTime)}
                                      </span>
                                      <span className="text-[10px] text-gray-400">
                                        –
                                      </span>
                                      <span className="text-xs tabular-nums text-gray-400">
                                        {formatTime(inst.endTime)}
                                      </span>
                                    </div>
                                    <p className="text-[13px] font-bold leading-snug text-gray-900 truncate">
                                      {inst.scheduleTitle || inst.serviceName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                                      {inst.staffName} · {duration}′
                                    </p>
                                    {capLabel && (
                                      <span
                                        className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getCapacityBadgeStyle(
                                          cap.level
                                        )}`}
                                      >
                                        {capLabel}
                                      </span>
                                    )}
                                    {isExpired && !isFull && (
                                      <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
                                        —
                                      </span>
                                    )}
                                  </motion.button>
                                );
                              })
                            )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Mobile: vertical stacked days ── */}
                  <div className="md:hidden space-y-5">
                    {weekDays.map(({ date, dateStr, dayIdx }) => {
                      const dayInstances = instancesByDay[dateStr] ?? [];
                      if (dayInstances.length === 0) return null;
                      const isToday = dateStr === today;

                      return (
                        <div
                          key={dateStr}
                          className={`overflow-hidden rounded-2xl border ${
                            isToday
                              ? "border-gray-200 shadow-sm"
                              : "border-gray-100"
                          }`}
                        >
                          {isToday ? (
                            <div className="flex items-center gap-2.5 bg-gray-900 px-4 py-3 text-white">
                              <span className="text-sm font-bold">
                                {dayNames[dayIdx]}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateInTz(date, dtLocale, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="ms-auto rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
                                {dayInstances.length}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 border-b border-gray-100 bg-gray-50/70 px-4 py-2.5">
                              <span className="text-sm font-bold text-gray-700">
                                {dayNames[dayIdx]}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDateInTz(date, dtLocale, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className="ms-auto text-[10px] font-medium text-gray-400">
                                {dayInstances.length}
                              </span>
                            </div>
                          )}

                          <div className="space-y-2 p-3 sm:space-y-2.5 sm:p-4">
                            {dayInstances.map((inst, instIdx) => {
                              const isFull =
                                inst.bookedCount >= inst.maxParticipants;
                              const isExpired =
                                new Date(inst.startTime) < new Date();
                              const canBook = !isFull && !isExpired;
                              const cap = getCapacity(
                                inst.bookedCount,
                                inst.maxParticipants
                              );
                              const capLabel = getCapacityLabel(cap, t);
                              const duration = getDurationMinutes(
                                inst.startTime,
                                inst.endTime
                              );

                              return (
                                <motion.button
                                  key={inst.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    delay: instIdx * 0.04,
                                    duration: 0.25,
                                  }}
                                  whileTap={
                                    canBook ? { scale: 0.98 } : undefined
                                  }
                                  onClick={() =>
                                    canBook && handleSelectInstance(inst)
                                  }
                                  disabled={!canBook}
                                  className={`group flex w-full items-center gap-3 rounded-xl border p-3.5 text-start transition-all duration-200 sm:gap-4 sm:rounded-2xl sm:p-4 ${
                                    canBook
                                      ? "border-gray-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-gray-200 hover:-translate-y-px"
                                      : "border-transparent bg-gray-50/60 opacity-40"
                                  }`}
                                  style={
                                    canBook
                                      ? {
                                          borderInlineStartWidth: "3px",
                                          borderInlineStartColor:
                                            secondaryColor,
                                        }
                                      : undefined
                                  }
                                >
                                  <div
                                    className="flex shrink-0 flex-col items-center rounded-lg px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2"
                                    style={{
                                      backgroundColor: canBook
                                        ? `${secondaryColor}0a`
                                        : "#f5f5f5",
                                    }}
                                  >
                                    <span
                                      className="text-sm font-bold tabular-nums leading-tight sm:text-base"
                                      style={{
                                        color: canBook
                                          ? secondaryColor
                                          : "#9ca3af",
                                      }}
                                    >
                                      {formatTime(inst.startTime)}
                                    </span>
                                    <span className="text-[10px] tabular-nums text-gray-400 sm:text-[11px]">
                                      {formatTime(inst.endTime)}
                                    </span>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-bold text-gray-900 truncate sm:text-base">
                                      {inst.scheduleTitle || inst.serviceName}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 sm:text-[13px]">
                                      <User
                                        size={11}
                                        className="shrink-0 text-gray-400"
                                      />
                                      <span className="truncate">
                                        {inst.staffName}
                                      </span>
                                      <span className="text-gray-300">·</span>
                                      <span className="shrink-0 text-gray-400">
                                        {t(k("book.duration_min")).replace(
                                          "{n}",
                                          String(duration)
                                        )}
                                      </span>
                                    </p>
                                  </div>

                                  {capLabel && (
                                    <span
                                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold sm:text-[11px] ${getCapacityBadgeStyle(
                                        cap.level
                                      )}`}
                                    >
                                      {capLabel}
                                    </span>
                                  )}
                                  {isExpired && !isFull && (
                                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-400">
                                      —
                                    </span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Back Button
// ═══════════════════════════════════════════════════════════════

function BackButton({
  dir,
  onClick,
  label,
}: {
  dir: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="mb-5 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      <ChevronRight className={dir === "rtl" ? "" : "rotate-180"} size={16} />
      <span>{label}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Detail Row
// ═══════════════════════════════════════════════════════════════

function DetailRow({
  icon,
  color,
  label,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9"
        style={{ backgroundColor: `${color}10` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Confirm View
// ═══════════════════════════════════════════════════════════════

function ConfirmView({
  inst,
  secondaryColor,
  primaryColor,
  activeCard,
  cardLoading,
  booking,
  error,
  dir,
  locale,
  dtLocale,
  t,
  onBack,
  onConfirm,
}: {
  inst: WorkoutInstance;
  secondaryColor: string;
  primaryColor: string;
  activeCard: { sessionsRemaining: number; sessionsTotal: number; name: string } | null;
  cardLoading: boolean;
  booking: boolean;
  error: string;
  dir: string;
  locale: string;
  dtLocale: string;
  t: ReturnType<typeof useT>;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const k = (key: string) => key as Parameters<typeof t>[0];
  const cap = getCapacity(inst.bookedCount, inst.maxParticipants);
  const capLabel =
    cap.level === "plenty"
      ? t(k("book.cap_available")).replace("{n}", String(cap.spots))
      : getCapacityLabel(cap, t);
  const duration = getDurationMinutes(inst.startTime, inst.endTime);

  return (
    <>
      <BackButton dir={dir} onClick={onBack} label={t(k("common.back"))} />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div
          className="h-1"
          style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
        />

        <div className="p-5 sm:p-7">
          {/* Icon + title */}
          <div className="mb-4 flex flex-col items-center text-center sm:mb-5">
            <div
              className="mb-3 flex size-12 items-center justify-center rounded-2xl sm:size-14"
              style={{ backgroundColor: `${secondaryColor}10` }}
            >
              <Dumbbell className="size-6 sm:size-7" style={{ color: secondaryColor }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
              {inst.scheduleTitle || inst.serviceName}
            </h3>
          </div>

          <div className="mb-4 h-px bg-gray-100 sm:mb-5" />

          {/* Detail rows */}
          <div className="space-y-3 sm:space-y-3.5">
            <DetailRow
              icon={<Calendar size={16} />}
              color={secondaryColor}
              label={formatDateInTz(inst.startTime, dtLocale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            />
            <DetailRow
              icon={<Clock size={16} />}
              color={secondaryColor}
              label={`${formatTime(inst.startTime)} – ${formatTime(inst.endTime)}  ·  ${t(k("book.duration_min")).replace("{n}", String(duration))}`}
            />
            <DetailRow
              icon={<User size={16} />}
              color={secondaryColor}
              label={t(k("book.workout_with")).replace("{name}", inst.staffName)}
            />

            {/* Capacity — human-friendly text */}
            {capLabel && (
              <div className="flex items-center gap-3">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9"
                  style={{ backgroundColor: `${secondaryColor}10` }}
                >
                  <Users size={16} style={{ color: secondaryColor }} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    cap.level === "last" || cap.level === "full"
                      ? "text-red-500"
                      : cap.level === "low"
                        ? "text-amber-600"
                        : "text-gray-500"
                  }`}
                >
                  {capLabel}
                </span>
              </div>
            )}
          </div>

          {/* Active card widget */}
          {activeCard && !cardLoading && (
            <ActiveCardWidget
              card={activeCard}
              secondaryColor={secondaryColor}
              t={t}
              locale={locale}
            />
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 overflow-hidden rounded-lg bg-red-50 p-3 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          {/* CTA */}
          <button
            onClick={onConfirm}
            disabled={booking}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:opacity-60 sm:mt-7"
            style={{
              backgroundColor: secondaryColor,
              boxShadow: `0 4px 14px ${secondaryColor}30`,
            }}
          >
            {booking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Check size={18} />
                {t(k("book.reserve_spot"))}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Success View
// ═══════════════════════════════════════════════════════════════

function SuccessView({
  inst,
  secondaryColor,
  primaryColor,
  activeCard,
  locale,
  dtLocale,
  t,
  onBack,
}: {
  inst: WorkoutInstance | null;
  secondaryColor: string;
  primaryColor: string;
  activeCard: { sessionsRemaining: number; sessionsTotal: number; name: string } | null;
  locale: string;
  dtLocale: string;
  t: ReturnType<typeof useT>;
  onBack: () => void;
}) {
  const k = (key: string) => key as Parameters<typeof t>[0];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center sm:py-12">
      {/* Success icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
        className="relative mb-6"
      >
        <div
          className="flex size-[72px] items-center justify-center rounded-full sm:size-20"
          style={{ background: `linear-gradient(135deg, ${secondaryColor}18, ${secondaryColor}08)` }}
        >
          <div
            className="flex size-12 items-center justify-center rounded-full sm:size-14"
            style={{
              background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
              boxShadow: `0 8px 24px ${secondaryColor}30`,
            }}
          >
            <CircleCheck className="size-6 text-white sm:size-7" />
          </div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
          className="absolute -end-1 -top-1 flex size-7 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Sparkles className="size-4" style={{ color: secondaryColor }} />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="mb-1.5 text-xl font-bold text-gray-900 sm:text-2xl"
      >
        {t(k("book.workout_registered"))}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="mb-6 max-w-xs text-sm text-gray-500"
      >
        {t(k("book.workout_registered_desc"))}
      </motion.p>

      {/* Summary card */}
      {inst && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div
            className="h-0.5"
            style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
          />
          <div className="p-4 sm:p-5">
            <p className="mb-3 text-sm font-bold text-gray-900 sm:text-[15px]">
              {inst.scheduleTitle || inst.serviceName}
            </p>
            <div className="space-y-2.5">
              <SuccessRow icon={<Calendar size={14} />} color={secondaryColor}>
                {formatDateInTz(inst.startTime, dtLocale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </SuccessRow>
              <SuccessRow icon={<Clock size={14} />} color={secondaryColor}>
                {formatTime(inst.startTime)} – {formatTime(inst.endTime)}
              </SuccessRow>
              <SuccessRow icon={<User size={14} />} color={secondaryColor}>
                {inst.staffName}
              </SuccessRow>
            </div>
          </div>
        </motion.div>
      )}

      {/* Compact card summary */}
      {activeCard && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.35 }}
          className="mt-3 w-full max-w-sm text-start"
        >
          <ActiveCardWidget
            card={activeCard}
            secondaryColor={secondaryColor}
            t={t}
            locale={locale}
            compact
          />
        </motion.div>
      )}

      {/* Back to classes */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onBack}
        className="mt-8 flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all hover:bg-gray-50 active:scale-[0.97]"
        style={{ borderColor: `${secondaryColor}30`, color: secondaryColor }}
      >
        <ArrowRight className="size-4 ltr:rotate-180" />
        {t(k("book.back_to_classes"))}
      </motion.button>
    </div>
  );
}

function SuccessRow({
  icon,
  color,
  children,
}: {
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-500">
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}08` }}
      >
        <span style={{ color: `${color}90` }}>{icon}</span>
      </div>
      <span>{children}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Active Card Widget
// ═══════════════════════════════════════════════════════════════

function ActiveCardWidget({
  card,
  secondaryColor,
  t,
  locale,
  compact,
}: {
  card: { sessionsRemaining: number; sessionsTotal: number; name: string };
  secondaryColor: string;
  t: ReturnType<typeof useT>;
  locale: string;
  compact?: boolean;
}) {
  const k = (key: string) => key as Parameters<typeof t>[0];
  const remaining = card.sessionsRemaining - 1;
  const total = card.sessionsTotal;
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const isLow = remaining <= 1;

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${secondaryColor}10` }}
        >
          <Ticket size={16} style={{ color: secondaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-semibold text-gray-700">{card.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isLow ? "#f59e0b" : secondaryColor,
                }}
              />
            </div>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: isLow ? "#f59e0b" : secondaryColor }}
            >
              {remaining}/{total}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="mt-5 overflow-hidden rounded-2xl shadow-sm"
    >
      {/* Header */}
      <div
        className="relative px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}dd)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <Ticket size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-white/70">
              {locale === "he" ? "כרטיסייה פעילה" : "Active Card"}
            </p>
            <p className="truncate text-sm font-bold text-white">{card.name}</p>
          </div>
          <BadgeCheck size={20} className="shrink-0 text-white/80" />
        </div>
      </div>

      {/* Body */}
      <div className="space-y-2.5 bg-gray-50 px-4 py-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-500">
              {locale === "he" ? "כניסות שנותרו" : "Sessions left"}
            </span>
            <span
              className="font-bold tabular-nums"
              style={{ color: isLow ? "#f59e0b" : secondaryColor }}
            >
              {remaining} / {total}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
              className="h-full rounded-full"
              style={{
                background: isLow
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : `linear-gradient(90deg, ${secondaryColor}, ${secondaryColor}bb)`,
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-2 text-xs shadow-sm">
          <Check size={14} className="shrink-0 text-emerald-500" />
          <span className="text-gray-600">{t(k("book.card_auto_deduct"))}</span>
        </div>
      </div>
    </motion.div>
  );
}
