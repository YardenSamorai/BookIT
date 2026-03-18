"use client";

import { useState, useTransition } from "react";
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
import { CalendarPlus, Loader2 } from "lucide-react";

interface ManualBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  staff: { id: string; name: string }[];
  services: { id: string; title: string; durationMinutes: number }[];
  initialDate?: string;
}

export function ManualBookingDialog({
  open,
  onOpenChange,
  businessId,
  staff,
  services,
  initialDate,
}: ManualBookingDialogProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: services[0]?.id ?? "",
    staffId: staff[0]?.id ?? "",
    date: initialDate ?? today,
    time: "10:00",
    notes: "",
  });

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

    startTransition(async () => {
      const result = await createManualAppointment({
        businessId,
        customerPhone: form.customerPhone.trim(),
        customerName: form.customerName.trim(),
        serviceId: form.serviceId,
        staffId: form.staffId,
        startTime: startTime.toISOString(),
        notes: form.notes || undefined,
      });

      if (result.success) {
        onOpenChange(false);
        setForm({
          customerName: "",
          customerPhone: "",
          serviceId: services[0]?.id ?? "",
          staffId: staff[0]?.id ?? "",
          date: today,
          time: "10:00",
          notes: "",
        });
        router.refresh();
      } else {
        setError(result.error ?? t("manual.error_generic"));
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5" />
            {t("manual.title")}
          </DialogTitle>
          <DialogDescription>{t("manual.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("manual.customer_name")}</Label>
              <Input
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                placeholder={t("manual.customer_name_ph")}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("manual.customer_phone")}</Label>
              <Input
                value={form.customerPhone}
                onChange={(e) => update("customerPhone", e.target.value)}
                placeholder="05X-XXXXXXX"
                dir="ltr"
                disabled={isPending}
              />
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
              {staff.map((s) => (
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
