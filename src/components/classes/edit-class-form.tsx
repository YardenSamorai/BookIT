"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClassCalendarColorPicker } from "./class-calendar-color-picker";
import { updateClassSchedule } from "@/actions/classes";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { getDir, DAYS_SHORT_KEYS, t as tFn } from "@/lib/i18n";
import {
  Dumbbell,
  Loader2,
  Check,
  Users,
  Clock,
  Repeat,
  CreditCard,
  ChevronDown,
} from "lucide-react";

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
  serviceDescription: string | null;
  staffName: string;
  serviceDuration: number;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  staff: Staff[];
  schedule: Schedule;
}

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

const PAYMENT_MODES = [
  { value: "FREE", labelEn: "Free", labelHe: "חינם" },
  { value: "FULL", labelEn: "Full Payment", labelHe: "תשלום מלא" },
  { value: "DEPOSIT", labelEn: "Deposit", labelHe: "מקדמה" },
  { value: "ON_SITE", labelEn: "Pay On Site", labelHe: "תשלום במקום" },
  { value: "CONTACT_FOR_PRICE", labelEn: "Contact for Price", labelHe: "צרו קשר למחיר" },
] as const;

type PaymentMode = "FREE" | "FULL" | "DEPOSIT" | "ON_SITE" | "CONTACT_FOR_PRICE";

