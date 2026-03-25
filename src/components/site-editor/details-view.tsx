"use client";

import { useT } from "@/lib/i18n/locale-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Globe,
  MessageCircle,
  Youtube,
  Linkedin,
  Share2,
  Image,
  Video,
  MessageSquare,
  Search,
} from "lucide-react";
import type { SocialLinks } from "@/lib/db/schema/site-config";

interface DetailsViewProps {
  socialLinks: SocialLinks;
  onSocialChange: (links: SocialLinks) => void;
  seo: { metaTitle: string; metaDescription: string; ogImageUrl: string };
  onSeoChange: (seo: DetailsViewProps["seo"]) => void;
  businessName: string;
  slug: string;
}

const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  labelKey: string;
  placeholder: string;
  Icon: React.ElementType;
  helperKey?: string;
}[] = [
  { key: "instagram", labelKey: "editor.social_instagram", placeholder: "https://instagram.com/yourbusiness", Icon: Image },
  { key: "facebook", labelKey: "editor.social_facebook", placeholder: "https://facebook.com/yourbusiness", Icon: Share2 },
  { key: "tiktok", labelKey: "editor.social_tiktok", placeholder: "https://tiktok.com/@yourbusiness", Icon: Video },
  { key: "twitter", labelKey: "editor.social_twitter", placeholder: "https://x.com/yourbusiness", Icon: MessageSquare },
  { key: "youtube", labelKey: "editor.social_youtube", placeholder: "https://youtube.com/@yourbusiness", Icon: Youtube },
  { key: "linkedin", labelKey: "editor.social_linkedin", placeholder: "https://linkedin.com/company/yourbusiness", Icon: Linkedin },
  { key: "website", labelKey: "editor.social_website", placeholder: "https://yourbusiness.com", Icon: Globe },
  { key: "whatsapp", labelKey: "editor.social_whatsapp", placeholder: "+972501234567", Icon: MessageCircle, helperKey: "editor.whatsapp_helper" },
];

export function DetailsView({
  socialLinks,
  onSocialChange,
  seo,
  onSeoChange,
  businessName,
  slug,
}: DetailsViewProps) {
  const t = useT();

  const handleSocialField = (key: keyof SocialLinks, value: string) => {
    onSocialChange({ ...socialLinks, [key]: value || undefined });
  };

  const displayTitle = seo.metaTitle || businessName;
  const displayDescription = seo.metaDescription || t("pub.default_subtitle");
  const displayUrl = `bookit.co.il/b/${slug}`;

  return (
    <div className="space-y-5">
      {/* Social Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("editor.social_title")}</CardTitle>
          <CardDescription>{t("editor.social_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map(({ key, labelKey, placeholder, Icon, helperKey }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`social-${key}`} className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {t(labelKey as any)}
                </Label>
                <Input
                  id={`social-${key}`}
                  type={key === "whatsapp" ? "tel" : "url"}
                  placeholder={placeholder}
                  value={socialLinks[key] ?? ""}
                  onChange={(e) => handleSocialField(key, e.target.value)}
                />
                {helperKey && (
                  <p className="text-xs text-muted-foreground">{t(helperKey as any)}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4" />
            {t("editor.tab_seo")}
          </CardTitle>
          <CardDescription>{t("editor.seo_desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("editor.meta_title")}</Label>
              <span
                className={`text-xs ${seo.metaTitle.length > 60 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {seo.metaTitle.length}/60
              </span>
            </div>
            <Input
              value={seo.metaTitle}
              onChange={(e) => onSeoChange({ ...seo, metaTitle: e.target.value })}
              placeholder={businessName}
              maxLength={70}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("editor.meta_description")}</Label>
              <span
                className={`text-xs ${seo.metaDescription.length > 160 ? "text-red-500" : "text-muted-foreground"}`}
              >
                {seo.metaDescription.length}/160
              </span>
            </div>
            <Textarea
              value={seo.metaDescription}
              onChange={(e) => onSeoChange({ ...seo, metaDescription: e.target.value })}
              placeholder={t("pub.default_subtitle")}
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("editor.og_image")}</Label>
            <p className="text-xs text-muted-foreground">{t("editor.og_image_hint")}</p>
            <ImageUpload
              value={seo.ogImageUrl}
              onChange={(url) => onSeoChange({ ...seo, ogImageUrl: url })}
              folder="og"
              aspectRatio="video"
            />
          </div>

          {/* Google preview */}
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Globe className="size-4" />
              {t("editor.seo_preview")}
            </p>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="truncate text-sm text-green-700">{displayUrl}</p>
              <p className="mt-1 truncate text-lg font-medium text-blue-700">
                {displayTitle}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
                {displayDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
