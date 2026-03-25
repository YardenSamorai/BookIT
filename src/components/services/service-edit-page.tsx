"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/shared/image-upload";
import { updateService } from "@/actions/services";
import type { ServiceInput } from "@/validators/service";
import type { InferSelectModel } from "drizzle-orm";
import type { services, serviceCategories } from "@/lib/db/schema";
import { Check, Clock, CreditCard, Loader2, Lock, Save, Settings2, Shield, Users, Video } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { TranslationKey } from "@/lib/i18n";

type Service = InferSelectModel<typeof services>;
type Category = InferSelectModel<typeof serviceCategories>;

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

const PAYMENT_MODES: { value: ServiceInput["paymentMode"]; key: TranslationKey; icon: string }[] = [
  { value: "ON_SITE", key: "svc.pay_on_site", icon: "🏪" },
  { value: "FULL", key: "svc.pay_full", icon: "💳" },
  { value: "FREE", key: "svc.pay_free", icon: "🎁" },
  { value: "DEPOSIT", key: "svc.pay_deposit", icon: "💰" },
  { value: "CONTACT_FOR_PRICE", key: "svc.pay_contact", icon: "📞" },
];

interface ServiceEditPageProps {
  service: Service;
  categories: Category[];
}

export function ServiceEditPage({ service, categories }: ServiceEditPageProps) {
  const router = useRouter();
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<ServiceInput>({
    title: service.title,
    description: service.description ?? "",
    categoryId: service.categoryId ?? "",
    durationMinutes: service.durationMinutes,
    bufferMinutes: service.bufferMinutes ?? 0,
    price: service.price ?? "",
    depositAmount: service.depositAmount ?? "",
    paymentMode: service.paymentMode,
    approvalType: service.approvalType,
    staffAssignmentMode: service.staffAssignmentMode,
    imageUrl: service.imageUrl ?? "",
    meetingLink: service.meetingLink ?? "",
    isGroup: service.isGroup ?? false,
    maxParticipants: service.maxParticipants ?? 1,
    blocksAllStaff: service.blocksAllStaff ?? false,
    autoManaged: service.autoManaged ?? false,
    cancelHoursBefore: service.cancelHoursBefore ?? 0,
    rescheduleHoursBefore: service.rescheduleHoursBefore ?? 0,
    isActive: service.isActive,
  });

  function update(patch: Partial<ServiceInput>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  async function handleSave() {
    setLoading(true);
    setError("");
    setSaved(false);

    const result = await updateService(service.id, form);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  function formatDuration(d: number) {
    if (d < 60) return `${d} ${t("common.min")}`;
    const h = Math.floor(d / 60);
    const m = d % 60;
    return m ? `${h}:${String(m).padStart(2, "0")} ${t("svc.hours_unit")}` : `${h} ${t("svc.hours_unit")}`;
  }

  return (
    <div className="pb-8">
      {/* ROW 1: 3-column — Basic Info | Duration | Pricing + Settings */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* LEFT: Basic Info */}
        <SectionCard
          icon={<Settings2 className="size-4" />}
          title={t("svc.basic_info")}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("svc.service_title")}</Label>
              <Input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={t("svc.service_title_ph")}
                disabled={loading}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("svc.description")}</Label>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder={t("svc.description_ph")}
                disabled={loading}
                maxLength={500}
              />
              <p className="text-end text-[11px] text-muted-foreground">
                {(form.description ?? "").length}/500
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">{t("svc.service_image")}</Label>
                <ImageUpload
                  value={form.imageUrl ?? ""}
                  onChange={(url) => update({ imageUrl: url })}
                  folder="services"
                  aspectRatio="video"
                  className="max-w-[160px]"
                  placeholder={t("svc.upload_image")}
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm">{t("svc.category")}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <ChipButton
                      active={!form.categoryId}
                      onClick={() => update({ categoryId: "" })}
                      disabled={loading}
                    >
                      {t("svc.no_category")}
                    </ChipButton>
                    {categories.map((cat) => (
                      <ChipButton
                        key={cat.id}
                        active={form.categoryId === cat.id}
                        onClick={() => update({ categoryId: cat.id })}
                        disabled={loading}
                      >
                        {cat.name}
                      </ChipButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Duration */}
        <SectionCard icon={<Clock className="size-4" />} title={t("svc.duration_scheduling")}>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.duration")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((d) => (
                  <ChipButton key={d} active={form.durationMinutes === d} onClick={() => update({ durationMinutes: d })} disabled={loading}>{formatDuration(d)}</ChipButton>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" min={5} max={480} value={form.durationMinutes} onChange={(e) => update({ durationMinutes: Number(e.target.value) })} disabled={loading} className="h-8 w-20 text-center" />
                <span className="text-xs text-muted-foreground">{t("common.min")}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.buffer")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("svc.buffer_desc")}</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={120} value={form.bufferMinutes ?? 0} onChange={(e) => update({ bufferMinutes: Number(e.target.value) })} disabled={loading} className="h-8 w-20 text-center" />
                <span className="text-xs text-muted-foreground">{t("common.min")}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.approval")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <OptionCard active={form.approvalType === "AUTO"} onClick={() => update({ approvalType: "AUTO" })} title={t("svc.auto_approve")} desc={t("svc.auto_approve_desc")} disabled={loading} />
                <OptionCard active={form.approvalType === "MANUAL"} onClick={() => update({ approvalType: "MANUAL" })} title={t("svc.manual_approve")} desc={t("svc.manual_approve_desc")} disabled={loading} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Pricing + Staff assignment */}
        <SectionCard icon={<CreditCard className="size-4" />} title={t("svc.pricing")}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map(({ value, key, icon }) => (
                <button key={value} type="button" onClick={() => update({ paymentMode: value })} disabled={loading}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-medium transition-all ${form.paymentMode === value ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"}`}
                >
                  <span className="text-sm">{icon}</span>{t(key)}
                </button>
              ))}
            </div>
            {(form.paymentMode === "FULL" || form.paymentMode === "ON_SITE") && (
              <div className="space-y-1">
                <Label className="text-sm">{t("svc.price")}</Label>
                <Input value={form.price} onChange={(e) => update({ price: e.target.value })} placeholder="0.00" disabled={loading} className="h-9 w-32" dir="ltr" />
              </div>
            )}
            {form.paymentMode === "DEPOSIT" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-sm">{t("svc.full_price")}</Label>
                  <Input value={form.price} onChange={(e) => update({ price: e.target.value })} placeholder="0.00" disabled={loading} className="h-9" dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">{t("svc.deposit_amount")}</Label>
                  <Input value={form.depositAmount} onChange={(e) => update({ depositAmount: e.target.value })} placeholder="0.00" disabled={loading} className="h-9" dir="ltr" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.staff_assignment")}</Label>
              <div className="space-y-1.5">
                {([
                  { value: "ANY" as const, key: "svc.staff_any" as TranslationKey },
                  { value: "LIST" as const, key: "svc.staff_customer_picks" as TranslationKey },
                  { value: "SPECIFIC" as const, key: "svc.staff_specific" as TranslationKey },
                ]).map(({ value, key }) => (
                  <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-sm transition-all ${form.staffAssignmentMode === value ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"} ${loading ? "pointer-events-none opacity-50" : ""}`}>
                    <div className={`flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${form.staffAssignmentMode === value ? "border-primary bg-primary" : "border-gray-300"}`}>
                      {form.staffAssignmentMode === value && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                    <input type="radio" name="staffAssignment" value={value} checked={form.staffAssignmentMode === value} onChange={() => update({ staffAssignmentMode: value })} className="sr-only" />
                    <span className="font-medium">{t(key)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ROW 2: Toggles + Policies + Meeting Link in one row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <ToggleCard label={t("svc.group_service")} checked={form.isGroup} onChange={(checked) => update({ isGroup: checked, maxParticipants: checked ? 10 : 1 })} disabled={loading} />
        <ToggleCard label={t("svc.blocks_all_staff")} checked={form.blocksAllStaff} onChange={(checked) => update({ blocksAllStaff: checked })} disabled={loading} />
        <ToggleCard label={t("common.active")} checked={form.isActive} onChange={(checked) => update({ isActive: checked })} disabled={loading} />

        {form.isGroup && (
          <div className="rounded-xl border bg-card p-3 sm:col-span-3">
            <Label className="text-sm">{t("svc.max_participants")}</Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {[5, 10, 15, 20, 30, 50].map((n) => (
                <ChipButton key={n} active={form.maxParticipants === n} onClick={() => update({ maxParticipants: n })} disabled={loading}>{n}</ChipButton>
              ))}
              <Input type="number" min={2} max={500} value={form.maxParticipants} onChange={(e) => update({ maxParticipants: Number(e.target.value) })} disabled={loading} className="h-8 w-20 text-center" />
            </div>
          </div>
        )}
      </div>

      {/* ROW 3: Policies + Meeting Link — full width 3-col */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard icon={<Shield className="size-4" />} title={t("svc.cancel_reschedule")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.cancel_hours")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("svc.cancel_hours_desc")}</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} value={form.cancelHoursBefore ?? 0} onChange={(e) => update({ cancelHoursBefore: Number(e.target.value) })} disabled={loading} className="h-8 w-20 text-center" />
                <span className="text-xs text-muted-foreground">{t("svc.hours_unit")}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.reschedule_hours")}</Label>
              <p className="text-[11px] text-muted-foreground">{t("svc.reschedule_hours_desc")}</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} value={form.rescheduleHoursBefore ?? 0} onChange={(e) => update({ rescheduleHoursBefore: Number(e.target.value) })} disabled={loading} className="h-8 w-20 text-center" />
                <span className="text-xs text-muted-foreground">{t("svc.hours_unit")}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Video className="size-4" />} title={t("svc.online_virtual")}>
          <div className="space-y-1">
            <Label className="text-sm">{t("svc.meeting_link")}</Label>
            <Input value={form.meetingLink ?? ""} onChange={(e) => update({ meetingLink: e.target.value })} placeholder="https://zoom.us/j/..." disabled={loading} className="h-9" dir="ltr" />
            <p className="text-[11px] text-muted-foreground">{t("svc.meeting_link_ph")}</p>
          </div>
        </SectionCard>

        <Card className="flex flex-col justify-between overflow-hidden">
          <CardContent className="space-y-3 p-4">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {saved && (
              <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <Check className="size-4" />{t("svc.changes_saved")}
              </div>
            )}
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
              {t("svc.save_changes")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/services")} disabled={loading} className="w-full">
              {t("common.cancel")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-gray-50/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-white text-gray-500 shadow-sm">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {description && (
          <p className="mt-0.5 ps-8 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function ToggleCard({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center justify-between gap-2 p-3">
        <p className="text-sm font-medium">{label}</p>
        <Switch
          checked={checked}
          onCheckedChange={(v) => onChange(!!v)}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

function ChipButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
      } disabled:pointer-events-none disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  desc,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-2 p-3 text-start transition-all ${
        active
          ? "border-primary bg-primary/5"
          : "border-gray-100 hover:border-gray-200"
      } disabled:pointer-events-none disabled:opacity-50`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{desc}</p>
    </button>
  );
}

