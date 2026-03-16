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
import { createProduct, updateProduct } from "@/actions/products";
import { useT } from "@/lib/i18n/locale-context";
import { Check, Link2, Loader2, Package, Save, ShoppingBag, Star } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/lib/db/schema";

type Product = InferSelectModel<typeof products>;

const CTA_MODES = [
  { value: "NONE" as const, icon: "—" },
  { value: "BOOK_SERVICE" as const, icon: "📅" },
  { value: "EXTERNAL_LINK" as const, icon: "🔗" },
] as const;

interface Props {
  businessId: string;
  product?: Product;
}

export function ProductFormPage({ businessId, product }: Props) {
  const t = useT();
  const router = useRouter();
  const isEditing = !!product;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [ctaMode, setCtaMode] = useState<"BOOK_SERVICE" | "EXTERNAL_LINK" | "NONE">(product?.ctaMode ?? "NONE");
  const [ctaText, setCtaText] = useState(product?.ctaText ?? "");
  const [externalUrl, setExternalUrl] = useState(product?.externalUrl ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? true);
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] ?? "");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setSaved(false);

    const input = {
      title,
      description: description || undefined,
      price: price || undefined,
      images: imageUrl ? [imageUrl] : [],
      category: category || undefined,
      ctaMode,
      ctaText: ctaText || undefined,
      externalUrl: externalUrl || undefined,
      isFeatured,
      isVisible,
    };

    const result = isEditing
      ? await updateProduct(product!.id, businessId, input)
      : await createProduct(businessId, input);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (isEditing) {
      setSaved(true);
      router.refresh();
    } else {
      router.push("/dashboard/products");
      router.refresh();
    }
  }

  return (
    <div className="pb-8">
      {/* ROW 1: 3-column — Details | Image & Category | Pricing & CTA */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard icon={<Package className="size-4" />} title={t("prod.name")}>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm">{t("prod.name")}</Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
                placeholder={t("prod.name_ph")}
                disabled={loading}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">{t("prod.description")}</Label>
              <Textarea
                value={description}
                onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
                placeholder={t("prod.description_ph")}
                disabled={loading}
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm">{t("prod.price")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setSaved(false); }}
                  placeholder="0.00"
                  disabled={loading}
                  className="h-9"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">{t("prod.category")}</Label>
                <Input
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setSaved(false); }}
                  placeholder={t("prod.category_ph")}
                  disabled={loading}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<ShoppingBag className="size-4" />} title={t("prod.image")}>
          <div className="space-y-3">
            <ImageUpload
              value={imageUrl}
              onChange={(url) => { setImageUrl(url); setSaved(false); }}
              folder="products"
              aspectRatio="video"
              className="max-w-[200px]"
              placeholder={t("prod.name_ph")}
            />
          </div>
        </SectionCard>

        <SectionCard icon={<Link2 className="size-4" />} title={t("prod.cta_mode")}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {CTA_MODES.map(({ value, icon }) => {
                const label = value === "NONE" ? t("prod.cta_none") : value === "BOOK_SERVICE" ? t("prod.cta_book") : t("prod.cta_link");
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setCtaMode(value); setSaved(false); }}
                    disabled={loading}
                    className={`flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-medium transition-all ${
                      ctaMode === value
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>

            {ctaMode !== "NONE" && (
              <div className="space-y-1">
                <Label className="text-sm">{t("prod.cta_text")}</Label>
                <Input
                  value={ctaText}
                  onChange={(e) => { setCtaText(e.target.value); setSaved(false); }}
                  placeholder={t("prod.cta_text")}
                  disabled={loading}
                  className="h-9"
                />
              </div>
            )}

            {ctaMode === "EXTERNAL_LINK" && (
              <div className="space-y-1">
                <Label className="text-sm">{t("prod.external_url")}</Label>
                <Input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => { setExternalUrl(e.target.value); setSaved(false); }}
                  placeholder="https://..."
                  disabled={loading}
                  className="h-9"
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ROW 2: Toggles + Actions */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ToggleCard
          label={t("prod.featured")}
          icon={<Star className="size-3.5 text-amber-500" />}
          checked={isFeatured}
          onChange={(v) => { setIsFeatured(v); setSaved(false); }}
          disabled={loading}
        />
        <ToggleCard
          label={t("prod.visible")}
          checked={isVisible}
          onChange={(v) => { setIsVisible(v); setSaved(false); }}
          disabled={loading}
        />

        <Card className="overflow-hidden lg:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-3 p-3">
            {error && <div className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {saved && (
              <div className="flex w-full items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <Check className="size-4" />{t("prod.saved")}
              </div>
            )}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
              {isEditing ? t("common.save") : t("prod.add")}
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/products")} disabled={loading}>
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
          <div className="flex size-6 items-center justify-center rounded-md bg-white text-gray-500 shadow-sm">{icon}</div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function ToggleCard({ label, icon, checked, onChange, disabled }: { label: string; icon?: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-sm font-medium">{label}</p>
        </div>
        <Switch checked={checked} onCheckedChange={(v) => onChange(!!v)} disabled={disabled} />
      </CardContent>
    </Card>
  );
}
