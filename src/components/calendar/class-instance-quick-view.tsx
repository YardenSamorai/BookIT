"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
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
  UserMinus,
  UserPlus,
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
  cancelParticipantBooking,
  updateClassInstanceTime,
  updateAllFutureInstancesTime,
  getClassInstanceParticipants,
  searchBusinessCustomers,
  updateClassSchedule,
} from "@/actions/classes";
import { ClassCalendarColorPicker } from "@/components/classes/class-calendar-color-picker";
import { enrollCustomerInClass } from "@/actions/booking";
import type { ClassInstance } from "./calendar-types";
import { getHoursInTz, getMinutesInTz, wallClockToDate, BUSINESS_TZ } from "./calendar-types";

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
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone: string } | null>(null);
  const [calendarColor, setCalendarColor] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        `${String(getHoursInTz(start)).padStart(2, "0")}:${String(getMinutesInTz(start)).padStart(2, "0")}`
      );
      setEditEnd(
        `${String(getHoursInTz(end)).padStart(2, "0")}:${String(getMinutesInTz(end)).padStart(2, "0")}`
      );
      setIsEditing(false);
      setEditScope(null);
      setShowParticipants(false);
      setParticipants([]);
      setShowAddForm(false);
      setAddName("");
      setAddPhone("");
      setSearchQuery("");
      setSearchResults([]);
      setSelectedCustomer(null);
      setCalendarColor(instance.calendarColor ?? null);
      loadParticipants();
    }
  }, [open, instance, loadParticipants]);

  function handleCalendarColorChange(hex: string | null) {
    if (!instance) return;
    setCalendarColor(hex);
    startTransition(async () => {
      const res = await updateClassSchedule(instance.classScheduleId, businessId, {
        calendarColor: hex,
      });
      if (res.success) router.refresh();
    });
  }

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
  const booked = participants.length > 0 ? participants.length : (instance.bookedCount ?? 0);

  const dateStr = startDate.toLocaleDateString(dtLocale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: BUSINESS_TZ,
  });
  const timeStr = `${startDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TZ,
  })} - ${endDate.toLocaleTimeString(dtLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TZ,
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

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setSelectedCustomer(null);
    setAddName("");
    setAddPhone("");

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchBusinessCustomers(businessId, q.trim());
      setSearchResults(results);
      setSearchLoading(false);
    }, 250);
  }

  function handleSelectCustomer(c: { name: string; phone: string }) {
    setSelectedCustomer(c);
    setAddName(c.name);
    setAddPhone(c.phone);
    setSearchQuery(c.name);
    setSearchResults([]);
  }

  function resetAddForm() {
    setShowAddForm(false);
    setAddName("");
    setAddPhone("");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedCustomer(null);
  }

  function handleAddParticipant() {
    if (!addName.trim() || !addPhone.trim() || !instance) return;
    startTransition(async () => {
      const result = await enrollCustomerInClass({
        businessId,
        customerName: addName.trim(),
        customerPhone: addPhone.trim(),
        classInstanceId: instance.id,
      });
      if (result.success) {
        resetAddForm();
        await loadParticipants();
        router.refresh();
      }
    });
  }

  function handleRemoveParticipant(appointmentId: string) {
    startTransition(async () => {
      await cancelParticipantBooking(appointmentId, instance!.id, businessId);
      setParticipants((prev) => prev.filter((p) => p.id !== appointmentId));
      setRemovingParticipantId(null);
      router.refresh();
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
        const newStart = wallClockToDate(base, sh, sm);
        const newEnd = wallClockToDate(base, eh, em);

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

            {/* Calendar color (all sessions for this recurring workout) */}
            <div className="space-y-2 rounded-lg border bg-muted/15 p-3">
              <p className="text-xs font-medium text-foreground">{t("cls.calendar_color")}</p>
              <ClassCalendarColorPicker
                value={calendarColor}
                onChange={handleCalendarColorChange}
                disabled={isPending}
                hint={t("cls.calendar_color_hint")}
                defaultLabel={t("cls.calendar_color_default")}
              />
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
                      <div className="flex items-center gap-2">
                        {p.customerPhone && (
                          <a
                            href={`tel:${p.customerPhone}`}
                            className="text-xs text-muted-foreground hover:text-primary"
                            dir="ltr"
                          >
                            {p.customerPhone}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setRemovingParticipantId(p.id)}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                          title={t("cls.remove_participant" as never)}
                        >
                          <UserMinus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Add participant form */}
            {showAddForm && (
              <div className="space-y-3 rounded-lg border bg-background p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-sm font-medium">{t("cls.add_participant" as never)}</p>

                {/* Customer search */}
                <div className="relative">
                  <Input
                    placeholder={t("cls.search_customer" as never)}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-9"
                    autoFocus
                  />
                  {searchLoading && (
                    <div className="absolute end-2.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {/* Autocomplete dropdown */}
                  {searchResults.length > 0 && !selectedCustomer && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground" dir="ltr">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected customer preview */}
                {selectedCustomer && (
                  <div className="flex items-center justify-between rounded-md bg-primary/5 border border-primary/20 px-3 py-2 animate-in fade-in duration-150">
                    <div>
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{selectedCustomer.phone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setAddName("");
                        setAddPhone("");
                        setSearchQuery("");
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}

                {/* Manual entry fallback */}
                {!selectedCustomer && searchQuery.length > 0 && searchResults.length === 0 && !searchLoading && (
                  <div className="space-y-2 rounded-md border border-dashed p-3">
                    <p className="text-xs text-muted-foreground">{t("cls.customer_not_found" as never)}</p>
                    <Input
                      placeholder={t("cust.col_name" as never)}
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder={t("cust.phone" as never)}
                      value={addPhone}
                      onChange={(e) => setAddPhone(e.target.value)}
                      className="h-8 text-sm"
                      dir="ltr"
                      type="tel"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isPending || !addName.trim() || !addPhone.trim()}
                    onClick={handleAddParticipant}
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                    {t("cls.enroll_customer" as never)}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetAddForm}
                  >
                    {t("common.cancel" as never)}
                  </Button>
                </div>
              </div>
            )}

            {/* Manage participants + Add participant buttons */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="lg"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={() => setShowParticipants(!showParticipants)}
              >
                <Users className="size-4" />
                {showParticipants
                  ? t("cls.hide_participants" as never)
                  : t("cls.manage_participants" as never)}
              </Button>
              {booked < instance.maxParticipants && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowAddForm(!showAddForm)}
                  title={t("cls.add_participant" as never)}
                >
                  <UserPlus className="size-4" />
                </Button>
              )}
            </div>

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

      {/* Remove participant confirmation dialog */}
      <Dialog
        open={removingParticipantId !== null}
        onOpenChange={(o) => {
          if (!o) setRemovingParticipantId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("cls.confirm_remove_participant" as never)}
            </DialogTitle>
            <DialogDescription>
              {t("cls.confirm_remove_participant_desc" as never)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setRemovingParticipantId(null)}
            >
              {t("common.cancel" as never)}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (removingParticipantId) handleRemoveParticipant(removingParticipantId);
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
