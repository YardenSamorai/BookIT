"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  createService,
  updateService,
  updateServiceStaff,
} from "@/actions/services";
import { useT } from "@/lib/i18n/locale-context";
import { Check, Clock, CreditCard, Loader2, Lock, Save, Settings2, Users } from "lucide-react";
import type { ServiceInput } from "@/validators/service";
import type { InferSelectModel } from "drizzle-orm";
import type { serviceCategories, staffMembers } from "@/lib/db/schema";
import type { TranslationKey } from "@/lib/i18n";

type Category = InferSelectModel<typeof serviceCategories>;
type StaffMember = InferSelectModel<typeof staffMembers>;

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const PAYMENT_MODES: { value: ServiceInput["paymentMode"]; key: TranslationKey; icon: string }[] = [
  { value: "ON_SITE", key: "svc.pay_on_site", icon: "🏪" },
  { value: "FULL", key: "svc.pay_full", icon: "💳" },
  { value: "FREE", key: "svc.pay_free", icon: "🎁" },
  { value: "DEPOSIT", key: "svc.pay_deposit", icon: "💰" },
  { value: "CONTACT_FOR_PRICE", key: "svc.pay_contact", icon: "📞" },
];

interface Props {
  categories: Category[];
  staff: StaffMember[];
  defaultValues?: ServiceInput & { id?: string };
  linkedStaffIds?: string[];
}

export function ServiceFormPage({
  categories,
  staff,
  defaultValues,
  linkedStaffIds = [],
}: Props) {
  const t = useT();
  const router = useRouter();
  const isEditing = !!defaultValues?.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ServiceInput>({
    title: defaultValues?.title ?? "",
    description: defaultValues?.description ?? "",
    categoryId: defaultValues?.categoryId ?? "",
    durationMinutes: defaultValues?.durationMinutes ?? 60,
    bufferMinutes: defaultValues?.bufferMinutes ?? 0,
    price: defaultValues?.price ?? "",
    depositAmount: defaultValues?.depositAmount ?? "",
    paymentMode: defaultValues?.paymentMode ?? "ON_SITE",
    approvalType: defaultValues?.approvalType ?? "AUTO",
    staffAssignmentMode: defaultValues?.staffAssignmentMode ?? "ANY",
    imageUrl: defaultValues?.imageUrl ?? "",
    isGroup: defaultValues?.isGroup ?? false,
    maxParticipants: defaultValues?.maxParticipants ?? 1,
    blocksAllStaff: defaultValues?.blocksAllStaff ?? false,
    autoManaged: defaultValues?.autoManaged ?? false,
    cancelHoursBefore: defaultValues?.cancelHoursBefore ?? 0,
    rescheduleHoursBefore: defaultValues?.rescheduleHoursBefore ?? 0,
    isActive: defaultValues?.isActive ?? true,
  });

  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(
    new Set(linkedStaffIds)
  );

  function update(patch: Partial<ServiceInput>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function toggleStaff(staffId: string) {
    setSelectedStaff((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const result = isEditing
      ? await updateService(defaultValues!.id!, form)
      : await createService(form);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const serviceId = isEditing
      ? defaultValues!.id!
      : (result as { success: true; data: { serviceId: string } }).data
          ?.serviceId;
    if (serviceId && selectedStaff.size > 0) {
      await updateServiceStaff(serviceId, [...selectedStaff]);
    }

    router.push("/dashboard/services");
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
      {/* ROW 1: 3-column — Basic Info | Duration | Pricing */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          icon={<Settings2 className="size-4" />}
          title={t("svc.basic_info")}
          description={t("svc.basic_info_desc")}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.service_title")}</Label>
              <Input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={t("svc.service_title_ph")}
                disabled={loading}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder={t("svc.description_ph")}
                disabled={loading}
                rows={2}
                maxLength={500}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.service_image")}</Label>
              <ImageUpload
                value={form.imageUrl ?? ""}
                onChange={(url) => update({ imageUrl: url })}
                folder="services"
                aspectRatio="video"
                className="max-w-[140px]"
                placeholder={t("svc.upload_image")}
              />
            </div>
            {categories.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">{t("svc.category")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  <ChipButton active={!form.categoryId} onClick={() => update({ categoryId: "" })} disabled={loading}>
                    {t("svc.no_category")}
                  </ChipButton>
                  {categories.map((cat) => (
                    <ChipButton key={cat.id} active={form.categoryId === cat.id} onClick={() => update({ categoryId: cat.id })} disabled={loading}>
                      {cat.name}
                    </ChipButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          icon={<Clock className="size-4" />}
          title={t("svc.duration_scheduling")}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">{t("svc.duration")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((d) => (
                  <ChipButton key={d} active={form.durationMinutes === d} onClick={() => update({ durationMinutes: d })} disabled={loading}>
                    {formatDuration(d)}
                  </ChipButton>
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

        <SectionCard
          icon={<CreditCard className="size-4" />}
          title={t("svc.pricing")}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map(({ value, key, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ paymentMode: value })}
                  disabled={loading}
                  className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-medium transition-all ${
                    form.paymentMode === value
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-sm">{icon}</span>
                  {t(key)}
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
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-sm transition-all ${
                      form.staffAssignmentMode === value ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                    } ${loading ? "pointer-events-none opacity-50" : ""}`}
                  >
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

      {/* ROW 2: Toggles + Group participants — all in one compact row */}
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

      {/* ROW 3: Staff selection — full width */}
      {staff.length > 0 && (
        <div className="mt-4">
          <SectionCard
            icon={<Users className="size-4" />}
            title={t("svc.linked_staff")}
            description={t("svc.linked_staff_desc")}
          >
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {staff
                .filter((s) => s.isActive)
                .map((member) => {
                  const isLinked = selectedStaff.has(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleStaff(member.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-start transition-all ${
                        isLinked ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name} className="size-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{member.name}</p>
                        {member.roleTitle && <p className="truncate text-[11px] text-muted-foreground">{member.roleTitle}</p>}
                      </div>
                      {isLinked && (
                        <div className="flex size-4 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="size-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Error + Actions */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard/services")} disabled={loading}>
          {t("common.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
          {isEditing ? t("svc.update") : t("svc.create_service")}
        </Button>
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
