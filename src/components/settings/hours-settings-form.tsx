"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateBusinessHours } from "@/actions/business";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { DAYS_SHORT_KEYS } from "@/lib/i18n";
import type { InferSelectModel } from "drizzle-orm";
import type { businessHours } from "@/lib/db/schema";
import { Loader2, Save } from "lucide-react";

type BusinessHoursRow = InferSelectModel<typeof businessHours>;

interface HoursEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

interface HoursSettingsFormProps {
  hours: BusinessHoursRow[];
}

function normalizeTime(t: string | undefined, fallback: string) {
  if (!t) return fallback;
  return t.slice(0, 5);
}

function toEntries(rows: BusinessHoursRow[]): HoursEntry[] {
  return Array.from({ length: 7 }, (_, i) => {
    const row = rows.find((r) => r.dayOfWeek === i);
    return {
      dayOfWeek: i,
      startTime: normalizeTime(row?.startTime, "09:00"),
      endTime: normalizeTime(row?.endTime, "18:00"),
      isOpen: row?.isOpen ?? false,
    };
  });
}

export function HoursSettingsForm({ hours }: HoursSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [entries, setEntries] = useState<HoursEntry[]>(() => toEntries(hours));
  const t = useT();

  function updateEntry(dayOfWeek: number, patch: Partial<HoursEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.dayOfWeek === dayOfWeek ? { ...e, ...patch } : e))
    );
    setSuccess(false);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const invalid = entries.find((e) => e.isOpen && e.startTime >= e.endTime);
    if (invalid) {
      const dayLabel = t(DAYS_SHORT_KEYS[invalid.dayOfWeek]);
      setError(t("settings.error_end_before_start").replace("{day}", dayLabel));
      setLoading(false);
      return;
    }

    const result = await updateBusinessHours(entries);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.hours_title")}</CardTitle>
          <CardDescription>{t("settings.hours_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.map((entry) => (
            <DayRow
              key={entry.dayOfWeek}
              entry={entry}
              onChange={(patch) => updateEntry(entry.dayOfWeek, patch)}
              disabled={loading}
              t={t}
            />
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600">{t("settings.hours_saved")}</p>
      )}

      <Button onClick={handleSave} disabled={loading}>
        {loading ? (
          <Loader2 className="me-2 size-4 animate-spin" />
        ) : (
          <Save className="me-2 size-4" />
        )}
        {t("settings.save_hours")}
      </Button>
    </div>
  );
}

function DayRow({
  entry,
  onChange,
  disabled,
  t,
}: {
  entry: HoursEntry;
  onChange: (patch: Partial<HoursEntry>) => void;
  disabled: boolean;
  t: (key: any) => string;
}) {
  const dayKey = DAYS_SHORT_KEYS[entry.dayOfWeek];
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="flex w-28 items-center gap-3">
        <Switch
          checked={entry.isOpen}
          onCheckedChange={(checked) => onChange({ isOpen: !!checked })}
          disabled={disabled}
        />
        <Label className="text-sm font-medium">
          {t(dayKey)}
        </Label>
      </div>

      {entry.isOpen ? (
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={entry.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            className="w-32"
            disabled={disabled}
          />
          <span className="text-sm text-muted-foreground">{t("settings.to")}</span>
          <Input
            type="time"
            value={entry.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            className="w-32"
            disabled={disabled}
          />
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{t("settings.closed")}</span>
      )}
    </div>
  );
}
