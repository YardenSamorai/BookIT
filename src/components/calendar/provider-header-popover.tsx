"use client";

import { useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import type { Appointment, ClassInstance, Staff } from "./calendar-types";
import { STAFF_COLORS, isSameDay } from "./calendar-types";

interface ProviderHeaderPopoverProps {
  staff: Staff;
  staffIndex: number;
  appointments: Appointment[];
  classInstances: ClassInstance[];
  currentDate: Date;
  children: React.ReactNode;
}

export function ProviderHeaderPopover({
  staff,
  staffIndex,
  appointments,
  classInstances,
  currentDate,
  children,
}: ProviderHeaderPopoverProps) {
  const clr = STAFF_COLORS[staffIndex % STAFF_COLORS.length];

  const stats = useMemo(() => {
    const dayApts = appointments.filter(
      (a) =>
        a.staffId === staff.id &&
        isSameDay(new Date(a.startTime), currentDate) &&
        !a.classInstanceId
    );
    const dayCIs = classInstances.filter(
      (c) =>
        c.staffId === staff.id &&
        c.date ===
          `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`
    );

    const confirmed = dayApts.filter((a) => a.status === "CONFIRMED").length;
    const pending = dayApts.filter((a) => a.status === "PENDING").length;
    const total = dayApts.length;
    const totalMins = dayApts.reduce(
      (sum, a) =>
        sum +
        (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) /
          60_000,
      0
    );

    return { total, confirmed, pending, totalClasses: dayCIs.length, totalMins };
  }, [appointments, classInstances, staff.id, currentDate]);

  const utilPct =
    stats.totalMins > 0
      ? Math.round((stats.totalMins / (8 * 60)) * 100)
      : 0;

  return (
    <Popover>
      <PopoverTrigger
        className="flex flex-1 items-center justify-center"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="center">
        {/* Provider name */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: clr.border }}
          />
          <span className="text-sm font-semibold">{staff.name}</span>
        </div>

        {/* Stats */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            <span>{stats.total} תורים</span>
            {stats.totalClasses > 0 && (
              <span className="text-violet-600">
                · {stats.totalClasses} שיעורים
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span>{stats.confirmed} מאושרים</span>
          </div>
          {stats.pending > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-amber-500" />
              <span className="font-medium text-amber-700">
                {stats.pending} ממתינים
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-muted-foreground" />
            <span>~{utilPct}% תפוסה</span>
          </div>
        </div>

        {/* Utilization bar */}
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              utilPct > 90
                ? "bg-red-400"
                : utilPct > 70
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{ width: `${Math.min(100, utilPct)}%` }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
