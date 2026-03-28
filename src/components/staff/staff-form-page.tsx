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
import { createStaffMember, updateStaffMember } from "@/actions/staff";
import { useT } from "@/lib/i18n/locale-context";
import { Bell, Check, Loader2, Phone, Save, User, Camera, FileText } from "lucide-react";
import type { StaffMemberInput } from "@/validators/staff";

interface Props {
  defaultValues?: StaffMemberInput & { id?: string };
}

export function StaffFormPage({ defaultValues }: Props) {
  const t = useT();
  const router = useRouter();
  const isEditing = !!defaultValues?.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<StaffMemberInput>({
    name: defaultValues?.name ?? "",
    phone: defaultValues?.phone ?? "",
    notifyOwner: defaultValues?.notifyOwner ?? true,
    roleTitle: defaultValues?.roleTitle ?? "",
    bio: defaultValues?.bio ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
    isActive: defaultValues?.isActive ?? true,
  });

  function update(patch: Partial<StaffMemberInput>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setSaved(false);

    const result = isEditing
      ? await updateStaffMember(defaultValues!.id!, form)
      : await createStaffMember(form);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (isEditing) {
      setSaved(true);
      router.refresh();
    } else {
      router.push("/dashboard/staff");
      router.refresh();
    }
  }

  return (
    <div className="pb-8">
      {/* ROW 1: 3-column — Basic Info | Photo | Bio */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard icon={<User className="size-4" />} title={t("staff.basic_info")}>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">{t("staff.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={t("staff.name_ph")}
                disabled={loading}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("staff.role")}</Label>
              <Input
                value={form.roleTitle}
                onChange={(e) => update({ roleTitle: e.target.value })}
                placeholder={t("staff.role_ph")}
                disabled={loading}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("staff.phone")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder={t("staff.phone_ph")}
                disabled={loading}
                className="h-9"
                dir="ltr"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">{t("staff.phone_hint")}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Camera className="size-4" />} title={t("staff.photo")}>
          <ImageUpload
            value={form.imageUrl ?? ""}
            onChange={(url) => update({ imageUrl: url })}
            folder="staff"
            aspectRatio="square"
            placeholder={t("staff.upload_photo")}
            className="max-w-[160px]"
          />
        </SectionCard>

        <SectionCard icon={<FileText className="size-4" />} title={t("staff.bio")}>
          <Textarea
            value={form.bio}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder={t("staff.bio_ph")}
            disabled={loading}
            rows={5}
            maxLength={500}
          />
        </SectionCard>
      </div>

      {/* ROW 2: Notifications */}
      {form.phone && form.phone.length >= 9 && (
        <div className="mt-4">
          <SectionCard icon={<Bell className="size-4" />} title={t("staff.notifications")}>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("staff.notify_desc")}</p>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t("staff.notify_owner_label")}</p>
                  <p className="text-xs text-muted-foreground">{t("staff.notify_owner_desc")}</p>
                </div>
                <Switch
                  checked={form.notifyOwner}
                  onCheckedChange={(checked) => update({ notifyOwner: !!checked })}
                  disabled={loading}
                />
              </div>
              {!form.notifyOwner && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {t("staff.notify_owner_warning")}
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ROW 3: Toggle + Actions */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center justify-between gap-2 p-3">
            <p className="text-sm font-medium">{t("common.active")}</p>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => update({ isActive: !!checked })}
              disabled={loading}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-3 p-3">
            {error && (
              <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {saved && (
              <div className="flex w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <Check className="size-4" />
                {t("staff.schedule_saved")}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
              {isEditing ? t("staff.update") : t("staff.add_member")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/staff")} disabled={loading}>
              {t("common.cancel")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-gray-50/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-white text-gray-500 shadow-sm">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}
