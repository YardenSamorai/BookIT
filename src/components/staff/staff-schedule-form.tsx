"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateStaffSchedule } from "@/actions/staff";
import { DAYS_KEYS } from "@/lib/i18n";
import type { InferSelectModel } from "drizzle-orm";
import type { staffSchedules } from "@/lib/db/schema";
import { Loader2, Save } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type ScheduleRow = InferSelectModel<typeof staffSchedules>;

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface StaffScheduleFormProps {
  staffId: string;
  schedule: ScheduleRow[];
}

function toEntries(rows: ScheduleRow[]): ScheduleEntry[] {
  return Array.from({ length: 7 }, (_, i) => {
    const row = rows.find((r) => r.dayOfWeek === i);
    return {
      dayOfWeek: i,
      startTime: row?.startTime ?? "09:00",
      endTime: row?.endTime ?? "18:00",
      isActive: row?.isActive ?? false,
    };
  });
}

export function StaffScheduleForm({ staffId, schedule }: StaffScheduleFormProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [entries, setEntries] = useState<ScheduleEntry[]>(() => toEntries(schedule));

  function updateEntry(day: number, patch: Partial<ScheduleEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.dayOfWeek === day ? { ...e, ...patch } : e))
    );
    setSuccess(false);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await updateStaffSchedule(staffId, entries);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("staff.working_hours")}</CardTitle>
        <CardDescription>{t("staff.working_hours_desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.dayOfWeek} className="flex items-center gap-4 rounded-lg border p-3">
            <div className="flex w-28 items-center gap-3">
              <Switch
                checked={entry.isActive}
                onCheckedChange={(checked) =>
                  updateEntry(entry.dayOfWeek, { isActive: !!checked })
                }
                disabled={loading}
              />
              <Label className="text-sm font-medium">
                {t(DAYS_KEYS[entry.dayOfWeek])}
              </Label>
            </div>

            {entry.isActive ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => updateEntry(entry.dayOfWeek, { startTime: e.target.value })}
                  className="w-32"
                  disabled={loading}
                />
                <span className="text-sm text-muted-foreground">{t("common.to")}</span>
                <Input
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => updateEntry(entry.dayOfWeek, { endTime: e.target.value })}
                  className="w-32"
                  disabled={loading}
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">{t("staff.day_off")}</span>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{t("staff.schedule_saved")}</p>}

        <Button onClick={handleSave} disabled={loading} className="mt-4">
          {loading ? (
            <Loader2 className="me-2 size-4 animate-spin" />
          ) : (
            <Save className="me-2 size-4" />
          )}
          {t("staff.save_schedule")}
        </Button>
      </CardContent>
    </Card>
  );
}
