"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateAppointmentStatus, cancelAppointment } from "@/actions/booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  User,
  CreditCard,
  CheckCircle2,
  XCircle,
  UserX,
  Activity,
  Phone,
  Mail,
  ArrowLeft,
} from "lucide-react";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

const STATUS_STYLES: Record<
  AppointmentStatus,
  { bg: string; text: string; dot: string }
> = {
  PENDING: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
  NO_SHOW: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "dash.status_pending",
  CONFIRMED: "dash.status_confirmed",
  COMPLETED: "dash.status_completed",
  CANCELLED: "dash.status_cancelled",
  NO_SHOW: "dash.status_no_show",
};

interface AppointmentDetailProps {
  appointment: {
    id: string;
    status: AppointmentStatus;
    startTime: Date;
    endTime: Date;
    paymentStatus: string;
    paymentAmount: string | null;
    notes: string | null;
    source: string;
    cancelReason: string | null;
    cancelledAt: Date | null;
    cancelledBy: string | null;
    createdAt: Date;
    serviceId: string;
    serviceName: string;
    serviceDuration: number;
    servicePrice: string | null;
    staffId: string;
    staffName: string;
    staffImage: string | null;
    customerId: string;
    customerName: string;
    customerPhone: string | null;
    customerEmail: string | null;
    logs: {
      id: string;
      appointmentId: string;
      action: string;
      oldValue: string | null;
      newValue: string | null;
      performedBy: string;
      createdAt: Date;
    }[];
  };
}

