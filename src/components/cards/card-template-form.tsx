"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Scissors, Settings, Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createCardTemplate, updateCardTemplate } from "@/actions/cards";
import { useT } from "@/lib/i18n/locale-context";

interface Service {
  id: string;
  title: string;
  durationMinutes: number;
  price: string | null;
  isGroup?: boolean;
}

interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  sessionCount: number;
  price: string;
  expirationDays: number | null;
  isActive: boolean;
  isPurchasable: boolean;
  restoreOnLateCancel: boolean;
  restoreOnNoShow: boolean;
  displayOrder: number;
  services: Array<{ serviceId: string; serviceName: string }>;
}

interface CardTemplateFormProps {
  businessId: string;
  services: Service[];
  template?: TemplateData | null;
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b bg-gray-50/60 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-md bg-white text-gray-500 shadow-sm">
            {icon}
          </div>
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export function CardTemplateForm({
  businessId,
  services,
  template,
}: CardTemplateFormProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const isEdit = !!template;

  const [form, setForm] = useState({
    name: template?.name ?? "",
    description: template?.description ?? "",
    sessionCount: template?.sessionCount ?? 10,
    price: template?.price ?? "",
    expirationDays: template?.expirationDays ?? 0,
    isActive: template?.isActive ?? true,
    isPurchasable: template?.isPurchasable ?? false,
    restoreOnLateCancel: template?.restoreOnLateCancel ?? false,
    restoreOnNoShow: template?.restoreOnNoShow ?? false,
    displayOrder: template?.displayOrder ?? 0,
    serviceIds: template?.services.map((s) => s.serviceId) ?? [],
  });

  function toggleService(serviceId: string) {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);

    startTransition(async () => {
      const input = {
        name: form.name,
        description: form.description || undefined,
        sessionCount: form.sessionCount,
        price: form.price,
        expirationDays: form.expirationDays || undefined,
        serviceIds: form.serviceIds,
        isActive: form.isActive,
        isPurchasable: form.isPurchasable,
        restoreOnLateCancel: form.restoreOnLateCancel,
        restoreOnNoShow: form.restoreOnNoShow,
        displayOrder: form.displayOrder,
      };

      const result = isEdit
        ? await updateCardTemplate(template!.id, input)
        : await createCardTemplate(input);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (isEdit) {
        setSaved(true);
      } else {
        router.push("/dashboard/packages");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <SectionCard
          icon={<CreditCard className="size-4" />}
          title={t("card.name")}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("card.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={t("card.name_ph")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t("card.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder={t("card.description_ph")}
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("card.session_count")}</Label>
                <Input
                  type="number"
                  min={2}
                  max={200}
                  value={form.sessionCount}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sessionCount: parseInt(e.target.value) || 2,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("card.total_price")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("card.expiration")}</Label>
              <Input
                type="number"
                min={0}
                value={form.expirationDays}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expirationDays: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                {t("card.expiration_help")}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("card.display_order")}</Label>
              <Input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    displayOrder: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        </SectionCard>

        {/* Services */}
        <SectionCard
          icon={<Scissors className="size-4" />}
          title={t("card.services_covered")}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t("card.services_selected", {
                  n: String(form.serviceIds.length),
                })}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("card.services_covered_help")}
            </p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-md border p-2">
              {services.map((svc) => {
                const checked = form.serviceIds.includes(svc.id);
                return (
                  <label
                    key={svc.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                      checked
                        ? "bg-primary/5 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(svc.id)}
                      className="size-4 rounded border-gray-300"
                    />
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md" style={{
                      backgroundColor: svc.isGroup ? "#ede9fe" : "#f0f9ff",
                    }}>
                      {svc.isGroup
                        ? <Dumbbell className="size-3.5 text-violet-600" />
                        : <Scissors className="size-3.5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {svc.title}
                        </p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                          svc.isGroup
                            ? "bg-violet-100 text-violet-700"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {svc.isGroup ? t("card.type_class" as never) : t("card.type_service" as never)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {svc.durationMinutes} min
                        {svc.price ? ` · ₪${svc.price}` : ""}
                      </p>
                    </div>
                  </label>
                );
              })}
              {services.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {t("card.select_service")}
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Settings */}
      <SectionCard
        icon={<Settings className="size-4" />}
        title={t("card.settings")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("card.is_active")}</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, isActive: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t("card.is_purchasable")}</p>
            </div>
            <Switch
              checked={form.isPurchasable}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, isPurchasable: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {t("card.restore_late_cancel")}
              </p>
            </div>
            <Switch
              checked={form.restoreOnLateCancel}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, restoreOnLateCancel: v }))
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                {t("card.restore_no_show")}
              </p>
            </div>
            <Switch
              checked={form.restoreOnNoShow}
              onCheckedChange={(v) =>
                setForm((p) => ({ ...p, restoreOnNoShow: v }))
              }
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("card.restore_help")}
        </p>
      </SectionCard>

      {/* Actions */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          {error && (
            <p className="flex-1 text-sm text-red-600">{error}</p>
          )}
          {saved && (
            <p className="flex-1 text-sm text-green-600">
              {t("common.saved")}
            </p>
          )}
          {!error && !saved && <div className="flex-1" />}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/packages")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {isEdit ? t("card.save") : t("card.create")}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