export function EditClassForm({ open, onOpenChange, businessId, staff, schedule }: Props) {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [staffId, setStaffId] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(12);
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [calendarColor, setCalendarColor] = useState<string | null>(null);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("FREE");
  const [price, setPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [approvalType, setApprovalType] = useState<"AUTO" | "MANUAL">("AUTO");
  const [cancelHoursBefore, setCancelHoursBefore] = useState("");
  const [rescheduleHoursBefore, setRescheduleHoursBefore] = useState("");

  const [showPricing, setShowPricing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && schedule) {
      setName(schedule.title || schedule.serviceName);
      setDescription(schedule.serviceDescription ?? "");
      setStaffId(schedule.staffId);
      setDaysOfWeek([...(schedule.daysOfWeek as number[])]);
      setStartTime(schedule.startTime);
      setDurationMinutes(schedule.durationMinutes);
      setMaxParticipants(schedule.maxParticipants);
      setEffectiveUntil(schedule.effectiveUntil ?? "");
      setNotes(schedule.notes ?? "");
      setCalendarColor(schedule.calendarColor ?? null);
      setPaymentMode((schedule.paymentMode as PaymentMode) || "FREE");
      setPrice(schedule.price ?? "");
      setDepositAmount(schedule.depositAmount ?? "");
      setApprovalType((schedule.approvalType as "AUTO" | "MANUAL") || "AUTO");
      setCancelHoursBefore(schedule.cancelHoursBefore != null ? String(schedule.cancelHoursBefore) : "");
      setRescheduleHoursBefore(schedule.rescheduleHoursBefore != null ? String(schedule.rescheduleHoursBefore) : "");
      setShowPricing(schedule.paymentMode !== "FREE");
      setError("");
      setSuccess(false);
    }
  }, [open, schedule?.id]);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function handleSubmit() {
    if (!name.trim()) { setError(t("cls.class_name")); return; }
    if (!staffId) { setError(t("cls.instructor")); return; }
    if (daysOfWeek.length === 0) { setError(t("cls.select_days")); return; }

    setError("");
    startTransition(async () => {
      const res = await updateClassSchedule(schedule.id, businessId, {
        title: name.trim(),
        description: description.trim() || null,
        staffId,
        daysOfWeek,
        startTime,
        durationMinutes,
        maxParticipants,
        effectiveUntil: effectiveUntil || null,
        notes: notes || undefined,
        calendarColor,
        price: price || null,
        depositAmount: depositAmount || null,
        paymentMode: paymentMode,
        approvalType,
        cancelHoursBefore: cancelHoursBefore ? Number(cancelHoursBefore) : null,
        rescheduleHoursBefore: rescheduleHoursBefore ? Number(rescheduleHoursBefore) : null,
      });
      if (!res.success) { setError(res.error); return; }
      setSuccess(true);
      setTimeout(() => onOpenChange(false), 1200);
    });
  }

  const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const endTimeStr = (() => {
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + (m || 0) + durationMinutes;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="size-5" />
            {t("cls.edit_class")}
          </DialogTitle>
          <DialogDescription>{name || schedule.serviceName}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 animate-in fade-in">
            <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-3">
              <Check className="size-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold">{t("cls.class_updated")}</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* ─── Section 1: Identity ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Dumbbell className="size-3.5" />
                {t("cls.section_identity")}
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("cls.class_name")}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("cls.class_name_placeholder")}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("cls.description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("cls.description_placeholder")}
                  disabled={isPending}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("cls.instructor")}</Label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className={selectCls}
                  disabled={isPending}
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("cls.calendar_color")}</Label>
                <ClassCalendarColorPicker
                  value={calendarColor}
                  onChange={setCalendarColor}
                  disabled={isPending}
                  hint={t("cls.calendar_color_hint")}
                  defaultLabel={t("cls.calendar_color_default")}
                />
              </div>
            </section>

            {/* ─── Section 2: Schedule ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Repeat className="size-3.5" />
                {t("cls.section_schedule")}
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("cls.days")}</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_INDICES.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      disabled={isPending}
                      className={`flex size-9 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        daysOfWeek.includes(day)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {tFn(locale, DAYS_SHORT_KEYS[day] as any)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t("cls.start_time")}</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t("cls.duration")}</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={5}
                      max={480}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-20"
                      disabled={isPending}
                    />
                    <span className="text-xs text-muted-foreground">{t("cls.duration_min")}</span>
                  </div>
                </div>
              </div>

              {startTime && (
                <p className="text-xs text-muted-foreground">
                  <Clock className="size-3 inline me-1" />
                  {startTime} – {endTimeStr} ({durationMinutes} {t("cls.duration_min")})
                </p>
              )}

              <div className="space-y-1">
                <Label className="text-[11px] font-medium">{t("cls.effective_until")}</Label>
                <Input
                  type="date"
                  value={effectiveUntil}
                  onChange={(e) => setEffectiveUntil(e.target.value)}
                  className="text-xs"
                  disabled={isPending}
                />
              </div>
            </section>

            {/* ─── Section 3: Capacity ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                <Users className="size-3.5" />
                {t("cls.section_capacity")}
              </h3>

              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground shrink-0" />
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-24"
                  disabled={isPending}
                />
                <span className="text-xs text-muted-foreground">{t("cls.max_participants")}</span>
              </div>
            </section>

            {/* ─── Section 4: Pricing & Settings (collapsible) ─── */}
            <section className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPricing(!showPricing)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <CreditCard className="size-3.5" />
                {t("cls.section_pricing")}
                <ChevronDown className={`size-3.5 ms-auto transition-transform ${showPricing ? "rotate-180" : ""}`} />
              </button>

              {showPricing && (
                <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("cls.payment_mode")}</Label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                      className={selectCls}
                      disabled={isPending}
                    >
                      {PAYMENT_MODES.map((pm) => (
                        <option key={pm.value} value={pm.value}>
                          {locale === "he" ? pm.labelHe : pm.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(paymentMode === "FULL" || paymentMode === "DEPOSIT" || paymentMode === "ON_SITE") && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("cls.price_label")}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        disabled={isPending}
                      />
                    </div>
                  )}

                  {paymentMode === "DEPOSIT" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t("cls.deposit_label")}</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={isPending}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t("cls.approval_type")}</Label>
                    <select
                      value={approvalType}
                      onChange={(e) => setApprovalType(e.target.value as "AUTO" | "MANUAL")}
                      className={selectCls}
                      disabled={isPending}
                    >
                      <option value="AUTO">{t("cls.approval_auto")}</option>
                      <option value="MANUAL">{t("cls.approval_manual")}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">{t("cls.cancel_policy")}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={cancelHoursBefore}
                        onChange={(e) => setCancelHoursBefore(e.target.value)}
                        placeholder="—"
                        className="text-xs"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium">{t("cls.reschedule_policy")}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={rescheduleHoursBefore}
                        onChange={(e) => setRescheduleHoursBefore(e.target.value)}
                        placeholder="—"
                        className="text-xs"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ─── Notes ─── */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t("cls.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
                disabled={isPending}
              />
            </div>

            {/* ─── Summary preview ─── */}
            {name.trim() && daysOfWeek.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-sm font-semibold">{name.trim()}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Repeat className="size-3 shrink-0" />
                  {daysOfWeek.map((d) => tFn(locale, DAYS_SHORT_KEYS[d] as any)).join(", ")}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3 shrink-0" />
                  {startTime} – {endTimeStr}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3 shrink-0" />
                  {maxParticipants} {t("cls.max_participants")}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* ─── Actions ─── */}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleSubmit}
                disabled={isPending || !name.trim() || daysOfWeek.length === 0}
              >
                {isPending ? (
                  <Loader2 className="size-4 me-1.5 animate-spin" />
                ) : (
                  <Dumbbell className="size-4 me-1.5" />
                )}
                {t("cls.save")}
              </Button>
              <Button variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