export function AppointmentDetail({ appointment }: AppointmentDetailProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const dtLocale = locale === "he" ? "he-IL" : "en-US";

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString(dtLocale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString(dtLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelative(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return locale === "he" ? "עכשיו" : "just now";
    if (minutes < 60)
      return locale === "he" ? `לפני ${minutes} דקות` : `${minutes}m ago`;
    if (hours < 24)
      return locale === "he" ? `לפני ${hours} שעות` : `${hours}h ago`;
    return locale === "he" ? `לפני ${days} ימים` : `${days}d ago`;
  }

  function handleStatusUpdate(status: "CONFIRMED" | "COMPLETED" | "NO_SHOW") {
    startTransition(async () => {
      await updateAppointmentStatus(appointment.id, status);
      router.refresh();
    });
  }

  function handleCancel() {
    startTransition(async () => {
      await cancelAppointment(appointment.id, "BUSINESS");
      router.refresh();
    });
  }

  const style = STATUS_STYLES[appointment.status];
  const hasActions =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("apt.back_to_list")}
      </Link>

      {/* 3-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Service / Appointment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              {t("apt.service_info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-lg font-semibold">
                {appointment.serviceName}
              </div>
              <div className="text-sm text-muted-foreground">
                {appointment.serviceDuration} {t("common.min")}
                {appointment.servicePrice &&
                  ` · ₪${Number(appointment.servicePrice).toLocaleString(dtLocale)}`}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 text-muted-foreground" />
                <span>{formatDate(appointment.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span>
                  {formatTime(appointment.startTime)} –{" "}
                  {formatTime(appointment.endTime)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("apt.status")}:
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
              >
                <span className={`size-1.5 rounded-full ${style.dot}`} />
                {t(STATUS_LABELS[appointment.status] as any)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("apt.payment_info")}:
                </span>
                <span className="font-medium">
                  {appointment.paymentAmount
                    ? `₪${Number(appointment.paymentAmount).toLocaleString(dtLocale)}`
                    : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({paymentStatusLabel(appointment.paymentStatus, t)})
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Activity className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("apt.source")}:
                </span>
                <span className="font-medium">
                  {appointment.source === "DASHBOARD"
                    ? t("apt.source_dashboard")
                    : appointment.source === "ONLINE"
                      ? t("apt.source_online")
                      : appointment.source}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("apt.created")}:
                </span>
                <span className="font-medium">
                  {formatDate(appointment.createdAt)}
                </span>
              </div>
            </div>

            {appointment.notes && (
              <>
                <Separator />
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {t("book.notes")}:
                  </span>
                  <p className="mt-1">{appointment.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Column 2: People */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              {t("apt.people")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Customer */}
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("apt.customer")}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <User className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{appointment.customerName}</div>
                  {appointment.customerPhone && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="size-3" />
                      <span dir="ltr">{appointment.customerPhone}</span>
                    </div>
                  )}
                  {appointment.customerEmail && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="size-3" />
                      <span>{appointment.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Staff */}
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("apt.staff")}
              </div>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {appointment.staffImage ? (
                    <AvatarImage src={appointment.staffImage} />
                  ) : null}
                  <AvatarFallback>
                    {appointment.staffName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="font-semibold">{appointment.staffName}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 3: Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              {t("apt.actions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasActions ? (
              <>
                {appointment.status === "PENDING" && (
                  <Button
                    className="w-full"
                    disabled={isPending}
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                  >
                    <CheckCircle2 className="size-4" />
                    {t("apt.confirm")}
                  </Button>
                )}
                {appointment.status === "CONFIRMED" && (
                  <>
                    <Button
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleStatusUpdate("COMPLETED")}
                    >
                      <CheckCircle2 className="size-4" />
                      {t("apt.complete")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isPending}
                      onClick={() => handleStatusUpdate("NO_SHOW")}
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
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                {appointment.status === "CANCELLED" &&
                  appointment.cancelReason && (
                    <p className="mb-2">
                      <span className="font-medium">{t("apt.cancel")}:</span>{" "}
                      {appointment.cancelReason}
                    </p>
                  )}
                <p>
                  {t(STATUS_LABELS[appointment.status] as any)}
                  {appointment.cancelledAt &&
                    ` · ${formatDate(appointment.cancelledAt)}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            {t("apt.activity_log")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointment.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute start-[7px] top-2 bottom-2 w-px bg-border" />

              {appointment.logs.map((log) => {
                const fmtOld = formatLogValue(log.action, log.oldValue, dtLocale, t);
                const fmtNew = formatLogValue(log.action, log.newValue, dtLocale, t);

                return (
                  <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="relative z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-2 border-border bg-background" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {logActionLabel(log.action, t)}
                      </div>
                      {(fmtOld || fmtNew) && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {fmtOld && <span>{fmtOld}</span>}
                          {fmtOld && fmtNew && " → "}
                          {fmtNew && <span className="font-medium">{fmtNew}</span>}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {performedByLabel(log.performedBy, t)} · {formatRelative(log.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const PAYMENT_STATUS_KEYS: Record<string, string> = {
  PAID: "pay.status_paid",
  UNPAID: "pay.status_unpaid",
  ON_SITE: "pay.status_on_site",
  FREE: "pay.status_free",
  PACKAGE: "pay.status_package",
  DEPOSIT: "pay.status_deposit",
  REFUNDED: "pay.status_refunded",
};

function paymentStatusLabel(status: string, t: (key: any) => string): string {
  const key = PAYMENT_STATUS_KEYS[status];
  return key ? t(key) : status;
}

function logActionLabel(
  action: string,
  t: (key: any) => string
): string {
  switch (action) {
    case "CREATED":
      return t("apt.log_created");
    case "CANCELLED":
      return t("apt.log_cancelled");
    case "STATUS_CHANGE":
      return t("apt.log_status");
    case "RESCHEDULED":
      return t("apt.log_rescheduled");
    default:
      return action;
  }
}

function performedByLabel(
  value: string,
  t: (key: any) => string
): string {
  switch (value) {
    case "CUSTOMER":
      return t("apt.performed_customer");
    case "BUSINESS":
      return t("apt.performed_business");
    default:
      return value;
  }
}

const STATUS_DISPLAY: Record<string, string> = {
  PENDING: "dash.status_pending",
  CONFIRMED: "dash.status_confirmed",
  COMPLETED: "dash.status_completed",
  CANCELLED: "dash.status_cancelled",
  NO_SHOW: "dash.status_no_show",
};

function formatLogValue(
  action: string,
  value: string | null,
  dtLocale: string,
  t: (key: any, vars?: any) => string
): string | null {
  if (!value) return null;

  if (action === "RESCHEDULED") {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(dtLocale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }) + ", " + d.toLocaleTimeString(dtLocale, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
    } catch { /* fall through */ }
  }

  if (action === "STATUS_CHANGE" || action === "CREATED" || action === "CANCELLED") {
    const key = STATUS_DISPLAY[value];
    if (key) return t(key);
  }

  return value;
}
