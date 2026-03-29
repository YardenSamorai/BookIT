"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { updateAppointmentStatus, cancelAppointment, importAppointments } from "@/actions/booking";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  Loader2,
  MoreVertical,
  Search,
  Upload,
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

interface ServiceInfo {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | null;
}
interface StaffInfo {
  id: string;
  name: string;
}

export function AppointmentList({
  appointments,
  services = [],
  staff = [],
}: {
  appointments: Appointment[];
  services?: ServiceInfo[];
  staff?: StaffInfo[];
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportDialogOpen(true)}
        >
          <FileSpreadsheet className="size-4 me-1.5" />
          {t("apt.import_btn")}
        </Button>
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
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setImportDialogOpen(true)}
            >
              <FileSpreadsheet className="size-4 me-1.5" />
              {t("apt.import_btn")}
            </Button>
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

      <AppointmentImportWizard
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        services={services}
        staff={staff}
      />
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

// ─── Appointment Import Wizard ──────────────────────────────────────────────

type WizardStep = 0 | 1 | 2 | 3; // upload, review, preview, importing/done

interface AptParsedRow {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  notes: string;
  duration: string;
  valid: boolean;
  errorKey?: string;
}

const COL_HEADERS: Record<string, string[]> = {
  customerName: ["name", "שם", "שם לקוח", "customer name", "customer", "לקוח", "שם מלא"],
  customerPhone: ["phone", "טלפון", "מספר טלפון", "נייד", "customer phone", "טלפון לקוח"],
  serviceName: ["service", "שירות", "שם שירות", "service name", "טיפול"],
  staffName: ["staff", "צוות", "איש צוות", "שם איש צוות", "staff name", "מטפל", "מטפלת"],
  date: ["date", "תאריך", "יום"],
  time: ["time", "שעה", "hour"],
  notes: ["notes", "הערות", "הערה", "note"],
  duration: ["duration", "משך", "דקות", "minutes", "duration (minutes)"],
};

function findCol(row: Record<string, string>, headers: string[]): string {
  for (const h of headers) {
    for (const key of Object.keys(row)) {
      if (key.trim().toLowerCase() === h.toLowerCase()) return row[key];
    }
  }
  return "";
}

function findHeaderKey(fileHeaders: string[], expected: string[]): string | null {
  for (const e of expected) {
    for (const h of fileHeaders) {
      if (h.trim().toLowerCase() === e.toLowerCase()) return h;
    }
  }
  return null;
}

const STEP_KEYS = [
  "apt.import_step_upload",
  "apt.import_step_review",
  "apt.import_step_preview",
  "apt.import_step_import",
] as const;

