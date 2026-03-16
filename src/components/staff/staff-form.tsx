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
    roleTitle: defaultValues?.roleTitle ?? "",
    bio: defaultValues?.bio ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
    isActive: defaultValues?.isActive ?? true,
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
