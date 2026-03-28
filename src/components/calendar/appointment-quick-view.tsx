"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CalendarClock,
  Clock,
  User,
  Scissors,
  Phone,
  CheckCircle2,
  XCircle,
  UserX,
  ExternalLink,
  StickyNote,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateAppointmentStatus, cancelAppointment, rescheduleAppointment } from "@/actions/booking";
import { BUSINESS_TZ, wallClockToDate } from "./calendar-types";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "NO_SHOW";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { bg: string; text: string; dot: string; border: string; labelKey: string }
> = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-300",
    labelKey: "dash.status_pending",
  },
  CONFIRMED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-300",
    labelKey: "dash.status_confirmed",
  },
  COMPLETED: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    dot: "bg-slate-400",
    border: "border-slate-300",
    labelKey: "dash.status_completed",
  },
  NO_SHOW: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-300",
    labelKey: "dash.status_no_show",
  },
};

const SOURCE_LABELS: Record<string, { label: string; labelHe: string }> = {
  ONLINE: { label: "Online", labelHe: "אונליין" },
  DASHBOARD: { label: "Dashboard", labelHe: "פאנל ניהול" },
  WALK_IN: { label: "Walk-in", labelHe: "כניסה ישירה" },
};

export interface QuickViewAppointment {
  id: string;
  status: string;
  startTime: Date;
  endTime: Date;
  serviceName: string;
  serviceId?: string;
  durationMinutes?: number;
  staffId: string;
  staffName: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  source?: string;
  classInstanceId?: string | null;
}

interface AppointmentQuickViewProps {
  appointment: QuickViewAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toLocalParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}


function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
      dir="ltr"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
}) {
  const display = value
    ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
    : "";

  const handleNativeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange]
  );

  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={handleNativeChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="flex h-10 w-full items-center rounded-lg border border-input bg-background px-3 text-sm tabular-nums">
        <Calendar className="size-3.5 shrink-0 text-muted-foreground me-2" />
        <span>{display}</span>
      </div>
    </div>
  );
}

export function AppointmentQuickView({
  appointment,
  open,
  onOpenChange,
}: AppointmentQuickViewProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");

  if (!appointment) return null;

  const dtLocale = locale === "he" ? "he-IL" : "en-US";
  const status = appointment.status as AppointmentStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const hasActions = status === "PENDING" || status === "CONFIRMED";

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  const durationMins = Math.round(
    (endDate.getTime() - startDate.getTime()) / 60_000
  );

  const dateStr = startDate.toLocaleDateString(dtLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: BUSINESS_TZ,
  });
  const startTimeStr = startDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TZ,
  });
  const endTimeStr = endDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TZ,
  });
  const timeStr = `${startTimeStr} – ${endTimeStr}`;

  function handleStatus(newStatus: "CONFIRMED" | "COMPLETED" | "NO_SHOW") {
    startTransition(async () => {
      await updateAppointmentStatus(appointment!.id, newStatus);
      router.refresh();
      onOpenChange(false);
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelAppointment(appointment!.id, "BUSINESS");
      router.refresh();
      onOpenChange(false);
    });
  }

  function openReschedule() {
    const p = toLocalParts(startDate, BUSINESS_TZ);
    setNewDate(`${p.year}-${p.month}-${p.day}`);
    setNewTime(`${p.hour}:${p.minute}`);
    setRescheduleError("");
    setRescheduleMode(true);
  }

  function closeReschedule() {
    setRescheduleMode(false);
    setRescheduleError("");
  }

  function handleReschedule() {
    if (!newDate || !newTime) return;
    setRescheduleError("");
    startTransition(async () => {
      const [h, m] = newTime.split(":").map(Number);
      const dateRef = new Date(`${newDate}T12:00:00Z`);
      const utcStart = wallClockToDate(dateRef, h, m);
      const res = await rescheduleAppointment(appointment!.id, utcStart.toISOString());
      if (res.success) {
        router.refresh();
        onOpenChange(false);
        setRescheduleMode(false);
      } else {
        setRescheduleError(t("apt.reschedule_conflict" as any));
      }
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setRescheduleMode(false);
        onOpenChange(v);
      }}
    >
      <SheetContent side={locale === "he" ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-2 pe-10">
          <SheetTitle className="text-lg leading-snug">{appointment.serviceName}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("apt.detail_title")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {/* Status badge + source */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${config.bg} ${config.text} ${config.border}`}
            >
              <span className={`size-2 rounded-full ${config.dot}`} />
              {t(config.labelKey as any)}
            </div>
            {appointment.source && SOURCE_LABELS[appointment.source] && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {locale === "he"
                  ? SOURCE_LABELS[appointment.source].labelHe
                  : SOURCE_LABELS[appointment.source].label}
              </span>
            )}
          </div>

          {/* Info card */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{dateStr}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {timeStr}
                <span className="ms-2 text-muted-foreground">
                  ({durationMins} {t("common.min")})
                </span>
              </span>
            </div>

            <Separator />

            <div className="flex items-center gap-3 text-sm">
              <User className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex items-center gap-2">
                <span className="font-medium">{appointment.customerName}</span>
                {appointment.customerPhone && (
                  <a
                    href={`tel:${appointment.customerPhone}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <Phone className="size-3" />
                    <span dir="ltr">{appointment.customerPhone}</span>
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Scissors className="size-4 shrink-0 text-muted-foreground" />
              <span>{appointment.staffName}</span>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="flex gap-3 rounded-xl border bg-muted/10 p-4 text-sm">
              <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">{appointment.notes}</p>
            </div>
          )}

          {/* Reschedule inline form */}
          {rescheduleMode && (
            <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="size-4 text-primary" />
                {t("apt.reschedule" as any)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("apt.reschedule_date" as any)}</Label>
                  <DateInput value={newDate} onChange={setNewDate} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("apt.reschedule_time" as any)}</Label>
                  <TimeSelect value={newTime} onChange={setNewTime} />
                </div>
              </div>

              {rescheduleError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
                  <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{rescheduleError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                  onClick={closeReschedule}
                >
                  {t("apt.reschedule_cancel" as any)}
                </Button>
                <Button
                  className="flex-1"
                  disabled={isPending || !newDate || !newTime}
                  onClick={handleReschedule}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {t("apt.reschedule_save" as any)}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {hasActions && !rescheduleMode && (
            <div className="space-y-2 pt-1">
              {status === "PENDING" && (
                <Button
                  className="w-full"
                  disabled={isPending}
                  onClick={() => handleStatus("CONFIRMED")}
                >
                  <CheckCircle2 className="size-4" />
                  {t("apt.confirm")}
                </Button>
              )}
              {status === "CONFIRMED" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    disabled={isPending}
                    onClick={() => handleStatus("COMPLETED")}
                  >
                    <CheckCircle2 className="size-4" />
                    {t("apt.complete")}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={() => handleStatus("NO_SHOW")}
                  >
                    <UserX className="size-4" />
                    {t("apt.no_show")}
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={openReschedule}
                >
                  <CalendarClock className="size-4" />
                  {t("apt.reschedule" as any)}
                </Button>
                <Button
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleCancel}
                >
                  <XCircle className="size-4" />
                  {t("apt.cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Link to full detail page */}
          <Link
            href={`/dashboard/appointments/${appointment.id}`}
            className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            {t("apt.view_full_details")}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
