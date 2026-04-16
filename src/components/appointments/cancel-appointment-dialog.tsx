"use client";

import { useEffect, useState } from "react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, XCircle } from "lucide-react";

/**
 * Staff-initiated cancel dialog with a WhatsApp/SMS notify toggle.
 *
 * Kept as a dedicated shared component so the three call-sites (appointments
 * list, appointment detail page, calendar quick-view) stay consistent — any
 * change to the notify copy, default, or confirmation UX happens in one place.
 */
export function CancelAppointmentDialog({
  open,
  onOpenChange,
  disabled,
  summary,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
  /** Optional customer/service/date summary shown in the dialog. */
  summary?: {
    customerName?: string;
    serviceName?: string;
    staffName?: string;
    dateStr?: string;
    timeStr?: string;
  };
  onConfirm: (opts: { reason: string; notifyCustomer: boolean }) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const [reason, setReason] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  useEffect(() => {
    if (open) {
      setReason("");
      setNotifyCustomer(true);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={locale === "he" ? "rtl" : "ltr"}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="size-5 text-destructive" />
            {t("apt.cancel_title" as any)}
          </DialogTitle>
          <DialogDescription>
            {t("apt.cancel_desc" as any)}
          </DialogDescription>
        </DialogHeader>

        {summary && (summary.customerName || summary.serviceName) && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
            {summary.customerName && (
              <p className="font-semibold">{summary.customerName}</p>
            )}
            {(summary.serviceName || summary.staffName) && (
              <p className="text-xs text-muted-foreground">
                {[summary.serviceName, summary.staffName]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {(summary.dateStr || summary.timeStr) && (
              <p className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                {[summary.dateStr, summary.timeStr].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}

        <div
          className={`rounded-lg border p-3 transition-colors ${
            notifyCustomer
              ? "border-primary/30 bg-primary/5"
              : "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/15"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {t("apt.cancel_notify_label" as any)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {notifyCustomer
                  ? t("apt.cancel_notify_hint_on" as any)
                  : t("apt.cancel_notify_hint_off" as any)}
              </p>
            </div>
            <Switch
              checked={notifyCustomer}
              onCheckedChange={(v) => setNotifyCustomer(!!v)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {t("apt.cancel_reason_label" as any)}
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("apt.cancel_reason_ph" as any)}
            rows={2}
            disabled={disabled}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm({ reason, notifyCustomer })}
            disabled={disabled}
          >
            {disabled && <Loader2 className="me-1.5 size-4 animate-spin" />}
            {t("apt.cancel_confirm_btn" as any)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
