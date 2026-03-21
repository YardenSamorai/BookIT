"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Trash2,
  Pencil,
  Users,
  Clock,
  Calendar,
  Scissors,
  Loader2,
  Check,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  cancelClassInstance,
  cancelAllFutureInstances,
  updateClassInstanceTime,
  updateAllFutureInstancesTime,
  getClassInstanceParticipants,
} from "@/actions/classes";
import type { ClassInstance } from "./calendar-types";

interface Props {
  instance: ClassInstance | null;
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ConfirmAction = "cancel_single" | "cancel_all" | null;
type EditScope = "single" | "all" | null;
type Participant = {
  id: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
};

export function ClassInstanceQuickView({
  instance,
  businessId,
  open,
  onOpenChange,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editScope, setEditScope] = useState<EditScope>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const dtLocale = locale === "he" ? "he-IL" : "en-US";

  const loadParticipants = useCallback(async () => {
    if (!instance) return;
    setLoadingParticipants(true);
    try {
      const data = await getClassInstanceParticipants(instance.id, businessId);
      setParticipants(data);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, [instance, businessId]);

  useEffect(() => {
    if (open && instance) {
      const start = new Date(instance.startTime);
      const end = new Date(instance.endTime);
      setEditStart(
        `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
      );
      setEditEnd(
        `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`
      );
      setIsEditing(false);
      setEditScope(null);
      setShowParticipants(false);
      setParticipants([]);
      loadParticipants();
    }
  }, [open, instance, loadParticipants]);

  const durationMin = instance
    ? Math.round(
        (new Date(instance.endTime).getTime() -
          new Date(instance.startTime).getTime()) /
          60_000
      )
    : 0;

  function handleStartChange(val: string) {
    setEditStart(val);
    const [h, m] = val.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const totalMin = h * 60 + m + durationMin;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    setEditEnd(
      `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
    );
  }

  if (!instance) return null;

  const startDate = new Date(instance.startTime);
  const endDate = new Date(instance.endTime);
  const booked = instance.bookedCount ?? 0;

  const dateStr = startDate.toLocaleDateString(dtLocale, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
  const timeStr = `${startDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  function handleCancelSingle() {
    startTransition(async () => {
      await cancelClassInstance(instance!.id, businessId);
      router.refresh();
      onOpenChange(false);
      setConfirmAction(null);
    });
  }

  function handleCancelAll() {
    startTransition(async () => {
      await cancelAllFutureInstances(instance!.classScheduleId, businessId);
      router.refresh();
      onOpenChange(false);
      setConfirmAction(null);
    });
  }

  function handlePencilClick() {
    if (isEditing) {
      setIsEditing(false);
      setEditScope(null);
    } else {
      setIsEditing(true);
      setEditScope(null);
    }
  }

  function handleSaveTime(scope: "single" | "all") {
    if (!instance) return;

    const [sh, sm] = editStart.split(":").map(Number);
    const [eh, em] = editEnd.split(":").map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return;
    if (eh * 60 + em <= sh * 60 + sm) return;

    startTransition(async () => {
      if (scope === "single") {
        const base = new Date(instance!.startTime);
        const newStart = new Date(base);
        newStart.setHours(sh, sm, 0, 0);
        const newEnd = new Date(base);
        newEnd.setHours(eh, em, 0, 0);

        await updateClassInstanceTime(
          instance!.id,
          businessId,
          newStart.toISOString(),
          newEnd.toISOString()
        );
      } else {
        await updateAllFutureInstancesTime(
          instance!.classScheduleId,
          businessId,
          editStart,
          editEnd
        );
      }
      router.refresh();
      setIsEditing(false);
      setEditScope(null);
      onOpenChange(false);
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden [&>.absolute]:hidden">
          {/* Hidden required elements for a11y */}
          <DialogHeader className="sr-only">
            <DialogTitle>{instance.serviceName}</DialogTitle>
            <DialogDescription>{t("cls.title" as never)}</DialogDescription>
          </DialogHeader>

          {/* Top toolbar */}
          <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 border-b">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmAction("cancel_single")}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={handlePencilClick}
              className={`rounded-lg p-2 transition-colors ${
                isEditing
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Pencil className="size-4" />
            </button>

            <div className="flex-1" />

            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
              ⟳ {t("cls.title" as never)}
            </span>
          </div>

          {/* Main content */}
          <div className="px-5 py-5 space-y-5">
            <h3 className="text-lg font-semibold">{instance.serviceName}</h3>

            {/* Date */}
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Calendar className="size-4 shrink-0" />
              <span>{dateStr}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              {isEditing ? (
                <div className="flex items-center gap-2" dir="ltr">
                  <Input
                    type="time"
                    value={editStart}
                    onChange={(e) => handleStartChange(e.target.value)}
                    className="h-8 w-28 text-sm px-2.5"
                  />
                  <span className="text-muted-foreground font-medium">–</span>
                  <Input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="h-8 w-28 text-sm px-2.5"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3"
                    disabled={isPending}
                    onClick={() => setEditScope("single")}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <span>{timeStr}</span>
              )}
            </div>

            {/* Staff */}
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Scissors className="size-4 shrink-0" />
              <span>{instance.staffName}</span>
            </div>

            {/* Registrations bar */}
            <div className="space-y-2.5 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Users className="size-4" />
                  {t("cls.registered" as never)}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {booked}/{instance.maxParticipants}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{
                    width: `${Math.min(100, (booked / instance.maxParticipants) * 100)}%`,
                  }}
                />
              </div>

              {/* Participants list */}
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-xs text-muted-foreground pt-1">
                  {t("cls.no_participants" as never)}
                </p>
              ) : showParticipants ? (
                <div className="space-y-1.5 pt-1">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {p.customerName || t("common.unknown" as never)}
                      </span>
                      {p.customerPhone && (
                        <a
                          href={`tel:${p.customerPhone}`}
                          className="text-xs text-muted-foreground hover:text-primary"
                          dir="ltr"
                        >
                          {p.customerPhone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Manage participants button */}
            <Button
              variant="default"
              size="lg"
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="size-4" />
              {showParticipants
                ? t("cls.hide_participants" as never)
                : t("cls.manage_participants" as never)}
            </Button>

            {/* Cancel all future */}
            <Button
              variant="ghost"
              className="w-full text-sm text-destructive hover:bg-destructive/5"
              onClick={() => setConfirmAction("cancel_all")}
            >
              {t("cls.cancel_all_future" as never)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit scope choice dialog */}
      <Dialog
        open={editScope !== null}
        onOpenChange={(o) => {
          if (!o) setEditScope(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cls.edit_scope_title" as never)}</DialogTitle>
            <DialogDescription>
              {t("cls.edit_scope_desc" as never)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              disabled={isPending}
              onClick={() => handleSaveTime("single")}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("cls.edit_only_this" as never)}
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleSaveTime("all")}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("cls.edit_all_future" as never)}
            </Button>
            <Button
              variant="ghost"
              disabled={isPending}
              onClick={() => setEditScope(null)}
            >
              {t("common.cancel" as never)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "cancel_single"
                ? t("cls.confirm_cancel_single" as never)
                : t("cls.confirm_cancel_all" as never)}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "cancel_single"
                ? t("cls.confirm_cancel_single_desc" as never)
                : t("cls.confirm_cancel_all_desc" as never)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirmAction(null)}
            >
              {t("common.cancel" as never)}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (confirmAction === "cancel_single") handleCancelSingle();
                else handleCancelAll();
              }}
            >
              {isPending
                ? t("common.loading" as never)
                : t("common.confirm" as never)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
