"use client";

import { useState, useEffect, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { createManualAppointment } from "@/actions/booking";
import { searchCustomers } from "@/actions/customers";
import {
  CalendarPlus,
  Loader2,
  Wallet,
  Search,
  UserCheck,
  UserPlus,
  Phone,
  Ban,
  X,
} from "lucide-react";

type CustomerSuggestion = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
};

interface ManualBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  staff: { id: string; name: string }[];
  services: { id: string; title: string; durationMinutes: number }[];
  serviceStaffLinks?: { serviceId: string; staffId: string }[];
  initialDate?: string;
  prefillCustomer?: { name: string; phone: string };
}

export function ManualBookingDialog({
  open,
  onOpenChange,
  businessId,
  staff,
  services,
  serviceStaffLinks,
  initialDate,
  prefillCustomer,
}: ManualBookingDialogProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeCards, setActiveCards] = useState<
    Array<{ id: string; name: string; sessionsRemaining: number; sessionsTotal: number }>
  >([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: services[0]?.id ?? "",
    staffId: staff[0]?.id ?? "",
    date: initialDate ?? today,
    time: "10:00",
    notes: "",
  });

  // Customer picker state
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSuggestion | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const availableStaff = useMemo(() => {
    if (!serviceStaffLinks || serviceStaffLinks.length === 0) return staff;
    const linkedIds = new Set(
      serviceStaffLinks.filter((l) => l.serviceId === form.serviceId).map((l) => l.staffId)
    );
    if (linkedIds.size === 0) return staff;
    return staff.filter((s) => linkedIds.has(s.id));
  }, [staff, form.serviceId, serviceStaffLinks]);

  useEffect(() => {
    if (open && prefillCustomer) {
      setForm((prev) => ({
        ...prev,
        customerName: prefillCustomer.name,
        customerPhone: prefillCustomer.phone,
      }));
      setSelectedCustomer(null);
    }
  }, [open, prefillCustomer]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedCustomer(null);
      setSearchLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (availableStaff.length > 0 && !availableStaff.some((s) => s.id === form.staffId)) {
      setForm((prev) => ({ ...prev, staffId: availableStaff[0].id }));
    }
  }, [availableStaff, form.staffId]);

  useEffect(() => {
    const phone = form.customerPhone.trim();
    if (!phone || phone.length < 8 || !form.serviceId) {
      setActiveCards([]);
      setSelectedCardId(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          businessId,
          serviceId: form.serviceId,
          phone,
        });
        const res = await fetch(`/api/cards/check?${params}`);
        const data = await res.json();
        setActiveCards(data.cards ?? []);
        setSelectedCardId(data.cards?.[0]?.id ?? null);
      } catch {
        setActiveCards([]);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.customerPhone, form.serviceId, businessId]);

  // Debounced customer search
  const handleNameChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, customerName: value }));
    setError(null);

    if (selectedCustomer) {
      setSelectedCustomer(null);
      setForm((prev) => ({ ...prev, customerPhone: "" }));
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchCustomers(value.trim());
        setSuggestions(results);
        setShowSuggestions(results.length > 0 || value.trim().length >= 2);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [selectedCustomer]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCustomer(customer: CustomerSuggestion) {
    setSelectedCustomer(customer);
    setForm((prev) => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone ?? "",
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function clearSelection() {
    setSelectedCustomer(null);
    setForm((prev) => ({ ...prev, customerName: "", customerPhone: "" }));
    setSuggestions([]);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      setError(t("manual.error_required"));
      return;
    }
    if (!form.serviceId || !form.staffId) {
      setError(t("manual.error_required"));
      return;
    }

    const startTime = new Date(`${form.date}T${form.time}:00`);
    if (isNaN(startTime.getTime())) {
      setError(t("manual.error_invalid_date"));
      return;
    }
    if (startTime.getTime() < Date.now()) {
      setError(t("manual.error_past_time"));
      return;
    }

    startTransition(async () => {
      const result = await createManualAppointment({
        businessId,
        customerPhone: form.customerPhone.trim(),
        customerName: form.customerName.trim(),
        serviceId: form.serviceId,
        staffId: form.staffId,
        startTime: startTime.toISOString(),
        notes: form.notes || undefined,
        customerCardId: selectedCardId || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        setForm({
          customerName: prefillCustomer?.name ?? "",
          customerPhone: prefillCustomer?.phone ?? "",
          serviceId: services[0]?.id ?? "",
          staffId: staff[0]?.id ?? "",
          date: today,
          time: "10:00",
          notes: "",
        });
        setSelectedCustomer(null);
        router.refresh();
      } else {
        setError(result.error ?? t("manual.error_generic"));
      }
    });
  }

  const hasPrefill = !!prefillCustomer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={locale === "he" ? "rtl" : "ltr"} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5" />
            {t("manual.title")}
          </DialogTitle>
          <DialogDescription>{t("manual.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer picker */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("manual.customer_name")}</Label>
              {hasPrefill ? (
                <Input
                  value={form.customerName}
                  readOnly
                  className="bg-muted"
                />
              ) : selectedCustomer ? (
                <div className="flex h-9 w-full items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 text-sm">
                  <UserCheck className="size-4 text-primary shrink-0" />
                  <span className="flex-1 truncate font-medium">{selectedCustomer.name}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">{selectedCustomer.phone}</span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="shrink-0 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
                  >
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      ref={nameInputRef}
                      value={form.customerName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      onFocus={() => {
                        if (form.customerName.trim().length >= 2) setShowSuggestions(true);
                      }}
                      placeholder={t("manual.search_placeholder")}
                      disabled={isPending}
                      className="ps-9"
                      autoComplete="off"
                    />
                    {searchLoading && (
                      <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden"
                    >
                      {suggestions.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto py-1">
                          {suggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectCustomer(c)}
                              disabled={c.status === "BLOCKED"}
                              className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                                {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">{c.name}</span>
                                  {c.status === "BLOCKED" && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                                      <Ban className="size-3" />
                                      {t("manual.blocked_customer")}
                                    </span>
                                  )}
                                </div>
                                {c.phone && (
                                  <p className="text-xs text-muted-foreground truncate" dir="ltr">{c.phone}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : !searchLoading && form.customerName.trim().length >= 2 ? (
                        <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                          <UserPlus className="size-4 shrink-0" />
                          {t("manual.no_results")}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Existing / New customer indicator */}
              {!hasPrefill && form.customerName.trim().length >= 2 && (
                <div className="flex items-center gap-1.5 text-xs">
                  {selectedCustomer ? (
                    <>
                      <UserCheck className="size-3.5 text-primary" />
                      <span className="text-primary font-medium">{t("manual.existing_customer")}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("manual.new_customer")}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("manual.customer_phone")}</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={form.customerPhone}
                  onChange={(e) => update("customerPhone", e.target.value)}
                  placeholder="05X-XXXXXXX"
                  dir="ltr"
                  disabled={isPending}
                  readOnly={hasPrefill || !!selectedCustomer}
                  className={`ps-9 ${(hasPrefill || selectedCustomer) ? "bg-muted" : ""}`}
                />
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <Label>{t("manual.service")}</Label>
            <select
              value={form.serviceId}
              onChange={(e) => update("serviceId", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isPending}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.durationMinutes} {t("common.min")})
                </option>
              ))}
            </select>
          </div>

          {/* Staff */}
          <div className="space-y-1.5">
            <Label>{t("manual.staff")}</Label>
            <select
              value={form.staffId}
              onChange={(e) => update("staffId", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              disabled={isPending}
            >
              {availableStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("manual.date")}</Label>
              <Input
                type="date"
                value={form.date}
                min={today}
                onChange={(e) => update("date", e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("manual.time")}</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Card indicator */}
          {activeCards.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="size-4 text-primary" />
                {t("card.has_active_card", {
                  name: activeCards[0].name,
                  n: String(activeCards[0].sessionsRemaining),
                })}
              </div>
              {activeCards.length > 1 && (
                <div className="mt-2 space-y-1">
                  {activeCards.map((card) => (
                    <label key={card.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="cardId"
                        checked={selectedCardId === card.id}
                        onChange={() => setSelectedCardId(card.id)}
                        className="size-3.5"
                      />
                      <span>
                        {card.name} — {card.sessionsRemaining}/{card.sessionsTotal}
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground">
                    <input
                      type="radio"
                      name="cardId"
                      checked={selectedCardId === null}
                      onChange={() => setSelectedCardId(null)}
                      className="size-3.5"
                    />
                    {t("card.pay_full_price")}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{t("manual.notes")}</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder={t("manual.notes_ph")}
              rows={2}
              disabled={isPending}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 me-1.5 animate-spin" />
              ) : (
                <CalendarPlus className="size-4 me-1.5" />
              )}
              {t("manual.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
