"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  AppointmentQuickView,
  type QuickViewAppointment,
} from "./appointment-quick-view";
import { ManualBookingDialog } from "./manual-booking-dialog";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";
import type { CalendarViewType, Staff, Appointment, ClassInstance } from "./calendar-types";
import { STAFF_COLORS } from "./calendar-types";

interface CalendarShellProps {
  staff: Staff[];
  services: { id: string; title: string; durationMinutes: number }[];
  serviceStaffLinks?: { serviceId: string; staffId: string }[];
  businessId: string;
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  initialView: string;
  initialDate: string;
}

export function CalendarShell({
  staff,
  services,
  serviceStaffLinks,
  businessId,
  appointments,
  classInstances = [],
  initialView,
  initialDate,
}: CalendarShellProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const isRtl = locale === "he";
  const dateLocale = isRtl ? "he-IL" : "en-US";

  const [view, setView] = useState<CalendarViewType>(
    (initialView as CalendarViewType) || "week"
  );
  const [currentDate, setCurrentDate] = useState(() => new Date(initialDate));
  const [staffFilter, setStaffFilter] = useState<string | null>(null);
  const [selectedApt, setSelectedApt] = useState<QuickViewAppointment | null>(
    null
  );
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleAptClick = useCallback((apt: Appointment) => {
    setSelectedApt(apt as QuickViewAppointment);
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!staffFilter) return appointments;
    return appointments.filter((a) => a.staffId === staffFilter);
  }, [appointments, staffFilter]);

  const staffColorMap = useMemo(() => {
    const map = new Map<string, (typeof STAFF_COLORS)[number]>();
    staff.forEach((s, i) =>
      map.set(s.id, STAFF_COLORS[i % STAFF_COLORS.length])
    );
    return map;
  }, [staff]);

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);

    setCurrentDate(d);
    router.push(
      `/dashboard/calendar?view=${view}&date=${d.toISOString().slice(0, 10)}`,
      { scroll: false }
    );
  }

  function goToday() {
    const d = new Date();
    setCurrentDate(d);
    router.push(
      `/dashboard/calendar?view=${view}&date=${d.toISOString().slice(0, 10)}`,
      { scroll: false }
    );
  }

  function switchView(v: CalendarViewType) {
    setView(v);
    router.push(
      `/dashboard/calendar?view=${v}&date=${currentDate.toISOString().slice(0, 10)}`,
      { scroll: false }
    );
  }

  function goToDay(date: Date) {
    setView("day");
    setCurrentDate(date);
    router.push(
      `/dashboard/calendar?view=day&date=${date.toISOString().slice(0, 10)}`,
      { scroll: false }
    );
  }

  const headerLabel = useMemo(() => {
    if (view === "day") {
      return currentDate.toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = getWeekStart(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const fmt = new Intl.DateTimeFormat(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `${start.getDate()} ${isRtl ? "ב" : ""}${start.toLocaleDateString(dateLocale, { month: "long" })} - ${end.getDate()} ${isRtl ? "ב" : ""}${end.toLocaleDateString(dateLocale, { month: "long" })} ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString(dateLocale, {
      month: "long",
      year: "numeric",
    });
  }, [view, currentDate, dateLocale, isRtl]);

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
        <Users className="mb-3 size-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("cal.no_staff")}</p>
      </div>
    );
  }

  const viewButtons: { key: CalendarViewType; label: string }[] = [
    { key: "day", label: t("cal.view_day") },
    { key: "week", label: t("cal.view_week") },
    { key: "month", label: t("cal.view_month") },
  ];

  return (
    <div className="space-y-4">
      {/* Top bar: view switcher + navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* View switcher */}
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {viewButtons.map((vb) => (
            <button
              key={vb.key}
              onClick={() => switchView(vb.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === vb.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {vb.label}
            </button>
          ))}
        </div>

        {/* Navigation + Add button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => setBookingOpen(true)}
            className="ms-2"
          >
            <Plus className="size-4 me-1" />
            {t("manual.add_apt")}
          </Button>
        </div>
      </div>

      {/* Date header */}
      <h2 className="text-center text-lg font-semibold">{headerLabel}</h2>

      {/* Staff filter */}
      {staff.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStaffFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              staffFilter === null
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t("cal.all_staff")}
          </button>
          {staff.map((s, i) => {
            const clr = STAFF_COLORS[i % STAFF_COLORS.length];
            const active = staffFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStaffFilter(active ? null : s.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "ring-2 ring-offset-1"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: clr.bg,
                        color: clr.text,
                        outlineColor: clr.border,
                        // @ts-expect-error -- CSS custom property for Tailwind ring
                        "--tw-ring-color": clr.border,
                      }
                    : undefined
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: clr.border }}
                />
                {s.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Calendar view */}
      {view === "week" && (
        <WeekView
          appointments={appointments}
          classInstances={classInstances}
          staff={staff}
          staffColorMap={staffColorMap}
          staffFilter={staffFilter}
          currentDate={currentDate}
          onAptClick={handleAptClick}
          onDayClick={goToDay}
        />
      )}
      {view === "day" && (
        <DayView
          appointments={appointments}
          classInstances={classInstances}
          staff={staff}
          staffColorMap={staffColorMap}
          staffFilter={staffFilter}
          currentDate={currentDate}
          onAptClick={handleAptClick}
        />
      )}
      {view === "month" && (
        <MonthView
          appointments={filteredAppointments}
          staff={staff}
          staffColorMap={staffColorMap}
          currentDate={currentDate}
          onAptClick={handleAptClick}
          onDayClick={goToDay}
        />
      )}

      <AppointmentQuickView
        appointment={selectedApt}
        open={!!selectedApt}
        onOpenChange={(open) => {
          if (!open) setSelectedApt(null);
        }}
      />

      <ManualBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        businessId={businessId}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
        services={services}
        serviceStaffLinks={serviceStaffLinks}
        initialDate={currentDate.toISOString().slice(0, 10)}
      />
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
