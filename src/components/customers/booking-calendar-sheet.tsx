"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  getDayAppointments,
  getStaffDaySchedule,
  createManualAppointment,
} from "@/actions/booking";
import { getDir } from "@/lib/i18n";
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Loader2,
  Clock,
  User,
  GripVertical,
  Check,
} from "lucide-react";

interface BookingCalendarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  customer: { name: string; phone: string };
  staff: { id: string; name: string }[];
  services: { id: string; title: string; durationMinutes: number }[];
  serviceStaffLinks?: { serviceId: string; staffId: string }[];
}

type ExistingApt = {
  id: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
  customerName: string;
  staffName: string;
  staffId: string;
  blocksAllStaff: boolean;
};

type StaffHours = { startMin: number; endMin: number } | null;

const HOUR_START = 7;
const HOUR_END = 22;
const ROW_HEIGHT = 80;
const SNAP_MINUTES = 5;
const GRID_HEIGHT = (HOUR_END - HOUR_START) * ROW_HEIGHT;
const PX_PER_MIN = ROW_HEIGHT / 60;

function minutesToTop(minutes: number) {
  return (minutes - HOUR_START * 60) * PX_PER_MIN;
}

function snapMinutes(mins: number) {
  return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES;
}

function fmtTime(totalMins: number) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeStr(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function localDateStr(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isTodayStr(dateStr: string) {
  return dateStr === localDateStr();
}

export function BookingCalendarSheet({
  open,
  onOpenChange,
  businessId,
  customer,
  staff,
  services,
  serviceStaffLinks,
}: BookingCalendarSheetProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);
  const innerGridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");

  const availableStaff = useMemo(() => {
    if (!serviceStaffLinks || serviceStaffLinks.length === 0) return staff;
    const linkedIds = new Set(
      serviceStaffLinks.filter((l) => l.serviceId === serviceId).map((l) => l.staffId)
    );
    if (linkedIds.size === 0) return staff;
    return staff.filter((s) => linkedIds.has(s.id));
  }, [staff, serviceId, serviceStaffLinks]);
  const [date, setDate] = useState(() => localDateStr());
  const [notes, setNotes] = useState("");

  const [existingApts, setExistingApts] = useState<ExistingApt[]>([]);
  const [staffHours, setStaffHours] = useState<StaffHours>(null);
  const [loadingApts, setLoadingApts] = useState(false);

  const [placedStart, setPlacedStart] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const justDraggedRef = useRef(false);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );
  const baseDuration = selectedService?.durationMinutes ?? 30;
  const duration = customDuration ?? baseDuration;

  // Compute the earliest bookable minute for today
  const nowMinutes = useMemo(() => {
    if (!isTodayStr(date)) return HOUR_START * 60;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [date]);

  // Effective bookable range considering staff hours + past
  const bookableRange = useMemo(() => {
    const rangeStart = staffHours ? staffHours.startMin : HOUR_START * 60;
    const rangeEnd = staffHours ? staffHours.endMin : HOUR_END * 60;
    const effectiveStart = Math.max(rangeStart, isTodayStr(date) ? snapMinutes(nowMinutes + 5) : rangeStart);
    return { start: effectiveStart, end: rangeEnd };
  }, [staffHours, date, nowMinutes]);

  // Fetch ALL appointments for the day (unfiltered) + staff schedule
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingApts(true);

    Promise.all([
      getDayAppointments(businessId, date),
      getStaffDaySchedule(staffId, businessId, date),
    ]).then(([apts, schedule]) => {
      if (cancelled) return;
      setExistingApts(
        apts.map((a) => ({
          ...a,
          startTime: new Date(a.startTime),
          endTime: new Date(a.endTime),
          blocksAllStaff: a.blocksAllStaff ?? false,
        }))
      );
      if (schedule && schedule.isActive) {
        setStaffHours({
          startMin: parseTimeStr(schedule.startTime),
          endMin: parseTimeStr(schedule.endTime),
        });
      } else {
        setStaffHours(null);
      }
      setLoadingApts(false);
    });
    return () => { cancelled = true; };
  }, [open, date, staffId, businessId]);

  // Always start on today when dialog opens
  useEffect(() => {
    if (open) {
      setDate(localDateStr());
      setPlacedStart(null);
      setCustomDuration(null);
      setConfirmed(false);
      setError(null);
      setNotes("");
    }
  }, [open]);

  // Auto-select first available staff when service changes
  useEffect(() => {
    if (availableStaff.length > 0 && !availableStaff.some((s) => s.id === staffId)) {
      setStaffId(availableStaff[0].id);
    }
  }, [availableStaff, staffId]);

  // Reset placement when service/staff/date change
  useEffect(() => {
    setPlacedStart(null);
    setCustomDuration(null);
    setError(null);
  }, [serviceId, staffId, date]);

  // Scroll to relevant hour on open
  useEffect(() => {
    if (!open || !gridRef.current) return;
    const scrollTo = staffHours ? staffHours.startMin : nowMinutes;
    const scrollTarget = Math.max(0, minutesToTop(scrollTo) - 40);
    setTimeout(() => {
      gridRef.current?.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }, 300);
  }, [open, date, staffHours, nowMinutes]);

  const dateLabel = useMemo(() => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [date, locale]);

  const todayStr = useMemo(() => localDateStr(), []);
  const isPastDate = date < todayStr;

  function navigateDay(dir: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + dir);
    const next = localDateStr(d);
    if (next < todayStr) return;
    setDate(next);
  }

  // Appointments that conflict with the selected staff's time
  const blockingApts = useMemo(() => {
    return existingApts.filter((apt) => {
      if (apt.staffId === staffId) return true;
      if (apt.blocksAllStaff) return true;
      return false;
    });
  }, [existingApts, staffId]);

  const hasConflict = useMemo(() => {
    if (placedStart === null) return false;
    const newStart = placedStart;
    const newEnd = placedStart + duration;

    return existingApts.some((apt) => {
      const aStart = apt.startTime.getHours() * 60 + apt.startTime.getMinutes();
      const aEnd = apt.endTime.getHours() * 60 + apt.endTime.getMinutes();
      const overlaps = newStart < aEnd && newEnd > aStart;
      if (!overlaps) return false;
      if (apt.staffId === staffId) return true;
      if (apt.blocksAllStaff) return true;
      return false;
    });
  }, [placedStart, duration, existingApts, staffId]);

  // Is a given minute outside working hours or in the past?
  const isUnavailable = useCallback((mins: number) => {
    if (mins < bookableRange.start || mins >= bookableRange.end) return true;
    return false;
  }, [bookableRange]);

  const clientYToMinutes = useCallback((clientY: number) => {
    if (!innerGridRef.current) return HOUR_START * 60;
    const rect = innerGridRef.current.getBoundingClientRect();
    const yInGrid = clientY - rect.top;
    return (yInGrid / PX_PER_MIN) + HOUR_START * 60;
  }, []);

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (justDraggedRef.current) {
        justDraggedRef.current = false;
        return;
      }
      if (confirmed) return;

      const rawMins = clientYToMinutes(e.clientY);
      const snapped = snapMinutes(rawMins);

      if (isUnavailable(snapped) || isUnavailable(snapped + baseDuration - 1)) return;

      const clamped = Math.max(
        bookableRange.start,
        Math.min(snapped, bookableRange.end - baseDuration)
      );
      setPlacedStart(clamped);
      setCustomDuration(null);
      setError(null);
    },
    [confirmed, baseDuration, clientYToMinutes, isUnavailable, bookableRange]
  );

  // Drag to move
  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (confirmed || isResizing) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      justDraggedRef.current = true;

      const startY = e.clientY;
      const startMins = placedStart ?? 0;

      const handleMove = (ev: PointerEvent) => {
        const dy = ev.clientY - startY;
        const dMins = dy / PX_PER_MIN;
        const newStart = snapMinutes(startMins + dMins);
        const clamped = Math.max(
          bookableRange.start,
          Math.min(newStart, bookableRange.end - duration)
        );
        setPlacedStart(clamped);
      };

      const handleUp = () => {
        setIsDragging(false);
        setTimeout(() => { justDraggedRef.current = false; }, 50);
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [placedStart, duration, confirmed, isResizing, bookableRange]
  );

  // Drag bottom edge to resize
  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      if (confirmed) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      justDraggedRef.current = true;

      const startY = e.clientY;
      const startDuration = duration;

      const handleMove = (ev: PointerEvent) => {
        const dy = ev.clientY - startY;
        const dMins = dy / PX_PER_MIN;
        const newDuration = snapMinutes(Math.max(15, startDuration + dMins));
        const maxDuration = bookableRange.end - (placedStart ?? 0);
        setCustomDuration(Math.min(newDuration, maxDuration));
      };

      const handleUp = () => {
        setIsResizing(false);
        setTimeout(() => { justDraggedRef.current = false; }, 50);
        document.removeEventListener("pointermove", handleMove);
        document.removeEventListener("pointerup", handleUp);
      };

      document.addEventListener("pointermove", handleMove);
      document.addEventListener("pointerup", handleUp);
    },
    [duration, confirmed, placedStart, bookableRange]
  );

  function handleConfirm() {
    if (placedStart === null || hasConflict) return;

    const startDate = new Date(date + "T00:00:00");
    startDate.setHours(Math.floor(placedStart / 60), placedStart % 60, 0, 0);

    startTransition(async () => {
      const result = await createManualAppointment({
        businessId,
        customerPhone: customer.phone,
        customerName: customer.name,
        serviceId,
        staffId,
        startTime: startDate.toISOString(),
        notes: notes || undefined,
        durationMinutes: customDuration ?? undefined,
      });

      if (result.success) {
        setConfirmed(true);
        setTimeout(() => {
          onOpenChange(false);
          router.refresh();
        }, 1200);
      } else {
        setError(result.error ?? t("manual.error_generic"));
      }
    });
  }

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i < HOUR_END; i++) h.push(i);
    return h;
  }, []);

  const dir = getDir(locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="!grid-rows-none !gap-0 max-w-none w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 flex flex-col overflow-hidden rounded-2xl">
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b">
          <DialogHeader className="flex-1 text-start">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarPlus className="size-5" />
              {t("booking_cal.title")}
            </DialogTitle>
            <DialogDescription>
              {t("booking_cal.desc").replace("{name}", customer.name)}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Main layout: sidebar + calendar */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar: controls */}
          <div className="w-72 shrink-0 border-e bg-muted/20 p-4 space-y-4 overflow-y-auto">
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="size-4 text-primary" />
                {customer.name}
              </div>
              <p className="text-xs text-muted-foreground" dir="ltr">
                {customer.phone}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("manual.service")}</Label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isPending || confirmed}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.durationMinutes} {t("common.min")})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("manual.staff")}</Label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={isPending || confirmed}
              >
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Staff hours indicator */}
            {staffHours && (
              <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{t("booking_cal.working_hours")}:</span>{" "}
                {fmtTime(staffHours.startMin)} – {fmtTime(staffHours.endMin)}
              </div>
            )}
            {staffHours === null && !loadingApts && (
              <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3 py-2 text-xs text-orange-700 dark:text-orange-300">
                {t("booking_cal.no_schedule")}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("manual.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("manual.notes_ph")}
                rows={2}
                disabled={isPending || confirmed}
                className="resize-none"
              />
            </div>

            {placedStart !== null && (
              <div className="rounded-lg border bg-background p-3 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="size-4 text-primary" />
                  {t("booking_cal.selected_time")}
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {fmtTime(placedStart)} – {fmtTime(placedStart + duration)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedService?.title} · {duration} {t("common.min")}
                  {customDuration && customDuration !== baseDuration && (
                    <span className="text-primary ms-1">({t("booking_cal.custom")})</span>
                  )}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="space-y-2 pt-2">
              {placedStart !== null && !confirmed && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConfirm}
                  disabled={isPending || hasConflict}
                >
                  {isPending ? (
                    <Loader2 className="size-4 me-1.5 animate-spin" />
                  ) : (
                    <CalendarPlus className="size-4 me-1.5" />
                  )}
                  {t("booking_cal.confirm_booking")}
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("common.cancel")}
              </Button>
            </div>

            {!placedStart && !confirmed && (
              <p className="text-xs text-muted-foreground text-center animate-pulse pt-2">
                {t("booking_cal.hint_click")}
              </p>
            )}
          </div>

          {/* Calendar grid */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 flex items-center justify-center gap-4 py-2 border-b bg-muted/10">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigateDay(-1)}
                disabled={isPending || confirmed || date <= todayStr}
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="text-sm font-semibold min-w-48 text-center">
                {dateLabel}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigateDay(1)}
                disabled={isPending || confirmed}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>

            <div
              ref={gridRef}
              className="flex-1 overflow-y-auto"
              style={{ minHeight: 0 }}
            >
              <div
                ref={innerGridRef}
                className="relative select-none"
                style={{ height: GRID_HEIGHT }}
                onClick={handleGridClick}
              >
                {/* Unavailable overlay: before working hours */}
                {bookableRange.start > HOUR_START * 60 && (
                  <div
                    className="absolute z-10 bg-muted/50 pointer-events-none"
                    style={{
                      top: 0,
                      height: minutesToTop(bookableRange.start),
                      insetInlineStart: 64,
                      insetInlineEnd: 0,
                    }}
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(0,0,0,0.03)_8px,rgba(0,0,0,0.03)_16px)]" />
                  </div>
                )}

                {/* Unavailable overlay: after working hours */}
                {bookableRange.end < HOUR_END * 60 && (
                  <div
                    className="absolute z-10 bg-muted/50 pointer-events-none"
                    style={{
                      top: minutesToTop(bookableRange.end),
                      bottom: 0,
                      insetInlineStart: 64,
                      insetInlineEnd: 0,
                    }}
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(0,0,0,0.03)_8px,rgba(0,0,0,0.03)_16px)]" />
                  </div>
                )}

                {/* Past time overlay for today */}
                {isTodayStr(date) && nowMinutes > HOUR_START * 60 && (
                  <div
                    className="absolute z-10 bg-red-500/5 pointer-events-none"
                    style={{
                      top: 0,
                      height: minutesToTop(nowMinutes),
                      insetInlineStart: 64,
                      insetInlineEnd: 0,
                    }}
                  >
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgba(239,68,68,0.04)_6px,rgba(239,68,68,0.04)_12px)]" />
                    {/* Current time line */}
                    <div className="absolute bottom-0 inset-x-0 h-px bg-red-400" />
                    <div className="absolute bottom-[-3px] start-0 size-1.5 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Hour rows + labels */}
                {hours.map((h) => {
                  const hourMin = h * 60;
                  const outsideHours = hourMin < bookableRange.start || hourMin >= bookableRange.end;
                  return (
                    <div
                      key={h}
                      className="absolute w-full border-t border-border/40 flex"
                      style={{ top: (h - HOUR_START) * ROW_HEIGHT, height: ROW_HEIGHT }}
                    >
                      <div className="w-16 shrink-0 pt-1 pe-2 text-end">
                        <span className={`text-xs font-medium tabular-nums ${outsideHours ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                          {String(h).padStart(2, "0")}:00
                        </span>
                      </div>
                      <div className={`flex-1 relative ${outsideHours ? "cursor-not-allowed" : "cursor-crosshair"}`}>
                        <div
                          className="absolute w-full border-t border-dotted border-border/15"
                          style={{ top: ROW_HEIGHT * 0.25 }}
                        />
                        <div
                          className="absolute w-full border-t border-dashed border-border/25"
                          style={{ top: ROW_HEIGHT * 0.5 }}
                        />
                        <div
                          className="absolute w-full border-t border-dotted border-border/15"
                          style={{ top: ROW_HEIGHT * 0.75 }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Existing appointments — always show all */}
                {existingApts.map((apt) => {
                  const startMins =
                    apt.startTime.getHours() * 60 + apt.startTime.getMinutes();
                  const endMins =
                    apt.endTime.getHours() * 60 + apt.endTime.getMinutes();
                  const heightPx = Math.max((endMins - startMins) * PX_PER_MIN, 24);
                  const top = minutesToTop(startMins);
                  const timeStr = `${fmtTime(startMins)}–${fmtTime(endMins)}`;
                  const isSameStaff = apt.staffId === staffId;
                  const isBlocking = apt.blocksAllStaff;
                  const isBlockingOtherStaff = !isSameStaff && isBlocking;

                  return (
                    <div
                      key={apt.id}
                      className={`absolute rounded-lg border pointer-events-none overflow-hidden flex items-center ${
                        isBlockingOtherStaff
                          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
                          : isSameStaff
                            ? "border-border/50 bg-muted/70"
                            : "border-border/30 bg-muted/30 opacity-50"
                      }`}
                      style={{
                        top,
                        height: heightPx,
                        insetInlineStart: 68,
                        insetInlineEnd: 12,
                      }}
                    >
                      {heightPx < 30 ? (
                        <p className={`px-2 text-[11px] truncate ${isBlockingOtherStaff ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                          <span className="font-semibold">{apt.serviceName}</span>
                          {!isSameStaff && <span className="opacity-60"> · {apt.staffName}</span>}
                          <span className="opacity-60"> · {timeStr}</span>
                        </p>
                      ) : (
                        <div className="px-2.5 py-1 w-full">
                          <p className={`text-xs font-semibold truncate leading-tight ${isBlockingOtherStaff ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                            {apt.serviceName}
                            {isBlockingOtherStaff && " 🔒"}
                          </p>
                          {heightPx >= 44 && (
                            <p className={`text-[11px] truncate leading-tight ${isBlockingOtherStaff ? "text-red-500/70" : "text-muted-foreground/70"}`}>
                              {apt.customerName}{!isSameStaff ? ` · ${apt.staffName}` : ""} · {timeStr}
                            </p>
                          )}
                          {heightPx >= 30 && heightPx < 44 && (
                            <p className={`text-[11px] truncate leading-tight ${isBlockingOtherStaff ? "text-red-500/70" : "text-muted-foreground/70"}`}>
                              {!isSameStaff ? `${apt.staffName} · ` : ""}{timeStr}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {loadingApts && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                )}

                {/* NEW appointment block */}
                {placedStart !== null && (() => {
                  const blockPx = Math.max(duration * PX_PER_MIN, 28);
                  const resizeH = confirmed ? 0 : 10;
                  const contentPx = blockPx - resizeH;
                  const timeStr = `${fmtTime(placedStart)} – ${fmtTime(placedStart + duration)}`;
                  return (
                    <div
                      className={`
                        absolute rounded-xl border-2 shadow-lg overflow-hidden flex flex-col
                        ${(isDragging || isResizing)
                          ? "shadow-2xl scale-x-[1.01] z-30"
                          : "z-20 transition-[top,height,background-color,border-color,box-shadow] duration-150 ease-out"
                        }
                        ${confirmed
                          ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                          : hasConflict
                            ? "border-red-400 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-300/50"
                            : "border-primary bg-primary/10 ring-2 ring-primary/20 hover:shadow-xl"
                        }
                      `}
                      style={{
                        top: minutesToTop(placedStart),
                        height: blockPx,
                        insetInlineStart: 64,
                        insetInlineEnd: 8,
                        animation: !(isDragging || isResizing) ? "aptBlockAppear 0.3s ease-out" : undefined,
                      }}
                    >
                      {/* Main area: drag to move */}
                      <div
                        className={`flex-1 min-h-0 overflow-hidden ${confirmed ? "" : "cursor-grab active:cursor-grabbing"}`}
                        onPointerDown={!confirmed ? handleDragStart : undefined}
                      >
                        {contentPx < 28 ? (
                          /* Tiny: single line */
                          <div className="flex items-center h-full px-2 gap-1.5">
                            <span className="text-xs font-semibold truncate">
                              {confirmed ? t("booking_cal.confirmed") : selectedService?.title}
                            </span>
                            <span className="text-[11px] opacity-60 truncate">{customer.name}</span>
                            <span className="text-[11px] tabular-nums opacity-70 shrink-0">{timeStr}</span>
                            {!confirmed && <GripVertical className="size-3 opacity-30 shrink-0 ms-auto" />}
                          </div>
                        ) : contentPx < 48 ? (
                          /* Small: title + customer · time */
                          <div className="flex items-center justify-between h-full px-2.5 gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate leading-tight">
                                {confirmed ? (
                                  <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
                                    <Check className="size-3" />{t("booking_cal.confirmed")}
                                  </span>
                                ) : selectedService?.title}
                              </p>
                              <p className="text-[11px] font-medium opacity-70 truncate leading-tight">
                                {customer.name} · <span className="tabular-nums">{timeStr}</span>
                              </p>
                            </div>
                            {!confirmed && <GripVertical className="size-4 opacity-30 shrink-0" />}
                          </div>
                        ) : (
                          /* Normal/Large: full content */
                          <div className="flex items-start justify-between gap-2 h-full px-3 py-1.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate leading-tight">
                                {confirmed ? (
                                  <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                                    <Check className="size-4" />
                                    {t("booking_cal.confirmed")}
                                  </span>
                                ) : selectedService?.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Clock className="size-3 opacity-60 shrink-0" />
                                <span className="text-xs tabular-nums font-semibold">{timeStr}</span>
                              </div>
                              {contentPx >= 65 && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {customer.name}
                                </p>
                              )}
                            </div>
                            {!confirmed && <GripVertical className="size-4 opacity-30 shrink-0 mt-0.5" />}
                          </div>
                        )}
                      </div>

                      {/* Bottom resize handle */}
                      {!confirmed && (
                        <div
                          className="shrink-0 cursor-ns-resize flex items-center justify-center hover:bg-primary/10 transition-colors"
                          style={{ height: resizeH }}
                          onPointerDown={handleResizeStart}
                        >
                          <div className="w-8 h-0.5 rounded-full bg-current opacity-20" />
                        </div>
                      )}

                      {hasConflict && !confirmed && (
                        <p className="absolute -bottom-6 start-0 text-xs text-red-500 font-medium whitespace-nowrap">
                          {t("booking_cal.conflict")}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes aptBlockAppear {
            0% { opacity: 0; transform: scaleY(0.3) scaleX(0.95); }
            50% { opacity: 1; transform: scaleY(1.05) scaleX(1.01); }
            100% { transform: scaleY(1) scaleX(1); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
