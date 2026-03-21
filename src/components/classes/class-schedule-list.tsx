"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Repeat, Users, Clock, CalendarDays, Dumbbell } from "lucide-react";
import { deleteClassSchedule } from "@/actions/classes";
import { ClassScheduleForm } from "./class-schedule-form";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { DAYS_SHORT_KEYS, t as tFn, getDir } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

type Service = { id: string; title: string; isGroup: boolean; durationMinutes: number };
type Staff = { id: string; name: string };

type Schedule = {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  title: string | null;
  daysOfWeek: number[];
  startTime: string;
  maxParticipants: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  isActive: boolean | null;
  notes: string | null;
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

export function ClassScheduleList({ businessId, schedules, services, staff }: Props) {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const [formOpen, setFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit(s: Schedule) {
    setEditSchedule(s);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditSchedule(null);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm(t("cls.confirm_delete"))) return;
    startTransition(async () => {
      await deleteClassSchedule(id, businessId);
    });
  }

  function formatDays(days: number[]) {
    return days
      .sort()
      .map((d) => tFn(locale, DAYS_SHORT_KEYS[d] as any))
      .join(", ");
  }

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

        <ClassScheduleForm
          open={formOpen}
          onOpenChange={setFormOpen}
          businessId={businessId}
          services={services}
          staff={staff}
          schedule={editSchedule}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={handleAdd} size="sm" className="h-8 text-xs sm:h-9 sm:text-sm">
          <Plus className="me-1 size-3.5" />
          {t("cls.add")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((s) => (
          <Card key={s.id} className={`overflow-hidden ${!s.isActive ? "opacity-60" : ""}`}>
            <CardContent className="p-0">
              {/* Header row */}
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

              {/* Details */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs text-muted-foreground sm:px-4 sm:py-2.5 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3 shrink-0" />
                  {formatDays(s.daysOfWeek as number[])}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3 shrink-0" />
                  {s.startTime} · {s.serviceDuration}′
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3 shrink-0" />
                  {s.maxParticipants}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 border-t px-3 py-2 sm:px-4">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEdit(s)}>
                  <Pencil className="me-1 size-3" />
                  {t("cls.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => handleDelete(s.id)}
                  disabled={isPending}
                >
                  <Trash2 className="me-1 size-3" />
                  {t("cls.delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ClassScheduleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        businessId={businessId}
        services={services}
        staff={staff}
        schedule={editSchedule}
      />
    </div>
  );
}
