"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  AppointmentQuickView,
  type QuickViewAppointment,
} from "./appointment-quick-view";

type Staff = {
  id: string;
  name: string;
  imageUrl: string | null;
};

type Appointment = {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
  staffId: string;
  staffName: string;
  customerName: string;
  customerPhone: string | null;
  notes: string | null;
};

type CalendarViewProps = {
  staff: Staff[];
  appointments: Appointment[];
  weekStartIso: string;
  weekOffset: number;
};

const HOUR_START = 8;
const HOUR_END = 22;
const SLOT_HEIGHT = 40;
const TIME_COL_WIDTH = 48;
const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const STAFF_COLORS = [
  { bg: "#EFF6FF", border: "#3B82F6", text: "#1E3A5F" },
  { bg: "#F0FDF4", border: "#22C55E", text: "#14532D" },
  { bg: "#FFF7ED", border: "#F97316", text: "#7C2D12" },
  { bg: "#FAF5FF", border: "#A855F7", text: "#3B0764" },
  { bg: "#FFF1F2", border: "#F43F5E", text: "#881337" },
  { bg: "#ECFEFF", border: "#06B6D4", text: "#164E63" },
  { bg: "#FFFBEB", border: "#EAB308", text: "#713F12" },
  { bg: "#FDF2F8", border: "#EC4899", text: "#831843" },
];

