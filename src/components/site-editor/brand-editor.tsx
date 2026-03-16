"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import { ColorPicker } from "@/components/onboarding/color-picker";
import { updateSiteBrand, toggleSitePublished } from "@/actions/site-editor";
import { Globe, Loader2, Save } from "lucide-react";

interface BrandEditorProps {
  brand: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    coverImageUrl: string;
  };
  updateBrand: (patch: Partial<BrandEditorProps["brand"]>) => void;
  published: boolean;
}

export function BrandEditor({ brand, updateBrand, published: initialPublished }: BrandEditorProps) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(initialPublished);
  const [toggling, setToggling] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    const result = await updateSiteBrand(brand);
    if (!result.success) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleTogglePublish(checked: boolean) {
    setToggling(true);
    const result = await toggleSitePublished(!!checked);
    if (result.success) {
      setPublished(!!checked);
    }
    setToggling(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("editor.site_status")}</CardTitle>
              <CardDescription>{t("editor.site_status_desc")}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={published}
                onCheckedChange={handleTogglePublish}
                disabled={toggling}
              />
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Globe className="size-4" />
                {published ? t("editor.published") : t("editor.draft")}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("editor.logo")}</CardTitle>
          <CardDescription>{t("editor.logo_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={brand.logoUrl}
            onChange={(url) => updateBrand({ logoUrl: url })}
            folder="logos"
            aspectRatio="square"
            placeholder={t("editor.upload_logo")}
            className="max-w-[200px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("editor.hero_banner")}</CardTitle>
          <CardDescription>
            {t("editor.hero_banner_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={brand.coverImageUrl}
            onChange={(url) => updateBrand({ coverImageUrl: url })}
            folder="covers"
            aspectRatio="banner"
            placeholder={t("editor.upload_hero")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("editor.brand_colors")}</CardTitle>
          <CardDescription>
            {t("editor.brand_colors_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorPicker
              label={t("editor.primary_color")}
              value={brand.primaryColor}
              onChange={(v) => updateBrand({ primaryColor: v })}
            />
            <ColorPicker
              label={t("editor.secondary_color")}
              value={brand.secondaryColor}
              onChange={(v) => updateBrand({ secondaryColor: v })}
            />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{t("editor.brand_saved")}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
        {t("editor.save_brand")}
      </Button>
    </div>
  );
}