function StepIndicator({ current, t }: { current: WizardStep; t: (k: any) => string }) {
  return (
    <div className="flex items-center justify-between px-1">
      {STEP_KEYS.map((key, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={key} className="flex items-center gap-1.5 flex-1 last:flex-initial">
            <div
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {t(key as any)}
            </span>
            {i < STEP_KEYS.length - 1 && (
              <div className={`mx-1 h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface DetectedField {
  id: string;
  label: string;
  required: boolean;
  detected: boolean;
  headerFound: string | null;
  sample: string;
}

function AppointmentImportWizard({
  open,
  onOpenChange,
  services,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceInfo[];
  staff: StaffInfo[];
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<WizardStep>(0);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<AptParsedRow[]>([]);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number; error?: string } | null>(null);

  const svcLookup = useMemo(() => {
    const map: Record<string, ServiceInfo> = {};
    for (const s of services) map[s.name.trim().toLowerCase()] = s;
    return map;
  }, [services]);

  const staffLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of staff) map[s.name.trim().toLowerCase()] = s.id;
    return map;
  }, [staff]);

  function reset() {
    setStep(0);
    setFileName("");
    setDragging(false);
    setLoading(false);
    setParsedRows([]);
    setDetectedFields([]);
    setShowErrors(false);
    setProgress(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const FIELD_DEFS: { id: string; labelKey: string; required: boolean }[] = [
    { id: "customerName", labelKey: "apt.import_col_customer_name", required: true },
    { id: "customerPhone", labelKey: "apt.import_col_customer_phone", required: true },
    { id: "serviceName", labelKey: "apt.import_col_service", required: true },
    { id: "staffName", labelKey: "apt.import_col_staff", required: true },
    { id: "date", labelKey: "apt.import_col_date", required: true },
    { id: "time", labelKey: "apt.import_col_time", required: true },
    { id: "notes", labelKey: "apt.import_col_notes", required: false },
    { id: "duration", labelKey: "apt.import_col_duration", required: false },
  ];

  async function processFile(file: File) {
    setLoading(true);
    setFileName(file.name);

    const { read, utils } = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, string>>(ws);

    if (rows.length === 0) {
      setLoading(false);
      return;
    }

    const fileHeaders = Object.keys(rows[0]);
    const firstRow = rows[0];

    const detected: DetectedField[] = FIELD_DEFS.map((fd) => {
      const headerKey = findHeaderKey(fileHeaders, COL_HEADERS[fd.id]);
      const sample = headerKey ? String(firstRow[headerKey] ?? "") : "";
      return {
        id: fd.id,
        label: t(fd.labelKey as any),
        required: fd.required,
        detected: !!headerKey,
        headerFound: headerKey,
        sample,
      };
    });

    const mapped: AptParsedRow[] = rows.map((r) => {
      const customerName = findCol(r, COL_HEADERS.customerName);
      const customerPhone = findCol(r, COL_HEADERS.customerPhone);
      const serviceName = findCol(r, COL_HEADERS.serviceName);
      const staffName = findCol(r, COL_HEADERS.staffName);
      const date = findCol(r, COL_HEADERS.date);
      const time = findCol(r, COL_HEADERS.time);
      const notes = findCol(r, COL_HEADERS.notes);
      const duration = findCol(r, COL_HEADERS.duration);

      let valid = true;
      let errorKey: string | undefined;

      if (!customerName.trim() || !customerPhone.trim()) {
        valid = false;
        errorKey = "apt.import_row_error_name_phone";
      } else if (!svcLookup[serviceName.trim().toLowerCase()]) {
        valid = false;
        errorKey = "apt.import_row_error_service";
      } else if (!staffLookup[staffName.trim().toLowerCase()]) {
        valid = false;
        errorKey = "apt.import_row_error_staff";
      } else if (!date.trim() || !time.trim()) {
        valid = false;
        errorKey = "apt.import_row_error_datetime";
      }

      return { customerName, customerPhone, serviceName, staffName, date, time, notes, duration, valid, errorKey };
    });

    setDetectedFields(detected);
    setParsedRows(mapped);
    setLoading(false);
    setStep(1);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  async function startImport() {
    const valid = parsedRows.filter((r) => r.valid);
    if (valid.length === 0) return;

    setStep(3);
    setProgress({ done: 0, total: valid.length });

    const serviceMap: Record<string, { id: string; durationMinutes: number; price: string | null }> = {};
    for (const s of services) serviceMap[s.name.trim()] = { id: s.id, durationMinutes: s.durationMinutes, price: s.price };
    const staffMap: Record<string, string> = {};
    for (const s of staff) staffMap[s.name.trim()] = s.id;

    const batchSize = 10;
    let imported = 0;
    let skipped = 0;

    const mappedRows = valid.map((r) => ({
      customerName: r.customerName.trim(),
      customerPhone: r.customerPhone.trim(),
      serviceName: r.serviceName.trim(),
      staffName: r.staffName.trim(),
      date: r.date.trim(),
      time: r.time.trim(),
      notes: r.notes.trim() || undefined,
      durationOverride: r.duration ? parseInt(r.duration, 10) || undefined : undefined,
    }));

    for (let i = 0; i < mappedRows.length; i += batchSize) {
      const batch = mappedRows.slice(i, i + batchSize);
      const res = await importAppointments(batch, serviceMap, staffMap);
      if (res.success) {
        imported += res.data.imported;
        skipped += res.data.skipped;
      } else {
        setResult({ imported, skipped, error: res.error });
        router.refresh();
        return;
      }
      setProgress({ done: Math.min(i + batchSize, mappedRows.length), total: mappedRows.length });
    }

    setResult({ imported, skipped });
    router.refresh();
  }

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;
  const progressPct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  const missingRequired = detectedFields.filter((f) => f.required && !f.detected).length;
  const isImporting = step === 3 && !result;

  const displayRows = useMemo(() => {
    const base = showErrors ? parsedRows : parsedRows.filter((r) => r.valid);
    return base.slice(0, 50);
  }, [parsedRows, showErrors]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (isImporting) return;
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent
        dir={locale === "he" ? "rtl" : "ltr"}
        className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg">{t("apt.import_title" as any)}</DialogTitle>
            <DialogDescription className="text-sm">{t("apt.import_subtitle" as any)}</DialogDescription>
          </DialogHeader>
          <StepIndicator current={step} t={t} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ─── Step 0: Upload ─── */}
          {step === 0 && (
            <div className="space-y-5">
              <div
                ref={dropRef}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {loading ? (
                  <Loader2 className="size-10 animate-spin text-primary" />
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                      <Upload className="size-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium">{t("apt.import_upload_title" as any)}</p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      {t("apt.import_upload_desc" as any)}
                    </p>
                    <p className="mt-3 text-[11px] text-muted-foreground/70">
                      {t("apt.import_upload_formats" as any)}
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {/* Collapsible guide */}
              <details className="group rounded-lg border bg-muted/20">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium select-none">
                  <FileSpreadsheet className="size-4 text-muted-foreground" />
                  {locale === "he" ? "מה צריך להיות בקובץ?" : "What should the file contain?"}
                  <ChevronDown className="size-4 text-muted-foreground ms-auto transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">{t("apt.import_required_title" as any)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELD_DEFS.filter((f) => f.required).map((f) => (
                        <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          <span className="size-1.5 rounded-full bg-primary" />
                          {t(f.labelKey as any)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">{t("apt.import_optional_title" as any)}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FIELD_DEFS.filter((f) => !f.required).map((f) => (
                        <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {t(f.labelKey as any)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <Clock className="size-3.5 mt-0.5 shrink-0" />
                      <span>{t("apt.import_date_formats" as any)}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Clock className="size-3.5 mt-0.5 shrink-0" />
                      <span>{t("apt.import_time_format" as any)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">{t("apt.import_tip" as any)}</p>
                </div>
              </details>
            </div>
          )}

          {/* ─── Step 1: Review detected fields ─── */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Success / Warning banner */}
              {missingRequired === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/60 p-3.5 dark:border-green-900 dark:bg-green-950/20">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                    <CheckCircle2 className="size-4.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{t("apt.import_all_required_found" as any)}</p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/70">
                      {t("apt.import_rows_found" as any, { n: parsedRows.length })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3.5 dark:border-red-900 dark:bg-red-950/20">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                    <XCircle className="size-4.5 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {t("apt.import_missing_required" as any, { n: missingRequired })}
                  </p>
                </div>
              )}

              {/* Field detection cards */}
              <div className="space-y-2">
                {detectedFields.map((field) => (
                  <div
                    key={field.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      field.detected
                        ? "border-green-200/60 bg-green-50/30 dark:border-green-900/40 dark:bg-green-950/10"
                        : field.required
                          ? "border-red-200/60 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/10"
                          : "border-muted bg-muted/10"
                    }`}
                  >
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                      field.detected ? "bg-green-100 dark:bg-green-900/40" : field.required ? "bg-red-100 dark:bg-red-900/40" : "bg-muted"
                    }`}>
                      {field.detected
                        ? <CheckCircle2 className="size-4 text-green-600" />
                        : field.required
                          ? <XCircle className="size-4 text-red-500" />
                          : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.label}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                          field.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          {field.required ? t("apt.import_field_required" as any) : t("apt.import_field_optional" as any)}
                        </span>
                      </div>
                      {field.detected ? (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="text-green-600 dark:text-green-400 font-medium" dir="ltr">&quot;{field.headerFound}&quot;</span>
                          {field.sample && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="truncate" dir="ltr">{field.sample}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {field.required ? t("apt.import_field_not_found" as any) : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Services and staff reference (collapsible) */}
              <details className="group rounded-lg border bg-muted/20">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground select-none">
                  {t("apt.import_svc_staff_tip" as any)}
                  <ChevronDown className="size-3.5 ms-auto transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid grid-cols-2 gap-3 px-4 pb-3">
                  <div>
                    <p className="text-xs font-medium mb-1">{t("apt.import_available_services" as any)}</p>
                    <div className="flex flex-wrap gap-1">
                      {services.map((s) => (
                        <span key={s.id} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s.name}</span>
                      ))}
                      {services.length === 0 && <span className="text-xs italic text-muted-foreground">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">{t("apt.import_available_staff" as any)}</p>
                    <div className="flex flex-wrap gap-1">
                      {staff.map((s) => (
                        <span key={s.id} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s.name}</span>
                      ))}
                      {staff.length === 0 && <span className="text-xs italic text-muted-foreground">—</span>}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* ─── Step 2: Preview data ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border bg-green-50/50 p-4 text-center dark:bg-green-950/20">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400 tabular-nums">{validCount}</p>
                  <p className="mt-0.5 text-xs font-medium text-green-600 dark:text-green-500">{t("apt.import_valid" as any)}</p>
                </div>
                {invalidCount > 0 && (
                  <div className="flex-1 rounded-xl border bg-amber-50/50 p-4 text-center dark:bg-amber-950/20">
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{invalidCount}</p>
                    <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-500">{t("apt.import_invalid" as any)}</p>
                  </div>
                )}
              </div>

              {/* Toggle errors */}
              {invalidCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowErrors(!showErrors)}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400"
                >
                  <AlertCircle className="size-3.5" />
                  {showErrors ? t("apt.import_hide_errors" as any) : t("apt.import_show_errors" as any)}
                </button>
              )}

              {/* Preview table */}
              <div className="max-h-[280px] overflow-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-muted/60 backdrop-blur-sm">
                      <th className="px-2.5 py-2 text-start font-medium w-8">#</th>
                      <th className="px-2.5 py-2 text-start font-medium">{t("apt.import_col_customer_name" as any)}</th>
                      <th className="px-2.5 py-2 text-start font-medium hidden sm:table-cell">{t("apt.import_col_customer_phone" as any)}</th>
                      <th className="px-2.5 py-2 text-start font-medium">{t("apt.import_col_service" as any)}</th>
                      <th className="px-2.5 py-2 text-start font-medium hidden sm:table-cell">{t("apt.import_col_staff" as any)}</th>
                      <th className="px-2.5 py-2 text-start font-medium">{t("apt.import_col_date" as any)}</th>
                      <th className="px-2.5 py-2 text-start font-medium">{t("apt.import_col_time" as any)}</th>
                      <th className="px-2.5 py-2 w-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, i) => {
                      const rowIdx = parsedRows.indexOf(row);
                      return (
                        <tr
                          key={rowIdx}
                          className={`border-b last:border-0 transition-colors ${
                            !row.valid
                              ? "bg-red-50/40 dark:bg-red-950/10"
                              : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="px-2.5 py-2 text-muted-foreground tabular-nums">{rowIdx + 1}</td>
                          <td className="px-2.5 py-2">
                            <span className="truncate block max-w-[100px]">{row.customerName || "—"}</span>
                          </td>
                          <td className="px-2.5 py-2 hidden sm:table-cell" dir="ltr">
                            <span className="truncate block max-w-[90px]">{row.customerPhone || "—"}</span>
                          </td>
                          <td className={`px-2.5 py-2 ${row.errorKey === "apt.import_row_error_service" ? "text-red-600 font-medium" : ""}`}>
                            <span className="truncate block max-w-[80px]">{row.serviceName || "—"}</span>
                          </td>
                          <td className={`px-2.5 py-2 hidden sm:table-cell ${row.errorKey === "apt.import_row_error_staff" ? "text-red-600 font-medium" : ""}`}>
                            <span className="truncate block max-w-[80px]">{row.staffName || "—"}</span>
                          </td>
                          <td className="px-2.5 py-2" dir="ltr">{row.date || "—"}</td>
                          <td className="px-2.5 py-2" dir="ltr">{row.time || "—"}</td>
                          <td className="px-2.5 py-2">
                            {row.valid ? (
                              <CheckCircle2 className="size-3.5 text-green-500" />
                            ) : (
                              <span title={t(row.errorKey as any)}>
                                <AlertCircle className="size-3.5 text-red-500" />
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-xs text-center text-muted-foreground">
                  {t("apt.import_showing_preview" as any, { shown: 50, total: parsedRows.length })}
                </p>
              )}

              {invalidCount > 0 && (
                <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-3 dark:border-amber-900 dark:bg-amber-950/15">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {t("apt.import_invalid_note" as any, { n: invalidCount })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Importing / Done ─── */}
          {step === 3 && !result && progress && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold">{t("apt.import_in_progress" as any)}</p>
                <p className="text-sm text-muted-foreground">
                  {t("apt.import_progress_text" as any, { done: progress.done, total: progress.total })}
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-center text-sm font-semibold tabular-nums text-primary">{progressPct}%</p>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="relative">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="size-10 text-green-600" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xl font-bold">{t("apt.import_done_title" as any)}</p>
                <p className="text-sm text-muted-foreground">{t("apt.import_done_desc" as any)}</p>
              </div>
              <div className="flex gap-4">
                <div className="rounded-xl border bg-green-50/50 px-8 py-4 text-center dark:bg-green-950/20">
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400 tabular-nums">{result.imported}</p>
                  <p className="mt-0.5 text-xs font-medium text-green-600 dark:text-green-500">{t("apt.import_imported" as any)}</p>
                </div>
                {result.skipped > 0 && (
                  <div className="rounded-xl border bg-amber-50/50 px-8 py-4 text-center dark:bg-amber-950/20">
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">{result.skipped}</p>
                    <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-500">{t("apt.import_skipped" as any)}</p>
                  </div>
                )}
              </div>
              {result.skipped > 0 && (
                <p className="text-xs text-center text-muted-foreground max-w-sm">{t("apt.import_skipped_note" as any)}</p>
              )}
              {result.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{result.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t px-6 py-4 bg-background">
          {step === 0 && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { onOpenChange(false); reset(); }}>
                {t("common.cancel")}
              </Button>
              <Button className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                <Upload className="size-4 me-1.5" />
                {t("apt.import_choose_file" as any)}
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { reset(); }}>
                {t("apt.import_change_file" as any)}
              </Button>
              <Button className="flex-1" onClick={() => setStep(2)} disabled={missingRequired > 0}>
                {locale === "he" ? "המשך לתצוגה מקדימה" : "Continue to Preview"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t("apt.import_back" as any)}
              </Button>
              <Button className="flex-1" onClick={startImport} disabled={validCount === 0}>
                <Upload className="size-4 me-1.5" />
                {t("apt.import_start" as any, { n: validCount })}
              </Button>
            </div>
          )}

          {step === 3 && result && (
            <Button className="w-full" onClick={() => { onOpenChange(false); reset(); }}>
              {t("apt.import_finish" as any)}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
