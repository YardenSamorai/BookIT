"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createStaffMember, updateStaffMember } from "@/actions/staff";
import { ImageUpload } from "@/components/shared/image-upload";
import type { StaffMemberInput } from "@/validators/staff";
import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import { STAFF_CALENDAR_COLOR_PRESETS } from "@/components/calendar/calendar-types";

interface StaffFormProps {
  onSuccess: () => void;
  defaultValues?: StaffMemberInput & { id?: string };
}

export function StaffForm({ onSuccess, defaultValues }: StaffFormProps) {
  const t = useT();
  const isEditing = !!defaultValues?.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<StaffMemberInput>({
    name: defaultValues?.name ?? "",
    phone: defaultValues?.phone ?? "",
    notifyOwner: defaultValues?.notifyOwner ?? true,
    roleTitle: defaultValues?.roleTitle ?? "",
    bio: defaultValues?.bio ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
    isActive: defaultValues?.isActive ?? true,
    calendarColor: defaultValues?.calendarColor ?? "",
  });

  function update(patch: Partial<StaffMemberInput>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const result = isEditing
      ? await updateStaffMember(defaultValues!.id!, form)
      : await createStaffMember(form);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("staff.name")}</Label>
        <Input
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder={t("staff.name_ph")}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("staff.role")}</Label>
        <Input
          value={form.roleTitle}
          onChange={(e) => update({ roleTitle: e.target.value })}
          placeholder={t("staff.role_ph")}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("staff.phone")}</Label>
        <Input
          value={form.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder={t("staff.phone_ph")}
          disabled={loading}
          dir="ltr"
          type="tel"
        />
        <p className="text-xs text-muted-foreground">{t("staff.phone_hint")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("staff.photo")}</Label>
        <ImageUpload
          value={form.imageUrl ?? ""}
          onChange={(url) => update({ imageUrl: url })}
          folder="staff"
          aspectRatio="square"
          placeholder={t("staff.upload_photo")}
          className="max-w-[160px]"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("staff.bio")}</Label>
        <Input
          value={form.bio}
          onChange={(e) => update({ bio: e.target.value })}
          placeholder={t("staff.bio_ph")}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("staff.calendar_color")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("staff.calendar_color_hint")}
        </p>
        <div className="flex flex-wrap gap-2">
          {STAFF_CALENDAR_COLOR_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              disabled={loading}
              title={hex}
              onClick={() => update({ calendarColor: hex })}
              className={cn(
                "size-8 rounded-full border-2 shadow-sm transition-transform hover:scale-105 disabled:opacity-50",
                form.calendarColor === hex
                  ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : "border-white/90"
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => update({ calendarColor: "" })}
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 border-dashed text-muted-foreground transition-colors hover:bg-muted/80 disabled:opacity-50",
              !form.calendarColor
                ? "border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background"
                : "border-muted-foreground/40"
            )}
            title={t("staff.calendar_color_auto")}
          >
            <span className="text-xs font-semibold leading-none">·</span>
          </button>
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
        {isEditing ? t("staff.update") : t("staff.add_member")}
      </Button>
    </div>
  );
}
