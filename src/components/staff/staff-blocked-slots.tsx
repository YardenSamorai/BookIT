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
import { createStaffBlockedSlot, deleteStaffBlockedSlot } from "@/actions/staff";
import type { InferSelectModel } from "drizzle-orm";
import type { staffBlockedSlots } from "@/lib/db/schema";
import { Lock, Loader2, Plus, Trash2 } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";

type BlockedSlotRow = InferSelectModel<typeof staffBlockedSlots>;

interface StaffBlockedSlotsProps {
  staffId: string;
  blockedSlots: BlockedSlotRow[];
}

export function StaffBlockedSlots({ staffId, blockedSlots }: StaffBlockedSlotsProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  function formatSlotDate(dt: Date) {
    return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
      dateStyle: "medium",
    }).format(new Date(dt));
  }

  function formatSlotTime(dt: Date) {
    return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
      timeStyle: "short",
    }).format(new Date(dt));
  }

  async function handleAdd() {
    setAdding(true);
    setError("");

    const result = await createStaffBlockedSlot(staffId, {
      startTime: `${date}T${startTime}`,
      endTime: `${date}T${endTime}`,
      reason,
    });

    if (!result.success) {
      setError(result.error);
      setAdding(false);
      return;
    }

    setAdding(false);
    setDialogOpen(false);
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteStaffBlockedSlot(id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{t("staff.blocked_slots")}</CardTitle>
          <CardDescription>{t("staff.blocked_slots_desc")}</CardDescription>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="me-2 size-4" />
          {t("common.add")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {blockedSlots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Lock className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("staff.no_blocked_slots")}</p>
          </div>
        ) : (
          blockedSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {formatSlotDate(slot.startTime)} · {formatSlotTime(slot.startTime)} — {formatSlotTime(slot.endTime)}
                </p>
                {slot.reason && (
                  <p className="text-xs text-muted-foreground">{slot.reason}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(slot.id)}
                disabled={deletingId === slot.id}
              >
                {deletingId === slot.id ? (
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
            <DialogTitle>{t("staff.add_blocked_slot")}</DialogTitle>
            <DialogDescription>
              {t("staff.blocked_slot_dialog_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("staff.slot_date")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={adding}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("staff.slot_start")}</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={adding}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("staff.slot_end")}</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
              disabled={adding || !date || !startTime || !endTime}
              className="w-full"
            >
              {adding && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("staff.add_blocked_slot")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
