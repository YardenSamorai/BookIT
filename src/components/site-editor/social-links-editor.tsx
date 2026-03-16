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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Globe,
  MessageCircle,
  Youtube,
  Linkedin,
  Share2,
  Image,
  Video,
  MessageSquare,
  Loader2,
  Save,
  Check,
} from "lucide-react";
import type { SocialLinks } from "@/lib/db/schema/site-config";
import { updateSocialLinks } from "@/actions/site-editor";

interface SocialLinksEditorProps {
  links: SocialLinks;
  onChange: (links: SocialLinks) => void;
}

const FIELDS: {
  key: keyof SocialLinks;
  labelKey: "editor.social_instagram" | "editor.social_facebook" | "editor.social_tiktok" | "editor.social_twitter" | "editor.social_youtube" | "editor.social_linkedin" | "editor.social_website" | "editor.social_whatsapp";
  placeholder: string;
  Icon: React.ElementType;
  helperKey?: "editor.whatsapp_helper";
}[] = [
  {
    key: "instagram",
    labelKey: "editor.social_instagram",
    placeholder: "https://instagram.com/yourbusiness",
    Icon: Image,
  },
  {
    key: "facebook",
    labelKey: "editor.social_facebook",
    placeholder: "https://facebook.com/yourbusiness",
    Icon: Share2,
  },
  {
    key: "tiktok",
    labelKey: "editor.social_tiktok",
    placeholder: "https://tiktok.com/@yourbusiness",
    Icon: Video,
  },
  {
    key: "twitter",
    labelKey: "editor.social_twitter",
    placeholder: "https://x.com/yourbusiness",
    Icon: MessageSquare,
  },
  {
    key: "youtube",
    labelKey: "editor.social_youtube",
    placeholder: "https://youtube.com/@yourbusiness",
    Icon: Youtube,
  },
  {
    key: "linkedin",
    labelKey: "editor.social_linkedin",
    placeholder: "https://linkedin.com/company/yourbusiness",
    Icon: Linkedin,
  },
  {
    key: "website",
    labelKey: "editor.social_website",
    placeholder: "https://yourbusiness.com",
    Icon: Globe,
  },
  {
    key: "whatsapp",
    labelKey: "editor.social_whatsapp",
    placeholder: "+972501234567",
    Icon: MessageCircle,
    helperKey: "editor.whatsapp_helper",
  },
];

export function SocialLinksEditor({ links, onChange }: SocialLinksEditorProps) {
  const t = useT();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof SocialLinks, value: string) => {
    onChange({ ...links, [key]: value || undefined });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const result = await updateSocialLinks(links);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editor.social_title")}</CardTitle>
        <CardDescription>
          {t("editor.social_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, labelKey, placeholder, Icon, helperKey }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2">
                <Icon className="size-4" />
                {t(labelKey)}
              </Label>
              <Input
                id={key}
                type={key === "whatsapp" ? "tel" : "url"}
                placeholder={placeholder}
                value={links[key] ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
              />
              {helperKey && (
                <p className="text-xs text-muted-foreground">{t(helperKey)}</p>
              )}
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="me-2 size-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : saved ? (
            <>
              <Check className="me-2 size-4" />
              {t("common.saved")}
            </>
          ) : (
            <>
              <Save className="me-2 size-4" />
              {t("common.save")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
