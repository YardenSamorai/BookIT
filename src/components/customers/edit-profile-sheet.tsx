"use client";

import { useState, useTransition, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { updateCustomerProfile } from "@/actions/customers";
import type { CustomerProfile } from "@/lib/db/queries/customers";

interface Props {
  customer: CustomerProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  birthday: string;
  gender: string;
  address: string;
  preferredLanguage: string;
  source: string;
  generalNotes: string;
  smsOptIn: boolean;
  whatsappOptIn: boolean;
  emailMarketingOptIn: boolean;
  reminderChannel: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

export function EditProfileSheet({ customer, open, onOpenChange, onRefresh }: Props) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const initialData: FormData = {
    name: customer.name ?? "",
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    birthday: customer.birthday ?? "",
    gender: customer.gender ?? "",
    address: customer.address ?? "",
    preferredLanguage: customer.preferredLanguage ?? "",
    source: customer.source ?? "",
    generalNotes: customer.generalNotes ?? "",
    smsOptIn: customer.smsOptIn,
    whatsappOptIn: customer.whatsappOptIn,
    emailMarketingOptIn: customer.emailMarketingOptIn,
    reminderChannel: customer.reminderChannel ?? "",
  };

  const [form, setForm] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
      setServerError(null);
    },
    []
  );

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialData);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = t("cust.error_name_required");
    const cleanPhone = form.phone.replace(/[^+\d]/g, "");
    if (!cleanPhone || cleanPhone.length < 9) errs.phone = t("cust.error_phone_invalid");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t("cust.error_email_invalid");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    startTransition(async () => {
      const result = await updateCustomerProfile(customer.id, {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email || null,
        birthday: form.birthday || null,
        gender: form.gender || null,
        address: form.address || null,
        preferredLanguage: form.preferredLanguage || null,
        source: form.source || null,
        generalNotes: form.generalNotes || null,
        smsOptIn: form.smsOptIn,
        whatsappOptIn: form.whatsappOptIn,
        emailMarketingOptIn: form.emailMarketingOptIn,
        reminderChannel: form.reminderChannel || null,
      });
      if (result.success) {
        onOpenChange(false);
        onRefresh();
      } else {
        setServerError(result.error ?? "Unknown error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90dvh] flex flex-col p-0 gap-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:border-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>{t("cust.edit_profile")}</DialogTitle>
          <DialogDescription>{customer.name}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Personal */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">{t("cust.personal")}</h3>
            <div className="space-y-3">
              <FieldRow label={t("cust.col_name")} error={errors.name} required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-11" />
              </FieldRow>
              <FieldRow label={t("cust.phone")} error={errors.phone} required>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-11" dir="ltr" />
              </FieldRow>
              <FieldRow label={t("cust.email")} error={errors.email}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-11" dir="ltr" />
              </FieldRow>
              <FieldRow label={t("cust.birthday")}>
                <Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} className="h-11" />
              </FieldRow>
              <FieldRow label={t("cust.gender")}>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{t("cust.not_set")}</option>
                  <option value="male">{t("cust.gender_male")}</option>
                  <option value="female">{t("cust.gender_female")}</option>
                  <option value="other">{t("cust.gender_other")}</option>
                </select>
              </FieldRow>
            </div>
          </section>

          <Separator />

          {/* Contact */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">{t("cust.contact_info")}</h3>
            <FieldRow label={t("cust.address")}>
              <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} rows={2} />
            </FieldRow>
          </section>

          <Separator />

          {/* Preferences */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">{t("cust.tab_profile")}</h3>
            <FieldRow label={t("cust.preferred_language")}>
              <select
                value={form.preferredLanguage}
                onChange={(e) => set("preferredLanguage", e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">{t("cust.not_set")}</option>
                <option value="he">{t("cust.language_he")}</option>
                <option value="en">{t("cust.language_en")}</option>
              </select>
            </FieldRow>
            <FieldRow label={t("cust.source_acquisition")}>
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} className="h-11" placeholder="Instagram, Google, Referral..." />
            </FieldRow>
          </section>

          <Separator />

          {/* Communication */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">{t("cust.comm_preferences")}</h3>
            <div className="space-y-3">
              <SwitchField label={t("cust.sms_opt_in")} checked={form.smsOptIn} onChange={(v) => set("smsOptIn", v)} />
              <SwitchField label={t("cust.whatsapp_opt_in")} checked={form.whatsappOptIn} onChange={(v) => set("whatsappOptIn", v)} />
              <SwitchField label={t("cust.email_marketing_opt_in")} checked={form.emailMarketingOptIn} onChange={(v) => set("emailMarketingOptIn", v)} />
              <FieldRow label={t("cust.reminder_channel")}>
                <select
                  value={form.reminderChannel}
                  onChange={(e) => set("reminderChannel", e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{t("cust.reminder_default")}</option>
                  <option value="sms">{t("cust.reminder_sms")}</option>
                  <option value="whatsapp">{t("cust.reminder_whatsapp")}</option>
                  <option value="email">{t("cust.reminder_email")}</option>
                </select>
              </FieldRow>
            </div>
          </section>

          <Separator />

          {/* Notes */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium">{t("cust.general_notes")}</h3>
            <Textarea
              value={form.generalNotes}
              onChange={(e) => set("generalNotes", e.target.value)}
              placeholder={t("cust.general_notes_ph")}
              rows={4}
            />
          </section>
        </div>

        {/* Sticky footer */}
        <div className="border-t bg-background px-6 py-4 space-y-2 shrink-0">
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleSave}
              disabled={pending || !isDirty || Object.keys(errors).some((k) => errors[k as keyof FormErrors])}
            >
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between h-11">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
