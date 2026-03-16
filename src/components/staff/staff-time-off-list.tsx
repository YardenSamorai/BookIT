"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createStaffTimeOff, deleteStaffTimeOff } from "@/actions/staff";
import type { InferSelectModel } from "drizzle-orm";
import type { staffTimeOff } from "@/lib/db/schema";
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

type TimeOffRow = InferSelectModel<typeof staffTimeOff>;

interface StaffTimeOffListProps {
  staffId: string;
  timeOff: TimeOffRow[];
}

export function StaffTimeOffList({ staffId, timeOff }: StaffTimeOffListProps) {
  const router = useRouter();
  const t = useT();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  async function handleAdd() {
    setAdding(true);
    setError("");

    const result = await createStaffTimeOff(staffId, {
      startDate,
      endDate,
      reason,
    });

    if (!result.success) {
      setError(result.error);
      setAdding(false);
      return;
    }

    setAdding(false);
    setDialogOpen(false);
    setStartDate("");
    setEndDate("");
    setReason("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteStaffTimeOff(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{t("staff.time_off")}</CardTitle>
          <CardDescription>{t("staff.time_off_desc")}</CardDescription>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="me-2 size-4" />
          {t("common.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {timeOff.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CalendarOff className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("staff.no_time_off")}</p>
          </div>
        ) : (
          timeOff.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {entry.startDate} — {entry.endDate}
                </p>
                {entry.reason && (
                  <p className="text-xs text-muted-foreground">{entry.reason}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
              >
                {deletingId === entry.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 text-destructive" />
                )}
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("staff.add_time_off")}</DialogTitle>
            <DialogDescription>
              {t("staff.time_off_dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("staff.start_date")}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={adding}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("staff.end_date")}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={adding}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("staff.reason")}</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("staff.reason_ph")}
                disabled={adding}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              onClick={handleAdd}
              disabled={adding || !startDate || !endDate}
              className="w-full"
            >
              {adding && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("staff.add_time_off")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
