"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Repeat, Users, Clock, CalendarDays } from "lucide-react";
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
        <Button onClick={handleAdd}>
          <Plus className="me-1 size-4" />
          {t("cls.add")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((s) => (
          <Card key={s.id} className={!s.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">
                    {s.title || s.serviceName}
                  </CardTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.staffName}</p>
                </div>
                <Badge variant={s.isActive ? "default" : "secondary"}>
                  {s.isActive ? t("cls.active") : t("cls.inactive")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="size-3.5 shrink-0" />
                <span>{formatDays(s.daysOfWeek as number[])}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                <span>{s.startTime} ({s.serviceDuration} min)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-3.5 shrink-0" />
                <span>{t("cls.max_participants")}: {s.maxParticipants}</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(s)}>
                  <Pencil className="me-1 size-3" />
                  {t("cls.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
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
