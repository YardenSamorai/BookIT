"use client";

import { useState, useTransition, useMemo, useCallback, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Repeat, Users, Clock, CalendarDays, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { deleteClassSchedule, permanentDeleteClassSchedule } from "@/actions/classes";
import { CreateClassForm } from "./create-class-form";
import { EditClassForm } from "./edit-class-form";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { DAYS_SHORT_KEYS, t as tFn } from "@/lib/i18n";

type Service = {
  id: string;
  title: string;
  isGroup: boolean;
  durationMinutes: number;
  autoManaged: boolean;
  maxParticipants: number | null;
  paymentMode: string;
  approvalType: string;
  price: string | null;
  depositAmount: string | null;
  cancelHoursBefore: number | null;
  rescheduleHoursBefore: number | null;
};
type Staff = { id: string; name: string };

type Schedule = {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  title: string | null;
  daysOfWeek: number[];
  startTime: string;
  durationMinutes: number;
  maxParticipants: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean | null;
  notes: string | null;
  calendarColor?: string | null;
  price: string | null;
  paymentMode: string;
  approvalType: string;
  depositAmount: string | null;
  cancelHoursBefore: number | null;
  rescheduleHoursBefore: number | null;
  serviceName: string;
  staffName: string;
  serviceDuration: number;
};

interface Props {
  businessId: string;
  schedules: Schedule[];
  services: Service[];
  staff: Staff[];
}

function isScheduleActive(s: Schedule): boolean {
  return s.isActive !== false;
}

function sortSchedulesInGroup(items: Schedule[]): Schedule[] {
  return [...items].sort((a, b) => {
    const timeCmp = a.startTime.localeCompare(b.startTime);
    if (timeCmp !== 0) return timeCmp;
    const da = [...(a.daysOfWeek as number[])].sort((x, y) => x - y).join(",");
    const db = [...(b.daysOfWeek as number[])].sort((x, y) => x - y).join(",");
    return da.localeCompare(db);
  });
}

/** Groups by `serviceId`; sorts groups by `serviceName` and rows by time + days. */
function groupSchedulesByService(
  list: Schedule[],
  locale: string
): { serviceId: string; serviceName: string; items: Schedule[] }[] {
  const map = new Map<string, Schedule[]>();
  for (const s of list) {
    const arr = map.get(s.serviceId) ?? [];
    arr.push(s);
    map.set(s.serviceId, arr);
  }
  const groups = [...map.entries()].map(([serviceId, items]) => ({
    serviceId,
    serviceName: items[0]!.serviceName,
    items: sortSchedulesInGroup(items),
  }));
  groups.sort((a, b) =>
    a.serviceName.localeCompare(b.serviceName, locale, { sensitivity: "base" })
  );
  return groups;
}

function toggleIdInSet(setter: Dispatch<SetStateAction<Set<string>>>, id: string) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export function ClassScheduleList({ businessId, schedules, services, staff }: Props) {
  const t = useT();
  const locale = useLocale();
  const [createOpen, setCreateOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [isPending, startTransition] = useTransition();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [filterService, setFilterService] = useState<string>("ALL");
  const [filterStaff, setFilterStaff] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedActiveServiceIds, setCollapsedActiveServiceIds] = useState<Set<string>>(
    () => new Set()
  );
  const [collapsedArchiveServiceIds, setCollapsedArchiveServiceIds] = useState<Set<string>>(
    () => new Set()
  );

  const groupServicesSorted = useMemo(() => {
    return [...services]
      .filter((s) => s.isGroup)
      .sort((a, b) => a.title.localeCompare(b.title, locale, { sensitivity: "base" }));
  }, [services, locale]);

  const classTypes = useMemo(() => {
    return services
      .filter((s) => s.isGroup && s.autoManaged)
      .sort((a, b) => a.title.localeCompare(b.title, locale, { sensitivity: "base" }));
  }, [services, locale]);

  const staffSorted = useMemo(() => {
    return [...staff].sort((a, b) =>
      a.name.localeCompare(b.name, locale, { sensitivity: "base" })
    );
  }, [staff, locale]);

  const filteredSchedules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return schedules.filter((s) => {
      if (filterStaff !== "ALL" && s.staffId !== filterStaff) return false;
      if (filterService !== "ALL" && s.serviceId !== filterService) return false;
      if (q) {
        const hay = [s.serviceName, s.staffName, s.title ?? "", s.startTime]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [schedules, filterStaff, filterService, searchQuery]);

  const { activeSchedules, inactiveSchedules } = useMemo(() => {
    const active: Schedule[] = [];
    const inactive: Schedule[] = [];
    for (const s of filteredSchedules) {
      if (isScheduleActive(s)) active.push(s);
      else inactive.push(s);
    }
    return { activeSchedules: active, inactiveSchedules: inactive };
  }, [filteredSchedules]);

  const activeGroups = useMemo(
    () => groupSchedulesByService(activeSchedules, locale),
    [activeSchedules, locale]
  );
  const inactiveGroups = useMemo(
    () => groupSchedulesByService(inactiveSchedules, locale),
    [inactiveSchedules, locale]
  );

  const hasActiveFilters =
    filterService !== "ALL" || filterStaff !== "ALL" || searchQuery.trim() !== "";

  const clearFilters = useCallback(() => {
    setFilterService("ALL");
    setFilterStaff("ALL");
    setSearchQuery("");
  }, []);

  function handleEdit(s: Schedule) {
    setEditSchedule(s);
    setFormOpen(true);
  }

  function handleAdd() {
    setCreateOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm(t("cls.confirm_delete"))) return;
    startTransition(async () => {
      await deleteClassSchedule(id, businessId);
    });
  }

  function handlePermanentDelete(id: string) {
    if (!confirm(t("cls.confirm_permanent_delete"))) return;
    startTransition(async () => {
      await permanentDeleteClassSchedule(id, businessId);
    });
  }

  function formatDays(days: number[]) {
    return days
      .sort()
      .map((d) => tFn(locale, DAYS_SHORT_KEYS[d] as any))
      .join(", ");
  }

  const createForm = (
    <CreateClassForm
      open={createOpen}
      onOpenChange={setCreateOpen}
      businessId={businessId}
      staff={staff}
      classTypes={classTypes}
    />
  );

  const editForm = editSchedule ? (
    <EditClassForm
      open={formOpen}
      onOpenChange={setFormOpen}
      businessId={businessId}
      staff={staff}
      schedule={editSchedule}
    />
  ) : null;

  if (schedules.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={handleAdd}>
            <Plus className="me-1 size-4" />
            {t("cls.add")}
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Repeat className="size-10 text-muted-foreground" />
            <h3 className="text-lg font-medium">{t("cls.no_classes")}</h3>
            <p className="text-sm text-muted-foreground">{t("cls.no_classes_desc")}</p>
            <Button onClick={handleAdd} className="mt-2">
              <Plus className="me-1 size-4" />
              {t("cls.add")}
            </Button>
          </CardContent>
        </Card>

        {createForm}
        {editForm}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-h-8">
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              {t("cls.filter_clear")}
            </Button>
          ) : null}
        </div>
        <Button onClick={handleAdd} size="sm" className="h-8 text-xs sm:h-9 sm:text-sm">
          <Plus className="me-1 size-3.5" />
          {t("cls.add")}
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/30 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("cls.filter_service")}</Label>
            <Select value={filterService} onValueChange={(v) => setFilterService(v ?? "ALL")}>
              <SelectTrigger className="h-9 w-full bg-background">
                <span className="truncate">
                  {filterService === "ALL"
                    ? t("cls.filter_all")
                    : groupServicesSorted.find((x) => x.id === filterService)?.title ??
                      t("cls.filter_all")}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("cls.filter_all")}</SelectItem>
                {groupServicesSorted.map((svc) => (
                  <SelectItem key={svc.id} value={svc.id}>
                    {svc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("cls.filter_instructor")}</Label>
            <Select value={filterStaff} onValueChange={(v) => setFilterStaff(v ?? "ALL")}>
              <SelectTrigger className="h-9 w-full bg-background">
                <span className="truncate">
                  {filterStaff === "ALL"
                    ? t("cls.filter_all")
                    : staffSorted.find((x) => x.id === filterStaff)?.name ?? t("cls.filter_all")}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("cls.filter_all")}</SelectItem>
                {staffSorted.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label className="text-xs text-muted-foreground">{t("cls.filter_search")}</Label>
            <Input
              className="h-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("cls.filter_search_placeholder")}
            />
          </div>
        </div>
      </div>

      {filteredSchedules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("cls.filter_no_results")}
          </CardContent>
        </Card>
      ) : activeSchedules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("cls.no_active_workouts")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeGroups.map((g) => {
            const collapsed = collapsedActiveServiceIds.has(g.serviceId);
            return (
              <div key={g.serviceId} className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex h-auto min-h-10 w-full flex-wrap items-center justify-between gap-2 py-2 text-start"
                  onClick={() => toggleIdInSet(setCollapsedActiveServiceIds, g.serviceId)}
                  aria-expanded={!collapsed}
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Dumbbell className="size-4 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 truncate font-semibold">{g.serviceName}</span>
                    <Badge variant="secondary" className="font-normal">
                      {g.items.length}
                    </Badge>
                  </span>
                  {collapsed ? (
                    <ChevronDown className="size-4 shrink-0 opacity-70" />
                  ) : (
                    <ChevronUp className="size-4 shrink-0 opacity-70" />
                  )}
                </Button>
                {!collapsed && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((s) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={s}
                        formatDays={formatDays}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isPending={isPending}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archive: inactive schedules, collapsible */}
      {inactiveSchedules.length > 0 && (
        <div className="space-y-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex h-auto min-h-10 w-full flex-wrap items-center justify-between gap-2 py-2 text-start sm:w-full sm:max-w-md"
            onClick={() => setArchiveOpen((o) => !o)}
            title={archiveOpen ? t("cls.archive_hide") : t("cls.archive_show", { n: inactiveSchedules.length })}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{t("cls.archive")}</span>
              <Badge variant="secondary" className="font-normal">
                {inactiveSchedules.length}
              </Badge>
              <span className="text-xs font-normal text-muted-foreground">
                {archiveOpen ? t("cls.archive_hide") : t("cls.archive_show", { n: inactiveSchedules.length })}
              </span>
            </span>
            {archiveOpen ? (
              <ChevronUp className="size-4 shrink-0 opacity-70" />
            ) : (
              <ChevronDown className="size-4 shrink-0 opacity-70" />
            )}
          </Button>

          {archiveOpen && (
            <div className="space-y-3 pt-1">
              {inactiveGroups.map((g) => {
                const collapsed = collapsedArchiveServiceIds.has(g.serviceId);
                return (
                  <div key={g.serviceId} className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex h-auto min-h-10 w-full flex-wrap items-center justify-between gap-2 border-border/60 py-2 text-start bg-muted/20"
                      onClick={() => toggleIdInSet(setCollapsedArchiveServiceIds, g.serviceId)}
                      aria-expanded={!collapsed}
                    >
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80">
                          <Dumbbell className="size-4 text-muted-foreground" />
                        </span>
                        <span className="min-w-0 truncate font-semibold">{g.serviceName}</span>
                        <Badge variant="secondary" className="font-normal">
                          {g.items.length}
                        </Badge>
                      </span>
                      {collapsed ? (
                        <ChevronDown className="size-4 shrink-0 opacity-70" />
                      ) : (
                        <ChevronUp className="size-4 shrink-0 opacity-70" />
                      )}
                    </Button>
                    {!collapsed && (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {g.items.map((s) => (
                          <ScheduleCard
                            key={s.id}
                            schedule={s}
                            formatDays={formatDays}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onPermanentDelete={handlePermanentDelete}
                            isPending={isPending}
                            t={t}
                            inArchive
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {createForm}
      {editForm}
    </div>
  );
}

function ScheduleCard({
  schedule: s,
  formatDays,
  onEdit,
  onDelete,
  onPermanentDelete,
  isPending,
  t,
  inArchive = false,
}: {
  schedule: Schedule;
  formatDays: (days: number[]) => string;
  onEdit: (s: Schedule) => void;
  onDelete: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  isPending: boolean;
  t: (key: import("@/lib/i18n").TranslationKey, vars?: Record<string, string | number>) => string;
  inArchive?: boolean;
}) {
  return (
    <Card
      className={`overflow-hidden ${inArchive ? "border-muted bg-muted/20" : ""}`}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Dumbbell className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold sm:text-base">
              {s.title || s.serviceName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{s.staffName}</p>
          </div>
          <Badge variant={s.isActive ? "default" : "secondary"} className="shrink-0 text-[10px]">
            {s.isActive ? t("cls.active") : t("cls.inactive")}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs text-muted-foreground sm:px-4 sm:py-2.5 sm:text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3 shrink-0" />
            {formatDays(s.daysOfWeek as number[])}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3 shrink-0" />
            {s.startTime} · {s.durationMinutes}′
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3 shrink-0" />
            {s.maxParticipants}
          </span>
        </div>

        <div className="flex items-center gap-1.5 border-t px-3 py-2 sm:px-4">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(s)}>
            <Pencil className="me-1 size-3" />
            {t("cls.edit")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs"
            onClick={() => onDelete(s.id)}
            disabled={isPending}
          >
            <Trash2 className="me-1 size-3" />
            {t("cls.delete")}
          </Button>
          {inArchive && onPermanentDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ms-auto"
              onClick={() => onPermanentDelete(s.id)}
              disabled={isPending}
            >
              <Trash2 className="me-1 size-3" />
              {t("cls.permanent_delete")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