const STATUS_OPACITY: Record<string, number> = {
  CONFIRMED: 1,
  PENDING: 0.65,
  COMPLETED: 0.5,
  NO_SHOW: 0.4,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function CalendarView({ staff, appointments, weekStartIso, weekOffset }: CalendarViewProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";
  const dayNames = isRtl ? DAY_NAMES_HE : DAY_NAMES_EN;

  const weekStart = useMemo(() => new Date(weekStartIso), [weekStartIso]);

  const staffColorMap = useMemo(() => {
    const map = new Map<string, typeof STAFF_COLORS[number]>();
    staff.forEach((s, i) => map.set(s.id, STAFF_COLORS[i % STAFF_COLORS.length]));
    return map;
  }, [staff]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const [now, setNow] = useState(() => new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedApt, setSelectedApt] = useState<QuickViewAppointment | null>(null);

  const handleAptClick = useCallback((apt: Appointment) => {
    setSelectedApt(apt as QuickViewAppointment);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const mins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
    if (mins < 0) return;
    const scrollTarget = Math.max(0, (mins / 30) * SLOT_HEIGHT - 120);
    gridRef.current.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }, [weekOffset]);

  const navigate = (offset: number) => {
    const params = new URLSearchParams();
    if (offset !== 0) params.set("week", String(offset));
    router.push(`/dashboard/calendar${params.size ? `?${params}` : ""}`);
  };

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const fmt = new Intl.DateTimeFormat(dateLocale, { month: "short", day: "numeric" });
    return `${fmt.format(start)} – ${fmt.format(end)}`;
  }, [weekDays, dateLocale]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
      slots.push(`${String(h).padStart(2, "0")}:30`);
    }
    return slots;
  }, []);

  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const gridHeight = timeSlots.length * SLOT_HEIGHT;

  const currentTimeTop = useMemo(() => {
    const mins = now.getHours() * 60 + now.getMinutes() - HOUR_START * 60;
    if (mins < 0 || mins > totalMinutes) return null;
    return (mins / 30) * SLOT_HEIGHT;
  }, [now, totalMinutes]);

  const isToday = (date: Date) =>
    date.toDateString() === now.toDateString();

  const appointmentsByDayStaff = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const apt of appointments) {
      const start = new Date(apt.startTime);
      const dayIdx = Math.floor((start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIdx < 0 || dayIdx > 6) continue;
      const key = `${dayIdx}-${apt.staffId}`;
      const list = map.get(key) ?? [];
      list.push(apt);
      map.set(key, list);
    }
    return map;
  }, [appointments, weekStart]);

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <Users className="mb-3 size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("cal.no_staff")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => navigate(weekOffset - 1)} aria-label={t("cal.prev_week")}>
            {isRtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(0)}>
            {t("cal.today")}
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate(weekOffset + 1)} aria-label={t("cal.next_week")}>
            {isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays className="size-4 text-muted-foreground" />
          {weekLabel}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full table-fixed border-collapse">
          {/* Column sizing: time col fixed, day cols share remaining space equally */}
          <colgroup>
            <col style={{ width: TIME_COL_WIDTH }} />
            {weekDays.map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>

          {/* Day headers */}
          <thead>
            <tr className="border-b bg-muted/30">
              <th style={{ width: TIME_COL_WIDTH }} />
              {weekDays.map((day, dayIdx) => (
                <th key={dayIdx} className={`border-s border-border/50 p-0 font-normal ${isToday(day) ? "bg-primary/5" : ""}`}>
                  <div
                    className={`px-1 py-1.5 text-center text-[10px] font-semibold ${
                      isToday(day) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isToday(day) && (
                      <span className="me-1 inline-block size-1.5 rounded-full bg-primary align-middle" />
                    )}
                    <span>{dayNames[day.getDay()]}</span>
                    <span className="ms-1">
                      {day.toLocaleDateString(dateLocale, { day: "numeric", month: "numeric" })}
                    </span>
                  </div>
                  {staff.length > 1 && (
                    <div className="flex border-t border-border/30">
                      {staff.map((member) => {
                        const clr = staffColorMap.get(member.id)!;
                        return (
                          <div
                            key={member.id}
                            className="flex flex-1 items-center justify-center gap-0.5 overflow-hidden px-0.5 py-1"
                          >
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: clr.border }}
                            />
                            <span className="truncate text-[9px] font-medium text-muted-foreground">
                              {member.name.split(" ")[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Single staff banner */}
        {staff.length === 1 && (
          <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-1">
            <Avatar size="sm">
              {staff[0].imageUrl && <AvatarImage src={staff[0].imageUrl} alt={staff[0].name} />}
              <AvatarFallback>{getInitials(staff[0].name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">{staff[0].name}</span>
          </div>
        )}

        {/* Time grid body */}
        <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
        <div className="relative flex" style={{ height: gridHeight }}>
          {/* Time axis */}
          <div className="shrink-0 border-e border-border/50" style={{ width: TIME_COL_WIDTH }}>
            {timeSlots.map((slot, idx) => (
              <div
                key={slot}
                className="flex items-start justify-end pe-1.5 pt-0.5"
                style={{ height: SLOT_HEIGHT }}
              >
                {idx % 2 === 0 && (
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                    {slot}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => (
            <div
              key={dayIdx}
              className={`relative flex flex-1 border-s border-border/50 ${
                isToday(day) ? "bg-primary/[0.04]" : ""
              }`}
            >
              {/* Half-hour grid lines */}
              {timeSlots.map((slot, idx) => (
                <div
                  key={slot}
                  className={`pointer-events-none absolute inset-x-0 border-t ${
                    idx % 2 === 0 ? "border-border/40" : "border-border/20 border-dashed"
                  }`}
                  style={{ top: idx * SLOT_HEIGHT }}
                />
              ))}

              {/* Staff sub-columns */}
              {staff.map((member, staffIdx) => (
                <div
                  key={member.id}
                  className={`relative flex-1 overflow-hidden ${
                    staffIdx > 0 ? "border-s border-border/20" : ""
                  }`}
                >
                  {(appointmentsByDayStaff.get(`${dayIdx}-${member.id}`) ?? []).map((apt) => {
                    const start = new Date(apt.startTime);
                    const end = new Date(apt.endTime);
                    const startMins = start.getHours() * 60 + start.getMinutes() - HOUR_START * 60;
                    const durationMins = (end.getTime() - start.getTime()) / 60_000;
                    const top = (startMins / 30) * SLOT_HEIGHT;
                    const height = (durationMins / 30) * SLOT_HEIGHT;
                    const clr = staffColorMap.get(apt.staffId) ?? STAFF_COLORS[0];
                    const opacity = STATUS_OPACITY[apt.status] ?? 1;

                    if (startMins < 0 || startMins >= totalMinutes) return null;

                    return (
                      <button
                        type="button"
                        key={apt.id}
                        onClick={() => handleAptClick(apt)}
                        className="absolute inset-x-0.5 cursor-pointer overflow-hidden rounded border-s-2 text-start shadow-sm transition-shadow hover:shadow-md hover:ring-1 hover:ring-black/10"
                        style={{
                          top,
                          height: Math.max(height, SLOT_HEIGHT / 2),
                          backgroundColor: clr.bg,
                          borderColor: clr.border,
                          color: clr.text,
                          opacity,
                        }}
                      >
                        <div className="px-1 py-0.5">
                          <p className="truncate text-[9px] font-semibold leading-tight">
                            {apt.serviceName}
                          </p>
                          <p className="truncate text-[8px] leading-tight opacity-75">
                            {apt.customerName}
                          </p>
                          <p className="text-[8px] tabular-nums opacity-60">
                            {formatTime(start, dateLocale)}–{formatTime(end, dateLocale)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Current time indicator */}
              {isToday(day) && currentTimeTop !== null && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10"
                  style={{ top: currentTimeTop }}
                >
                  <div className="relative flex items-center">
                    <div className="absolute -start-1 size-2 rounded-full bg-red-500" />
                    <div className="h-px w-full bg-red-500" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>

      <AppointmentQuickView
        appointment={selectedApt}
        open={!!selectedApt}
        onOpenChange={(open) => {
          if (!open) setSelectedApt(null);
        }}
      />
    </div>
  );
}
