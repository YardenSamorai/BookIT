"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createService, updateService } from "@/actions/services";
import { ImageUpload } from "@/components/shared/image-upload";
import type { ServiceInput } from "@/validators/service";
import type { InferSelectModel } from "drizzle-orm";
import type { serviceCategories } from "@/lib/db/schema";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import type { TranslationKey } from "@/lib/i18n";

type Category = InferSelectModel<typeof serviceCategories>;

const PAYMENT_MODE_KEYS: Record<string, TranslationKey> = {
  FULL: "svc.pay_full",
  DEPOSIT: "svc.pay_deposit",
  ON_SITE: "svc.pay_on_site",
  CONTACT_FOR_PRICE: "svc.pay_contact",
  FREE: "svc.pay_free",
};

interface ServiceFormProps {
  categories: Category[];
  defaultValues?: ServiceInput & { id?: string };
  onSuccess: () => void;
}

export function ServiceForm({ categories, defaultValues, onSuccess }: ServiceFormProps) {
  const t = useT();
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
    cancelHoursBefore: defaultValues?.cancelHoursBefore ?? 0,
    rescheduleHoursBefore: defaultValues?.rescheduleHoursBefore ?? 0,
    isGroup: defaultValues?.isGroup ?? false,
    maxParticipants: defaultValues?.maxParticipants ?? 1,
    blocksAllStaff: defaultValues?.blocksAllStaff ?? false,
    isActive: defaultValues?.isActive ?? true,
  });

  function update(patch: Partial<ServiceInput>) {
    setForm((prev) => ({ ...prev, ...patch }));
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

    setLoading(false);
    onSuccess();
  }

  return (
    <div className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
      <div className="space-y-2">
        <Label>{t("svc.service_title")}</Label>
        <Input
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder={t("svc.service_title_ph")}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("svc.service_image")}</Label>
        <ImageUpload
          value={form.imageUrl ?? ""}
          onChange={(url) => update({ imageUrl: url })}
          folder="services"
          aspectRatio="video"
          className="max-w-xs"
          placeholder={t("svc.upload_image")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("svc.description")}</Label>
        <Input
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={t("svc.description_ph")}
          disabled={loading}
        />
      </div>

      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>{t("svc.category")}</Label>
          <Select
            value={form.categoryId || undefined}
            onValueChange={(v) => update({ categoryId: (v ?? "") as string })}
          >
            <SelectTrigger>
              <span>
                {form.categoryId
                  ? categories.find((c) => c.id === form.categoryId)?.name ?? t("svc.no_category")
                  : t("svc.no_category")}
              </span>
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("svc.duration_minutes")}</Label>
          <Input
            type="number"
            min={5}
            max={480}
            value={form.durationMinutes}
            onChange={(e) => update({ durationMinutes: Number(e.target.value) })}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("svc.buffer_minutes")}</Label>
          <Input
            type="number"
            min={0}
            max={120}
            value={form.bufferMinutes ?? 0}
            onChange={(e) => update({ bufferMinutes: Number(e.target.value) })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("svc.payment_mode")}</Label>
        <Select
          value={form.paymentMode}
          onValueChange={(v) =>
            v && update({ paymentMode: v as ServiceInput["paymentMode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYMENT_MODE_KEYS).map(([value, key]) => (
              <SelectItem key={value} value={value}>
                {t(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(form.paymentMode === "FULL" || form.paymentMode === "ON_SITE") && (
        <div className="space-y-2">
          <Label>{t("svc.price")}</Label>
          <Input
            value={form.price}
            onChange={(e) => update({ price: e.target.value })}
            placeholder="0.00"
            disabled={loading}
          />
        </div>
      )}

      {form.paymentMode === "DEPOSIT" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("svc.full_price")}</Label>
            <Input
              value={form.price}
              onChange={(e) => update({ price: e.target.value })}
              placeholder="0.00"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("svc.deposit_amount")}</Label>
            <Input
              value={form.depositAmount}
              onChange={(e) => update({ depositAmount: e.target.value })}
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("svc.approval")}</Label>
          <Select
            value={form.approvalType}
            onValueChange={(v) =>
              v && update({ approvalType: v as "AUTO" | "MANUAL" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">{t("svc.auto_approve")}</SelectItem>
              <SelectItem value="MANUAL">{t("svc.manual_approve")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("svc.staff_assignment")}</Label>
          <Select
            value={form.staffAssignmentMode}
            onValueChange={(v) =>
              v && update({ staffAssignmentMode: v as "SPECIFIC" | "LIST" | "ANY" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">{t("svc.staff_any")}</SelectItem>
              <SelectItem value="LIST">{t("svc.staff_customer_picks")}</SelectItem>
              <SelectItem value="SPECIFIC">{t("svc.staff_specific")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={form.isActive}
          onCheckedChange={(checked) => update({ isActive: !!checked })}
          disabled={loading}
        />
        <Label>{t("common.active")}</Label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading && <Loader2 className="me-2 size-4 animate-spin" />}
        {isEditing ? t("svc.update") : t("svc.create_service")}
      </Button>
    </div>
  );
}
