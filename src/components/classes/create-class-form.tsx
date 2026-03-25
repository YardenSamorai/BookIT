"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClassCalendarColorPicker } from "./class-calendar-color-picker";
import { createClass } from "@/actions/classes";
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
  Plus,
  X,
  Layers,
  CalendarDays,
} from "lucide-react";

type Staff = { id: string; name: string };

type ClassType = {
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  staff: Staff[];
  classTypes?: ClassType[];
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

type Slot = {
  key: string;
  staffId: string;
  daysOfWeek: number[];
  startTime: string;
  notes: string;
};

function localDateStr(d: Date = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let slotKeyCounter = 0;
function nextSlotKey() {
  return `slot-${++slotKeyCounter}`;
}

function makeEmptySlot(defaultStaffId: string): Slot {
  return { key: nextSlotKey(), staffId: defaultStaffId, daysOfWeek: [], startTime: "09:00", notes: "" };
}

export function CreateClassForm({ open, onOpenChange, businessId, staff, classTypes = [] }: Props) {
  const t = useT();
  const locale = useLocale();
  const dir = getDir(locale);
  const [isPending, startTransition] = useTransition();

  const [selectedTypeId, setSelectedTypeId] = useState<string | "">("");

  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(12);
  const [calendarColor, setCalendarColor] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("FREE");
  const [price, setPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [approvalType, setApprovalType] = useState<"AUTO" | "MANUAL">("AUTO");
  const [cancelHoursBefore, setCancelHoursBefore] = useState("");
  const [rescheduleHoursBefore, setRescheduleHoursBefore] = useState("");
  const [showPricing, setShowPricing] = useState(false);

  const [slots, setSlots] = useState<Slot[]>(() => [makeEmptySlot(staff[0]?.id ?? "")]);

  const [effectiveFrom, setEffectiveFrom] = useState(localDateStr());
  const [effectiveUntil, setEffectiveUntil] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [successCount, setSuccessCount] = useState(0);

  const selectedType = classTypes.find((ct) => ct.id === selectedTypeId);
  const isNewType = !selectedTypeId;

  const typeName = selectedType?.title ?? name;
  const typeDuration = selectedType?.durationMinutes ?? durationMinutes;

  function reset() {
    setSelectedTypeId("");
    setName("");
    setDurationMinutes(60);
    setMaxParticipants(12);
    setCalendarColor(null);
    setPaymentMode("FREE");
    setPrice("");
    setDepositAmount("");
    setApprovalType("AUTO");
    setCancelHoursBefore("");
    setRescheduleHoursBefore("");
    setShowPricing(false);
    setSlots([makeEmptySlot(staff[0]?.id ?? "")]);
    setEffectiveFrom(localDateStr());
    setEffectiveUntil("");
    setError("");
    setSuccess(false);
    setSuccessName("");
    setSuccessCount(0);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function addSlot() {
    setSlots((prev) => [...prev, makeEmptySlot(staff[0]?.id ?? "")]);
  }

  function removeSlot(key: string) {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  }

  function updateSlot(key: string, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function toggleSlotDay(key: string, day: number) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        const days = s.daysOfWeek.includes(day)
          ? s.daysOfWeek.filter((d) => d !== day)
          : [...s.daysOfWeek, day].sort();
        return { ...s, daysOfWeek: days };
      })
    );
  }

  function handleSubmit() {
    if (isNewType && !name.trim()) { setError(t("cls.class_name")); return; }
    for (const slot of slots) {
      if (!slot.staffId) { setError(t("cls.instructor")); return; }
      if (slot.daysOfWeek.length === 0) { setError(t("cls.select_days")); return; }
    }

    setError("");
    startTransition(async () => {
      const res = await createClass({
        businessId,
        serviceId: selectedTypeId || undefined,
        name: isNewType ? name.trim() : selectedType!.title,
        durationMinutes: isNewType ? durationMinutes : selectedType!.durationMinutes,
        maxParticipants: isNewType ? maxParticipants : (selectedType!.maxParticipants ?? 12),
        effectiveFrom,
        effectiveUntil: effectiveUntil || undefined,
        calendarColor,
        price: isNewType ? (price || null) : (selectedType!.price ?? null),
        depositAmount: isNewType ? (depositAmount || null) : (selectedType!.depositAmount ?? null),
        paymentMode: isNewType ? paymentMode : (selectedType!.paymentMode as PaymentMode) || "FREE",
        approvalType: isNewType ? approvalType : (selectedType!.approvalType as "AUTO" | "MANUAL") || "AUTO",
        cancelHoursBefore: isNewType
          ? (cancelHoursBefore ? Number(cancelHoursBefore) : null)
          : (selectedType!.cancelHoursBefore ?? null),
        rescheduleHoursBefore: isNewType
          ? (rescheduleHoursBefore ? Number(rescheduleHoursBefore) : null)
          : (selectedType!.rescheduleHoursBefore ?? null),
        slots: slots.map((s) => ({
          staffId: s.staffId,
          daysOfWeek: s.daysOfWeek,
          startTime: s.startTime,
          notes: s.notes || undefined,
        })),
      });
      if (!res.success) { setError(res.error); return; }
      setSuccessName(isNewType ? name.trim() : selectedType!.title);
      setSuccessCount(slots.length);
      setSuccess(true);
      setTimeout(() => handleOpenChange(false), 1800);
    });
  }

  function endTimeStr(start: string, dur: number) {
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + (m || 0) + dur;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  }

  const selectCls =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const canSubmit =
    (isNewType ? !!name.trim() : true) &&
    slots.length > 0 &&
    slots.every((s) => s.staffId && s.daysOfWeek.length > 0);

  function paymentLabel(mode: string) {
    const pm = PAYMENT_MODES.find((p) => p.value === mode);
    return pm ? (locale === "he" ? pm.labelHe : pm.labelEn) : mode;
  }

  const filledSlots = slots.filter((s) => s.daysOfWeek.length > 0);
  const allDays = [...new Set(slots.flatMap((s) => s.daysOfWeek))].sort();

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        dir={dir}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-xl data-[side=right]:lg:max-w-2xl gap-0"
      >
        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 animate-in fade-in duration-300">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-5">
              <Check className="size-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-semibold">
                {successCount > 1
                  ? t("cls.slots_created", { n: successCount, name: successName })
                  : t("cls.class_created")}
              </p>
              <p className="text-sm text-muted-foreground">{successName}</p>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Sticky Header ─── */}
            <SheetHeader className="shrink-0 border-b px-6 py-5 space-y-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <Dumbbell className="size-5 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <SheetTitle className="text-lg font-semibold">
                      {t("cls.create_class")}
                    </SheetTitle>
                    <SheetDescription>{t("cls.create_class_desc")}</SheetDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            </SheetHeader>

            {/* ─── Scrollable Body ─── */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

              {/* ── Section 1: Class Type ── */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Layers className="size-4 text-muted-foreground" />
                  {t("cls.class_type")}
                </h3>

                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className={selectCls}
                  disabled={isPending}
                >
                  <option value="">{t("cls.new_class_type")}</option>
                  {classTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.title}</option>
                  ))}
                </select>

                {selectedType && (
                  <div className="rounded-xl border border-s-4 border-s-primary/30 bg-muted/20 p-4 space-y-2 animate-in fade-in duration-200">
                    <p className="font-semibold">{selectedType.title}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {selectedType.durationMinutes} {t("cls.duration_min")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        {selectedType.maxParticipants ?? 12}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="size-3.5" />
                        {paymentLabel(selectedType.paymentMode)}
                        {selectedType.price && selectedType.paymentMode !== "FREE"
                          ? ` · ₪${selectedType.price}`
                          : ""}
                      </span>
                    </div>
                  </div>
                )}

                {isNewType && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("cls.class_name")}</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("cls.class_name_placeholder")}
                        disabled={isPending}
                        autoFocus
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("cls.calendar_color")}</Label>
                      <ClassCalendarColorPicker
                        value={calendarColor}
                        onChange={setCalendarColor}
                        disabled={isPending}
                        hint={t("cls.calendar_color_hint")}
                        defaultLabel={t("cls.calendar_color_default")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("cls.duration")}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={5}
                            max={480}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            className="w-24 h-10"
                            disabled={isPending}
                          />
                          <span className="text-sm text-muted-foreground">{t("cls.duration_min")}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">{t("cls.max_participants")}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={500}
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(Number(e.target.value))}
                          className="w-28 h-10"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPricing(!showPricing)}
                      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full rounded-xl border border-dashed border-muted-foreground/20 px-4 py-3 hover:border-muted-foreground/40"
                    >
                      <CreditCard className="size-4" />
                      {t("cls.section_pricing")}
                      <ChevronDown className={`size-4 ms-auto transition-transform duration-200 ${showPricing ? "rotate-180" : ""}`} />
                    </button>

                    {showPricing && (
                      <div className="rounded-xl border bg-muted/10 p-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t("cls.payment_mode")}</Label>
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
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("cls.price_label")}</Label>
                            <Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" disabled={isPending} className="h-10" />
                          </div>
                        )}

                        {paymentMode === "DEPOSIT" && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("cls.deposit_label")}</Label>
                            <Input type="number" min={0} step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" disabled={isPending} className="h-10" />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t("cls.approval_type")}</Label>
                          <select value={approvalType} onChange={(e) => setApprovalType(e.target.value as "AUTO" | "MANUAL")} className={selectCls} disabled={isPending}>
                            <option value="AUTO">{t("cls.approval_auto")}</option>
                            <option value="MANUAL">{t("cls.approval_manual")}</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("cls.cancel_policy")}</Label>
                            <Input type="number" min={0} value={cancelHoursBefore} onChange={(e) => setCancelHoursBefore(e.target.value)} placeholder="—" disabled={isPending} className="h-10" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t("cls.reschedule_policy")}</Label>
                            <Input type="number" min={0} value={rescheduleHoursBefore} onChange={(e) => setRescheduleHoursBefore(e.target.value)} placeholder="—" disabled={isPending} className="h-10" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* ── Section 2: Time Slots ── */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Repeat className="size-4 text-muted-foreground" />
                  {t("cls.time_slots")}
                </h3>

                <div className="space-y-4">
                  {slots.map((slot, idx) => (
                    <div
                      key={slot.key}
                      className="rounded-xl border bg-muted/10 p-4 space-y-3 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {t("cls.slot_n", { n: idx + 1 })}
                        </span>
                        {slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlot(slot.key)}
                            disabled={isPending}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {DAY_INDICES.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleSlotDay(slot.key, day)}
                            disabled={isPending}
                            className={`flex size-9 items-center justify-center rounded-full text-xs font-medium transition-all ${
                              slot.daysOfWeek.includes(day)
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {tFn(locale, DAYS_SHORT_KEYS[day] as any)}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">{t("cls.start_time")}</Label>
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(slot.key, { startTime: e.target.value })}
                            disabled={isPending}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">{t("cls.instructor")}</Label>
                          <select
                            value={slot.staffId}
                            onChange={(e) => updateSlot(slot.key, { staffId: e.target.value })}
                            className={selectCls}
                            disabled={isPending}
                          >
                            {staff.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {slot.startTime && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {slot.startTime} – {endTimeStr(slot.startTime, typeDuration)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSlot}
                  disabled={isPending}
                  className="w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 py-3.5 text-sm text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus className="size-4" />
                  {t("cls.add_slot")}
                </button>
              </section>

              {/* ── Section 3: Active Period ── */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {t("cls.active_period")}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("cls.effective_from")}</Label>
                    <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} disabled={isPending} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("cls.effective_until")}</Label>
                    <Input type="date" value={effectiveUntil} onChange={(e) => setEffectiveUntil(e.target.value)} disabled={isPending} className="h-10" />
                  </div>
                </div>
              </section>
            </div>

            {/* ─── Sticky Footer ─── */}
            <div className="shrink-0 border-t bg-background/95 backdrop-blur-sm px-6 py-4 space-y-3">
              {typeName && filledSlots.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap animate-in fade-in duration-200">
                  <span className="font-medium text-foreground">{typeName}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>
                    {filledSlots.length} {filledSlots.length === 1 ? "slot" : "slots"}
                  </span>
                  {allDays.length > 0 && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span>{allDays.map((d) => tFn(locale, DAYS_SHORT_KEYS[d] as any)).join(", ")}</span>
                    </>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive animate-in fade-in duration-150">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isPending || !canSubmit}
                >
                  {isPending ? (
                    <Loader2 className="size-4 me-2 animate-spin" />
                  ) : (
                    <Dumbbell className="size-4 me-2" />
                  )}
                  {t("cls.save")}
                </Button>
                <Button variant="outline" size="lg" onClick={() => handleOpenChange(false)} disabled={isPending}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
