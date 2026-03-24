"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import { updateClassInstanceTime } from "@/actions/classes";
import { Button } from "@/components/ui/button";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  AppointmentQuickView,
  type QuickViewAppointment,
} from "./appointment-quick-view";
import { ClassInstanceQuickView } from "./class-instance-quick-view";
import { ManualBookingDialog } from "./manual-booking-dialog";
import { SummaryBar } from "./summary-bar";
import { FilterBar } from "./filter-bar";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { DayViewMobile } from "./day-view-mobile";
import { MonthView } from "./month-view";
import type {
  CalendarViewType,
  Staff,
  Appointment,
  ClassInstance,
  StaffDaySchedule,
  BlockedSlot,
  TimeOffPeriod,
  BusinessHoursEntry,
  FilterState,
} from "./calendar-types";
import {
  STAFF_COLORS,
  EMPTY_FILTERS,
  hasActiveFilters,
  computeKPIs,
} from "./calendar-types";

interface CalendarShellProps {
  staff: Staff[];
  services: { id: string; title: string; durationMinutes: number }[];
  serviceStaffLinks?: { serviceId: string; staffId: string }[];
  businessId: string;
  appointments: Appointment[];
  classInstances?: ClassInstance[];
  staffSchedules?: StaffDaySchedule[];
  staffBlockedSlots?: BlockedSlot[];
  staffTimeOff?: TimeOffPeriod[];
  businessHours?: BusinessHoursEntry[];
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
  staffSchedules = [],
  staffBlockedSlots = [],
  staffTimeOff = [],
  businessHours = [],
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
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [selectedApt, setSelectedApt] = useState<QuickViewAppointment | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassInstance | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [, startTransition] = useTransition();

  // ── Derived: filtered data ────────────────────────────────
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    if (filters.staffIds.length > 0) {
      result = result.filter((a) => filters.staffIds.includes(a.staffId));
    }
    if (filters.serviceIds.length > 0) {
      result = result.filter((a) => filters.serviceIds.includes(a.serviceId));
    }
    if (filters.statuses.length > 0) {
      result = result.filter((a) => filters.statuses.includes(a.status));
    }
    if (filters.needsAttention) {
      result = result.filter((a) => a.status === "PENDING");
    }

