"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClassSchedule, updateClassSchedule } from "@/actions/classes";
import { getStaffDaySchedule, getDayAppointments } from "@/actions/booking";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { getDir, DAYS_SHORT_KEYS, t as tFn } from "@/lib/i18n";
import {
  Dumbbell,
  Loader2,
  Clock,
  Users,
  CalendarDays,
  Repeat,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Service = { id: string; title: string; isGroup: boolean; durationMinutes: number };
type Staff = { id: string; name: string };

type Schedule = {
  id: string;
  serviceId: string;
  staffId: string;
  title: string | null;
  daysOfWeek: number[];
  startTime: string;
  maxParticipants: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  notes: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  services: Service[];
  staff: Staff[];
  schedule?: Schedule | null;
}

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

const HOUR_START = 6;
const HOUR_END = 23;
const ROW_HEIGHT = 80;
const GRID_HEIGHT = (HOUR_END - HOUR_START) * ROW_HEIGHT;
const PX_PER_MIN = ROW_HEIGHT / 60;
const SNAP_MINUTES = 5;

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

export function ClassScheduleForm({
  open,
  onOpenChange,
  businessId,
  services,
  staff,
  schedule,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const gridRef = useRef<HTMLDivElement>(null);
  const innerGridRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  const groupServices = services.filter((s) => s.isGroup);

  const [serviceId, setServiceId] = useState(schedule?.serviceId ?? groupServices[0]?.id ?? "");
  const [staffId, setStaffId] = useState(schedule?.staffId ?? staff[0]?.id ?? "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(schedule?.daysOfWeek ?? []);
  const [maxParticipants, setMaxParticipants] = useState(schedule?.maxParticipants ?? 10);
  const [effectiveFrom, setEffectiveFrom] = useState(schedule?.effectiveFrom ?? localDateStr());
  const [effectiveUntil, setEffectiveUntil] = useState(schedule?.effectiveUntil ?? "");
  const [notes, setNotes] = useState(schedule?.notes ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState<"settings" | "calendar">("settings");

  const [placedStart, setPlacedStart] = useState<number | null>(
    schedule ? parseTimeStr(schedule.startTime) : null
  );

  const [existingApts, setExistingApts] = useState<ExistingApt[]>([]);
  const [staffHours, setStaffHours] = useState<StaffHours>(null);
  const [loadingApts, setLoadingApts] = useState(false);

  const previewDate = useMemo(() => {
    if (daysOfWeek.length === 0) return localDateStr();
    const today = new Date();
    const todayDow = today.getDay();
    const targetDow = daysOfWeek[0];
    const diff = (targetDow - todayDow + 7) % 7;
    const d = new Date(today);
    d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
    return localDateStr(d);
  }, [daysOfWeek]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );
  const duration = selectedService?.durationMinutes ?? 30;

  const bookableRange = useMemo(() => {
    const rangeStart = staffHours ? staffHours.startMin : HOUR_START * 60;
    const rangeEnd = staffHours ? staffHours.endMin : HOUR_END * 60;
    return { start: rangeStart, end: rangeEnd };
  }, [staffHours]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingApts(true);

    Promise.all([
      getDayAppointments(businessId, previewDate),
      getStaffDaySchedule(staffId, businessId, previewDate),
    ]).then(([apts, sched]) => {
      if (cancelled) return;
      setExistingApts(
        apts.map((a) => ({
          ...a,
          startTime: new Date(a.startTime),
          endTime: new Date(a.endTime),
          blocksAllStaff: a.blocksAllStaff ?? false,
        }))
      );
      if (sched && sched.isActive) {
        setStaffHours({
          startMin: parseTimeStr(sched.startTime),
          endMin: parseTimeStr(sched.endTime),
        });
      } else {
        setStaffHours(null);
      }
      setLoadingApts(false);
    });
    return () => { cancelled = true; };
  }, [open, previewDate, staffId, businessId]);

  useEffect(() => {
    if (open) {
      if (!schedule) {
        setServiceId(groupServices[0]?.id ?? "");
        setStaffId(staff[0]?.id ?? "");
        setDaysOfWeek([]);
        setMaxParticipants(10);
        setEffectiveFrom(localDateStr());
        setEffectiveUntil("");
        setNotes("");
        setPlacedStart(null);
      }
      setSuccess(false);
      setError("");
      setMobileTab("settings");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !gridRef.current) return;
    const scrollTo = staffHours ? staffHours.startMin : 8 * 60;
    const scrollTarget = Math.max(0, minutesToTop(scrollTo) - 40);
    setTimeout(() => {
      gridRef.current?.scrollTo({ top: scrollTarget, behavior: "smooth" });
    }, 300);
  }, [open, staffHours, mobileTab]);

  const isUnavailable = useCallback((mins: number) => {
    return mins < bookableRange.start || mins >= bookableRange.end;
  }, [bookableRange]);

  const clientYToMinutes = useCallback((clientY: number) => {
    if (!innerGridRef.current) return HOUR_START * 60;
    const rect = innerGridRef.current.getBoundingClientRect();
    const yInGrid = clientY - rect.top;
    return (yInGrid / PX_PER_MIN) + HOUR_START * 60;
  }, []);

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (success) return;
      const rawMins = clientYToMinutes(e.clientY);
      const snapped = snapMinutes(rawMins);
      if (isUnavailable(snapped) || isUnavailable(snapped + duration - 1)) return;
      const clamped = Math.max(
        bookableRange.start,
        Math.min(snapped, bookableRange.end - duration)
      );
      setPlacedStart(clamped);
      setError("");
    },
    [success, duration, clientYToMinutes, isUnavailable, bookableRange]
  );

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function handleSubmit() {
    if (!serviceId) { setError(t("cls.service")); return; }
    if (!staffId) { setError(t("cls.instructor")); return; }
    if (daysOfWeek.length === 0) { setError(t("cls.select_days")); return; }
    if (placedStart === null) { setError(t("cls.click_to_set_time")); return; }

    const startTime = fmtTime(placedStart);

    setError("");
    startTransition(async () => {
      if (schedule) {
        const res = await updateClassSchedule(schedule.id, businessId, {
          daysOfWeek,
          startTime,
          maxParticipants,
          effectiveUntil: effectiveUntil || null,
          notes: notes || undefined,
        });
        if (!res.success) { setError(res.error); return; }
      } else {
        const res = await createClassSchedule({
          businessId,
          serviceId,
          staffId,
          daysOfWeek,
          startTime,
          maxParticipants,
          effectiveFrom,
          effectiveUntil: effectiveUntil || undefined,
          notes: notes || undefined,
        });
        if (!res.success) { setError(res.error); return; }
      }
      setSuccess(true);
      setTimeout(() => onOpenChange(false), 1000);
    });
  }

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i < HOUR_END; i++) h.push(i);
    return h;
  }, []);

  const dateLabel = useMemo(() => {
    const d = new Date(previewDate + "T12:00:00");
    return d.toLocaleDateString(locale === "he" ? "he-IL" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [previewDate, locale]);

  const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  /* ── Sidebar content (shared between mobile & desktop) ── */
  const sidebarContent = (
    <div className="space-y-4">
      {/* Service */}
      {!schedule && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("cls.service")}</Label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className={selectCls}
            disabled={isPending || success}
          >
            {groupServices.length === 0 && <option value="">—</option>}
            {groupServices.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.durationMinutes} {t("common.min")})
              </option>
            ))}
          </select>
          {groupServices.length === 0 && (
            <p className="text-xs text-destructive">
              {locale === "he"
                ? 'אין שירותים קבוצתיים. סמנו שירות כ"קבוצתי" תחילה.'
                : 'No group services. Mark a service as "Group" first.'}
            </p>
          )}
        </div>
      )}

      {/* Staff */}
      {!schedule && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("cls.instructor")}</Label>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className={selectCls}
            disabled={isPending || success}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Staff hours indicator */}
      {staffHours && (
        <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {locale === "he" ? "שעות פעילות" : "Working hours"}:
          </span>{" "}
          {fmtTime(staffHours.startMin)} – {fmtTime(staffHours.endMin)}
        </div>
      )}

      {/* Days */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("cls.days")}</Label>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_INDICES.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`flex size-9 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                daysOfWeek.includes(day)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tFn(locale, DAYS_SHORT_KEYS[day] as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Max participants */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("cls.max_participants")}</Label>
        <div className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="number"
            min={1}
            max={200}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium">{t("cls.effective_from")}</Label>
          <Input
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            disabled={!!schedule}
            className="text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium">{t("cls.effective_until")}</Label>
          <Input
            type="date"
            value={effectiveUntil}
            onChange={(e) => setEffectiveUntil(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("cls.notes")}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      {/* Selected time */}
      {placedStart !== null && (
        <div className="rounded-lg border bg-background p-3 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-4 text-primary" />
            {t("cls.workout_time")}
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {fmtTime(placedStart)} – {fmtTime(placedStart + duration)}
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedService?.title} · {duration} min
          </p>
          {daysOfWeek.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <Repeat className="size-3 shrink-0" />
              {t("cls.recurring_on")}{" "}
              {daysOfWeek.sort().map((d) => tFn(locale, DAYS_SHORT_KEYS[d] as any)).join(", ")}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {!success && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending || placedStart === null || daysOfWeek.length === 0}
          >
            {isPending ? (
              <Loader2 className="size-4 me-1.5 animate-spin" />
            ) : (
              <Dumbbell className="size-4 me-1.5" />
            )}
            {t("cls.save")}
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)} disabled={isPending}>
          {t("common.cancel")}
        </Button>
      </div>

      {!placedStart && !success && (
        <p className="text-xs text-muted-foreground text-center animate-pulse pt-2">
          {t("cls.click_to_set_time")}
        </p>
      )}
    </div>
  );

  /* ── Calendar grid content ── */
  const calendarContent = (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Date header */}
      <div className="shrink-0 flex items-center justify-center gap-4 py-2 border-b bg-muted/10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          <span className="font-semibold text-foreground">{dateLabel}</span>
          <span className="text-[10px] hidden sm:inline">
            ({locale === "he" ? "תצוגה מקדימה" : "preview"})
          </span>
        </div>
      </div>

      <div ref={gridRef} className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <div
          ref={innerGridRef}
          className="relative select-none"
          style={{ height: GRID_HEIGHT }}
          onClick={handleGridClick}
        >
          {/* Unavailable: before hours */}
          {bookableRange.start > HOUR_START * 60 && (
            <div
              className="absolute z-10 bg-muted/50 pointer-events-none"
              style={{ top: 0, height: minutesToTop(bookableRange.start), insetInlineStart: 48, insetInlineEnd: 0 }}
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(0,0,0,0.03)_8px,rgba(0,0,0,0.03)_16px)]" />
            </div>
          )}

          {/* Unavailable: after hours */}
          {bookableRange.end < HOUR_END * 60 && (
            <div
              className="absolute z-10 bg-muted/50 pointer-events-none"
              style={{ top: minutesToTop(bookableRange.end), bottom: 0, insetInlineStart: 48, insetInlineEnd: 0 }}
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent,transparent_8px,rgba(0,0,0,0.03)_8px,rgba(0,0,0,0.03)_16px)]" />
            </div>
          )}

          {/* Hour rows */}
          {hours.map((h) => {
            const hourMin = h * 60;
            const outsideHours = hourMin < bookableRange.start || hourMin >= bookableRange.end;
            return (
              <div
                key={h}
                className="absolute w-full border-t border-border/40 flex"
                style={{ top: (h - HOUR_START) * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                <div className="w-12 sm:w-16 shrink-0 pt-1 pe-1 sm:pe-2 text-end">
                  <span className={`text-[11px] sm:text-xs font-medium tabular-nums ${outsideHours ? "text-muted-foreground/30" : "text-muted-foreground"}`}>
                    {String(h).padStart(2, "0")}:00
                  </span>
                </div>
                <div className={`flex-1 relative ${outsideHours ? "cursor-not-allowed" : "cursor-crosshair"}`}>
                  <div className="absolute w-full border-t border-dotted border-border/15" style={{ top: ROW_HEIGHT * 0.25 }} />
                  <div className="absolute w-full border-t border-dashed border-border/25" style={{ top: ROW_HEIGHT * 0.5 }} />
                  <div className="absolute w-full border-t border-dotted border-border/15" style={{ top: ROW_HEIGHT * 0.75 }} />
                </div>
              </div>
            );
          })}

          {/* Existing appointments */}
          {existingApts.map((apt) => {
            const startMins = apt.startTime.getHours() * 60 + apt.startTime.getMinutes();
            const endMins = apt.endTime.getHours() * 60 + apt.endTime.getMinutes();
            const heightPx = Math.max((endMins - startMins) * PX_PER_MIN, 24);
            const top = minutesToTop(startMins);
            const isSameStaff = apt.staffId === staffId;

            return (
              <div
                key={apt.id}
                className={`absolute rounded-lg border pointer-events-none overflow-hidden flex items-center ${
                  isSameStaff ? "border-border/50 bg-muted/70" : "border-border/30 bg-muted/30 opacity-50"
                }`}
                style={{ top, height: heightPx, insetInlineStart: 52, insetInlineEnd: 8 }}
              >
                <div className="px-2 py-1 w-full">
                  <p className="text-[11px] font-semibold truncate leading-tight text-muted-foreground">{apt.serviceName}</p>
                  {heightPx >= 44 && (
                    <p className="text-[10px] truncate leading-tight text-muted-foreground/70">
                      {apt.customerName} · {fmtTime(startMins)}–{fmtTime(endMins)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {loadingApts && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          )}

          {/* Workout block */}
          {placedStart !== null && (() => {
            const blockPx = Math.max(duration * PX_PER_MIN, 28);
            const timeStr = `${fmtTime(placedStart)} – ${fmtTime(placedStart + duration)}`;
            return (
              <div
                className={`
                  absolute rounded-xl border-2 border-dashed shadow-lg overflow-hidden flex flex-col z-20
                  transition-[top,height,background-color,border-color,box-shadow] duration-150 ease-out
                  ${success
                    ? "border-green-500 bg-green-50 dark:bg-green-950/40"
                    : "border-violet-500 bg-violet-50 dark:bg-violet-950/40 ring-2 ring-violet-300/30"
                  }
                `}
                style={{
                  top: minutesToTop(placedStart),
                  height: blockPx,
                  insetInlineStart: 48,
                  insetInlineEnd: 4,
                  animation: "aptBlockAppear 0.3s ease-out",
                }}
              >
                <div className="flex-1 min-h-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  {blockPx < 40 ? (
                    <div className="flex items-center h-full px-2 gap-1.5">
                      <Dumbbell className="size-3 shrink-0 text-violet-600" />
                      <span className="text-xs font-semibold truncate text-violet-800">
                        {success ? "✓" : selectedService?.title}
                      </span>
                      <span className="text-[11px] tabular-nums opacity-70 shrink-0 text-violet-600">{timeStr}</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <Dumbbell className="size-4 shrink-0 text-violet-600" />
                        <p className="text-sm font-semibold truncate leading-tight text-violet-800">
                          {success ? (
                            <span className="flex items-center gap-1.5 text-green-700">
                              <Check className="size-4" />
                              {t("cls.save")}
                            </span>
                          ) : selectedService?.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="size-3 opacity-60 shrink-0 text-violet-500" />
                        <span className="text-xs tabular-nums font-semibold text-violet-700">{timeStr}</span>
                      </div>
                      {blockPx >= 80 && daysOfWeek.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-violet-600/80">
                          <Repeat className="size-3 shrink-0" />
                          {daysOfWeek.sort().map((d) => tFn(locale, DAYS_SHORT_KEYS[d] as any)).join(", ")}
                        </div>
                      )}
                      {blockPx >= 100 && (
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-violet-600/70">
                          <Users className="size-3 shrink-0" />
                          {maxParticipants} {t("cls.max_participants")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="!grid-rows-none !gap-0 max-w-none w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] p-0 flex flex-col overflow-hidden rounded-2xl"
      >
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 border-b">
          <DialogHeader className="flex-1 text-start">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Dumbbell className="size-5" />
              {schedule ? t("cls.edit") : t("cls.add")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {t("cls.subtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Mobile tabs */}
        <div className="shrink-0 flex md:hidden border-b">
          <button
            type="button"
            onClick={() => setMobileTab("settings")}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              mobileTab === "settings"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            {locale === "he" ? "הגדרות" : "Settings"}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("calendar")}
            className={`flex-1 py-2.5 text-center text-sm font-medium transition-colors ${
              mobileTab === "calendar"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
            }`}
          >
            {locale === "he" ? "יומן" : "Calendar"}
          </button>
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden md:flex flex-1 min-h-0">
          <div className="w-72 shrink-0 border-e bg-muted/20 p-4 overflow-y-auto">
            {sidebarContent}
          </div>
          {calendarContent}
        </div>

        {/* Mobile: tab content */}
        <div className="flex md:hidden flex-1 min-h-0 flex-col">
          {mobileTab === "settings" ? (
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarContent}
            </div>
          ) : (
            calendarContent
          )}
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
