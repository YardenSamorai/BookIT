"use client";

import { useTransition } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Phone,
  CheckCircle2,
  XCircle,
  UserX,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateAppointmentStatus, cancelAppointment } from "@/actions/booking";
import { BUSINESS_TZ } from "./calendar-types";

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

export function AppointmentQuickView({
  appointment,
  open,
  onOpenChange,
}: AppointmentQuickViewProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
  const timeStr = `${startDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TZ,
  })} – ${endDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TZ,
  })}`;

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "he" ? "left" : "right"} className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">{appointment.serviceName}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("apt.detail_title")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-1">
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

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {timeStr}
                <span className="ms-1.5 text-muted-foreground">
                  ({durationMins} {t("common.min")})
                </span>
              </span>
            </div>
          </div>

          <Separator />

          {/* People */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <span className="font-medium">{appointment.customerName}</span>
                {appointment.customerPhone && (
                  <a
                    href={`tel:${appointment.customerPhone}`}
                    className="ms-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
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
            <>
              <Separator />
              <div className="flex gap-3 text-sm">
                <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">{appointment.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          {hasActions && (
            <div className="space-y-2">
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
                <>
                  <Button
                    className="w-full"
                    disabled={isPending}
                    onClick={() => handleStatus("COMPLETED")}
                  >
                    <CheckCircle2 className="size-4" />
                    {t("apt.complete")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isPending}
                    onClick={() => handleStatus("NO_SHOW")}
                  >
                    <UserX className="size-4" />
                    {t("apt.no_show")}
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                className="w-full"
                disabled={isPending}
                onClick={handleCancel}
              >
                <XCircle className="size-4" />
                {t("apt.cancel")}
              </Button>
            </div>
          )}

          {/* Link to full detail page */}
          <Link
            href={`/dashboard/appointments/${appointment.id}`}
            className="flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ExternalLink className="size-3.5" />
            {t("apt.view_full_details")}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