    return result;
  }, [appointments, filters]);

  const filteredClasses = useMemo(() => {
    let result = classInstances;
    if (filters.staffIds.length > 0) {
      result = result.filter((c) => filters.staffIds.includes(c.staffId));
    }
    if (filters.serviceIds.length > 0) {
      result = result.filter((c) => filters.serviceIds.includes(c.serviceId));
    }
    if (filters.needsAttention) {
      result = result.filter(
        (c) => c.bookedCount >= c.maxParticipants
      );
    }
    return result;
  }, [classInstances, filters]);

  // ── KPIs: computed from the current view's date range ──────
  const kpis = useMemo(
    () => computeKPIs(filteredAppointments, filteredClasses, staff),
    [filteredAppointments, filteredClasses, staff]
  );

  // ── Staff color map ────────────────────────────────────────
  const staffColorMap = useMemo(() => {
    const map = new Map<string, (typeof STAFF_COLORS)[number]>();
    staff.forEach((s, i) =>
      map.set(s.id, STAFF_COLORS[i % STAFF_COLORS.length])
    );
    return map;
  }, [staff]);

  // ── Handlers ───────────────────────────────────────────────
  const handleAptClick = useCallback((apt: Appointment) => {
    setSelectedApt(apt as unknown as QuickViewAppointment);
  }, []);

  const handleClassClick = useCallback((ci: ClassInstance) => {
    setSelectedClass(ci);
  }, []);

  const handleClassTimeChange = useCallback(
    (instanceId: string, newStart: Date, newEnd: Date) => {
      startTransition(async () => {
        await updateClassInstanceTime(
          instanceId,
          businessId,
          newStart.toISOString(),
          newEnd.toISOString()
        );
        router.refresh();
      });
    },
    [businessId, router]
  );

  const handleFilterPending = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes("PENDING") ? [] : ["PENDING"],
    }));
  }, []);

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

  // ── Header label ───────────────────────────────────────────
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
      return `${start.getDate()} ${isRtl ? "ב" : ""}${start.toLocaleDateString(dateLocale, { month: "long" })} - ${end.getDate()} ${isRtl ? "ב" : ""}${end.toLocaleDateString(dateLocale, { month: "long" })} ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString(dateLocale, {
      month: "long",
      year: "numeric",
    });
  }, [view, currentDate, dateLocale, isRtl]);

  // ── Empty state: no staff ──────────────────────────────────
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

  // ── Legacy staffFilter derived from FilterState for old views ──
  const legacyStaffFilter =
    filters.staffIds.length === 1 ? filters.staffIds[0] : null;

  return (
    <div className="space-y-3">
      {/* ─── Sticky header: nav + view switcher ───────────── */}
      <div className="sticky top-0 z-30 -mx-1 bg-background/95 backdrop-blur-sm px-1 pb-2 pt-1 space-y-3 border-b border-border/40">
        {/* Row 1: View switcher + date nav + add */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex items-center gap-2" dir="ltr">
            <Button variant="outline" size="icon-sm" onClick={() => navigate(1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday} className="text-xs">
              {t("cal.today")}
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button size="sm" onClick={() => setBookingOpen(true)} className="ms-2">
              <Plus className="size-4 me-1" />
              <span className="hidden sm:inline">{t("manual.add_apt")}</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Date label */}
        <h2 className="text-center text-base font-semibold sm:text-lg">
          {headerLabel}
        </h2>

        {/* Row 3: Summary bar */}
        <SummaryBar kpis={kpis} onFilterPending={handleFilterPending} />

        {/* Row 4: Filters */}
        <FilterBar
          staff={staff}
          services={services}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* ─── Calendar view ────────────────────────────────── */}
      {view === "week" && (
        <WeekView
          appointments={filteredAppointments}
          classInstances={filteredClasses}
          staff={staff}
          staffColorMap={staffColorMap}
          staffFilter={legacyStaffFilter}
          currentDate={currentDate}
          onAptClick={handleAptClick}
          onClassClick={handleClassClick}
          onDayClick={goToDay}
        />
      )}
      {view === "day" && (
        <>
          {/* Desktop day view */}
          <div className="hidden md:block">
            <DayView
              appointments={filteredAppointments}
              classInstances={filteredClasses}
              staff={staff}
              staffColorMap={staffColorMap}
              staffFilter={legacyStaffFilter}
              staffSchedules={staffSchedules}
              staffBlockedSlots={staffBlockedSlots}
              staffTimeOff={staffTimeOff}
              businessHours={businessHours}
              currentDate={currentDate}
              onAptClick={handleAptClick}
              onClassClick={handleClassClick}
              onClassTimeChange={handleClassTimeChange}
          onEmptySlotClick={(_staffId, _time) => {
            setBookingOpen(true);
          }}
            />
          </div>
          {/* Mobile day view */}
          <DayViewMobile
            appointments={filteredAppointments}
            classInstances={filteredClasses}
            staff={staff}
            staffSchedules={staffSchedules}
            staffBlockedSlots={staffBlockedSlots}
            staffTimeOff={staffTimeOff}
            businessHours={businessHours}
            currentDate={currentDate}
            onAptClick={handleAptClick}
            onClassClick={handleClassClick}
            onAddClick={() => setBookingOpen(true)}
          />
        </>
      )}
      {view === "month" && (
        <MonthView
          appointments={filteredAppointments}
          classInstances={filteredClasses}
          staff={staff}
          staffColorMap={staffColorMap}
          currentDate={currentDate}
          onAptClick={handleAptClick}
          onClassClick={handleClassClick}
          onDayClick={goToDay}
        />
      )}

      {/* ─── Dialogs ──────────────────────────────────────── */}
      <AppointmentQuickView
        appointment={selectedApt}
        open={!!selectedApt}
        onOpenChange={(open) => {
          if (!open) setSelectedApt(null);
        }}
      />

      <ClassInstanceQuickView
        instance={selectedClass}
        businessId={businessId}
        open={!!selectedClass}
        onOpenChange={(open) => {
          if (!open) setSelectedClass(null);
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
