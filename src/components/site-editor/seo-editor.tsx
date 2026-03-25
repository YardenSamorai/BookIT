"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/locale-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/shared/image-upload";
import { Loader2, Save, Check, Search, Globe } from "lucide-react";
import { updateSiteSeo } from "@/actions/site-editor";

interface SeoEditorProps {
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  businessName: string;
  slug: string;
}

export function SeoEditor({
  metaTitle: initialTitle,
  metaDescription: initialDesc,
  ogImageUrl: initialOg,
  businessName,
  slug,
}: SeoEditorProps) {
  const t = useT();
  const [metaTitle, setMetaTitle] = useState(initialTitle);
  const [metaDescription, setMetaDescription] = useState(initialDesc);
  const [ogImageUrl, setOgImageUrl] = useState(initialOg);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateSiteSeo({ metaTitle, metaDescription, ogImageUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const displayTitle = metaTitle || businessName;
  const displayDescription =
    metaDescription || t("pub.default_subtitle");
  const displayUrl = `bookit.co.il/b/${slug}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5" />
            {t("editor.tab_seo")}
          </CardTitle>
          <CardDescription>{t("editor.seo_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("editor.meta_title")}</Label>
              <span
                className={`text-xs ${metaTitle.length > 60 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {metaTitle.length}/60
              </span>
            </div>
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={businessName}
              maxLength={70}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("editor.meta_description")}</Label>
              <span
                className={`text-xs ${metaDescription.length > 160 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {metaDescription.length}/160
              </span>
            </div>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={t("pub.default_subtitle")}
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("editor.og_image")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("editor.og_image_hint")}
            </p>
            <ImageUpload
              value={ogImageUrl}
              onChange={setOgImageUrl}
              folder="og"
              aspectRatio="video"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="size-4" />
            {t("editor.seo_preview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="truncate text-sm text-green-700">{displayUrl}</p>
            <p className="mt-1 truncate text-lg font-medium text-blue-700 hover:underline">
              {displayTitle}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
              {displayDescription}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : saved ? (
          <Check className="mr-2 size-4" />
        ) : (
          <Save className="mr-2 size-4" />
        )}
        {saved ? t("editor.seo_saved") : t("editor.save_seo")}
      </Button>
    </div>
  );
}
