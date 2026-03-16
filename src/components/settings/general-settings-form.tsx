"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBusinessInfo } from "@/actions/business";
import { BUSINESS_TYPES, SLOT_GRANULARITY_OPTIONS } from "@/lib/utils/constants";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currencies";
import { useT } from "@/lib/i18n/locale-context";
import type { InferSelectModel } from "drizzle-orm";
import type { businesses } from "@/lib/db/schema";
import { Loader2, Save } from "lucide-react";

type Business = InferSelectModel<typeof businesses>;

const TIMEZONE_OPTIONS = [
  "Asia/Jerusalem",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
];

interface GeneralSettingsFormProps {
  business: Business;
}

export function GeneralSettingsForm({ business }: GeneralSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const t = useT();

  const [form, setForm] = useState({
    name: business.name,
    type: business.type,
    phone: business.phone ?? "",
    email: business.email ?? "",
    address: business.address ?? "",
    timezone: business.timezone,
    currency: business.currency,
    slotGranularityMin: business.slotGranularityMin,
    defaultBufferMin: business.defaultBufferMin,
    language: (business.language ?? "he") as "en" | "he",
  });

  function update(patch: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setSuccess(false);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await updateBusinessInfo(form);

    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.business_info")}</CardTitle>
          <CardDescription>{t("settings.business_info_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("settings.business_name")}>
              <Input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                disabled={loading}
              />
            </FormField>

            <FormField label={t("settings.business_type")}>
              <Select
                value={form.type}
                onValueChange={(v) => v && update({ type: v as typeof form.type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`btype.${value}` as "btype.BARBER")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("settings.phone")}>
              <Input
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="+972-50-123-4567"
                disabled={loading}
              />
            </FormField>

            <FormField label={t("settings.email")}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="hello@mybusiness.com"
                disabled={loading}
              />
            </FormField>
          </div>

          <FormField label={t("settings.address")}>
            <Input
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="123 Main St, City"
              disabled={loading}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.regional")}</CardTitle>
          <CardDescription>{t("settings.regional_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("settings.timezone")}>
              <Select
                value={form.timezone}
                onValueChange={(v) => update({ timezone: v ?? undefined })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("settings.currency")}>
              <Select
                value={form.currency}
                onValueChange={(v) => v && update({ currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("settings.slot_duration")}>
              <Select
                value={String(form.slotGranularityMin)}
                onValueChange={(v) => v && update({ slotGranularityMin: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_GRANULARITY_OPTIONS.map((v) => (
                    <SelectItem key={v} value={String(v)}>
                      {v} {t("settings.minutes")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("settings.buffer")}>
              <Input
                type="number"
                min={0}
                max={60}
                value={form.defaultBufferMin}
                onChange={(e) =>
                  update({ defaultBufferMin: Number(e.target.value) })
                }
                disabled={loading}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.language")}</CardTitle>
          <CardDescription>{t("settings.language_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("settings.language")}>
              <Select
                value={form.language}
                onValueChange={(v) => v && update({ language: v as "en" | "he" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("settings.lang_en")}</SelectItem>
                  <SelectItem value="he">{t("settings.lang_he")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-600">{t("settings.saved")}</p>
      )}

      <Button onClick={handleSave} disabled={loading}>
        {loading ? (
          <Loader2 className="me-2 size-4 animate-spin" />
        ) : (
          <Save className="me-2 size-4" />
        )}
        {t("settings.save")}
      </Button>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
