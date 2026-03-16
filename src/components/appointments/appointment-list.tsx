"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateAppointmentStatus, cancelAppointment } from "@/actions/booking";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  MoreVertical,
  Search,
  UserX,
  XCircle,
} from "lucide-react";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

interface Appointment {
  id: string;
  status: AppointmentStatus;
  startTime: Date;
  endTime: Date;
  paymentStatus: string;
  paymentAmount: string | null;
  notes: string | null;
  serviceName: string;
  staffName: string;
  customerName: string;
  customerPhone: string | null;
}

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

interface DayGroup {
  dateKey: string;
  label: string;
  isToday: boolean;
  appointments: Appointment[];
}

function groupByDay(
  appointments: Appointment[],
  dtLocale: string
): DayGroup[] {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const groups = new Map<string, Appointment[]>();

  for (const apt of appointments) {
    const d = new Date(apt.startTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(apt);
  }

  const sorted = [...groups.entries()].sort(
    ([a], [b]) => b.localeCompare(a)
  );

  return sorted.map(([dateKey, apts]) => {
    const d = new Date(apts[0].startTime);
    const label = d.toLocaleDateString(dtLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return {
      dateKey,
      label,
      isToday: dateKey === todayKey,
      appointments: apts.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    };
  });
}

export function AppointmentList({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.customerName.toLowerCase().includes(q));
    }
    return list;
  }, [appointments, statusFilter, search]);

  const dtLocale = locale === "he" ? "he-IL" : "en-US";
  const dayGroups = useMemo(
    () => groupByDay(filtered, dtLocale),
    [filtered, dtLocale]
  );

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString(dtLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleStatusUpdate(
    id: string,
    status: "CONFIRMED" | "COMPLETED" | "NO_SHOW"
  ) {
    startTransition(async () => {
      await updateAppointmentStatus(id, status);
      router.refresh();
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelAppointment(id, "BUSINESS");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("apt.search_ph")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <span>
              {statusFilter === "ALL"
                ? t("apt.all_statuses")
                : statusFilter === "PENDING"
                  ? t("dash.status_pending")
                  : statusFilter === "CONFIRMED"
                    ? t("dash.status_confirmed")
                    : statusFilter === "COMPLETED"
                      ? t("dash.status_completed")
                      : statusFilter === "CANCELLED"
                        ? t("dash.status_cancelled")
                        : t("dash.status_no_show")}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("apt.all_statuses")}</SelectItem>
            <SelectItem value="PENDING">{t("dash.status_pending")}</SelectItem>
            <SelectItem value="CONFIRMED">
              {t("dash.status_confirmed")}
            </SelectItem>
            <SelectItem value="COMPLETED">
              {t("dash.status_completed")}
            </SelectItem>
            <SelectItem value="CANCELLED">
              {t("dash.status_cancelled")}
            </SelectItem>
            <SelectItem value="NO_SHOW">
              {t("dash.status_no_show")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <CalendarX2 className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {t("apt.no_appointments")}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("apt.no_appointments_desc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {dayGroups.map((group) => (
            <section key={group.dateKey}>
              {/* Day header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    group.isToday
                      ? "bg-indigo-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <CalendarDays className="size-4" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {group.isToday && (
                      <span className="me-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {locale === "he" ? "היום" : "Today"}
                      </span>
                    )}
                    {group.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {group.appointments.length}{" "}
                    {locale === "he" ? "תורים" : "appointments"}
                  </p>
                </div>
              </div>

              {/* Desktop table for this day */}
              <div className="hidden md:block">
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-muted-foreground">
                          <th className="px-4 py-2.5 text-start font-medium">
                            {t("apt.customer")}
                          </th>
                          <th className="px-4 py-2.5 text-start font-medium">
                            {t("apt.service")}
                          </th>
                          <th className="px-4 py-2.5 text-start font-medium">
                            {t("apt.staff")}
                          </th>
                          <th className="px-4 py-2.5 text-start font-medium">
                            {locale === "he" ? "שעה" : "Time"}
                          </th>
                          <th className="px-4 py-2.5 text-start font-medium">
                            {t("apt.status")}
                          </th>
                          <th className="px-4 py-2.5 text-start font-medium">
                            {t("apt.amount")}
                          </th>
                          <th className="px-4 py-2.5 text-end font-medium">
                            {t("apt.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {group.appointments.map((apt) => (
                          <tr
                            key={apt.id}
                            className="cursor-pointer transition-colors hover:bg-muted/30"
                            onClick={() =>
                              router.push(
                                `/dashboard/appointments/${apt.id}`
                              )
                            }
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">
                                {apt.customerName}
                              </div>
                              {apt.customerPhone && (
                                <div className="text-xs text-muted-foreground">
                                  {apt.customerPhone}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">{apt.serviceName}</td>
                            <td className="px-4 py-3">{apt.staffName}</td>
                            <td className="px-4 py-3 tabular-nums">
                              {formatTime(apt.startTime)} –{" "}
                              {formatTime(apt.endTime)}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={apt.status} />
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {apt.paymentAmount
                                ? `₪${Number(apt.paymentAmount).toLocaleString(dtLocale)}`
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-end">
                              <ActionsMenu
                                appointment={apt}
                                disabled={isPending}
                                onStatusUpdate={handleStatusUpdate}
                                onCancel={handleCancel}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Mobile cards for this day */}
              <div className="flex flex-col gap-2 md:hidden">
                {group.appointments.map((apt) => (
                  <Card
                    key={apt.id}
                    className="cursor-pointer overflow-hidden"
                    onClick={() =>
                      router.push(`/dashboard/appointments/${apt.id}`)
                    }
                  >
                    <CardContent className="px-3.5 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">
                              {apt.customerName}
                            </span>
                            <StatusBadge status={apt.status} />
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{apt.serviceName}</span>
                            <span className="text-muted-foreground/40">·</span>
                            <span>{apt.staffName}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-end">
                            <div className="text-sm font-semibold tabular-nums">
                              {formatTime(apt.startTime)} – {formatTime(apt.endTime)}
                            </div>
                            <div className="text-xs text-muted-foreground tabular-nums">
                              {apt.paymentAmount
                                ? `₪${Number(apt.paymentAmount).toLocaleString(dtLocale)}`
                                : ""}
                            </div>
                          </div>
                          <ActionsMenu
                            appointment={apt}
                            disabled={isPending}
                            onStatusUpdate={handleStatusUpdate}
                            onCancel={handleCancel}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const t = useT();
  const style = STATUS_STYLES[status];
  const label =
    STATUS_LABELS[status] as keyof typeof STATUS_LABELS extends never
      ? string
      : (typeof STATUS_LABELS)[typeof status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} />
      {t(label as any)}
    </span>
  );
}

function ActionsMenu({
  appointment,
  disabled,
  onStatusUpdate,
  onCancel,
}: {
  appointment: Appointment;
  disabled: boolean;
  onStatusUpdate: (
    id: string,
    status: "CONFIRMED" | "COMPLETED" | "NO_SHOW"
  ) => void;
  onCancel: (id: string) => void;
}) {
  const t = useT();
  const { status, id } = appointment;

  const hasActions =
    status === "PENDING" || status === "CONFIRMED";

  if (!hasActions) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            disabled={disabled}
          />
        }
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "PENDING" && (
          <DropdownMenuItem onClick={() => onStatusUpdate(id, "CONFIRMED")}>
            <CheckCircle2 className="mr-2 size-4 text-blue-500" />
            {t("apt.confirm")}
          </DropdownMenuItem>
        )}
        {status === "CONFIRMED" && (
          <>
            <DropdownMenuItem onClick={() => onStatusUpdate(id, "COMPLETED")}>
              <CheckCircle2 className="mr-2 size-4 text-emerald-500" />
              {t("apt.complete")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusUpdate(id, "NO_SHOW")}>
              <UserX className="mr-2 size-4 text-gray-500" />
              {t("apt.no_show")}
            </DropdownMenuItem>
          </>
        )}
        {(status === "PENDING" || status === "CONFIRMED") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onCancel(id)}
            >
              <XCircle className="mr-2 size-4" />
              {t("apt.cancel")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
