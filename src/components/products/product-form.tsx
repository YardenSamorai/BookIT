"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/shared/image-upload";
import { createProduct, updateProduct } from "@/actions/products";
import { useT } from "@/lib/i18n/locale-context";
import { Loader2 } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";
import type { products } from "@/lib/db/schema";

type Product = InferSelectModel<typeof products>;

interface ProductFormProps {
  businessId: string;
  product?: Product;
  onSuccess?: () => void;
}

export function ProductForm({ businessId, product, onSuccess }: ProductFormProps) {
  const t = useT();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [ctaMode, setCtaMode] = useState<"BOOK_SERVICE" | "EXTERNAL_LINK" | "NONE">(
    product?.ctaMode ?? "NONE"
  );
  const [ctaText, setCtaText] = useState(product?.ctaText ?? "");
  const [externalUrl, setExternalUrl] = useState(product?.externalUrl ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isVisible, setIsVisible] = useState(product?.isVisible ?? true);
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

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

    const result = product
      ? await updateProduct(product.id, businessId, input)
      : await createProduct(businessId, input);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("prod.name")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("prod.name_ph")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t("prod.description")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("prod.description_ph")}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("prod.price")}</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("prod.category")}</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("prod.category_ph")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("prod.image")}</Label>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          folder="products"
          aspectRatio="video"
          placeholder={t("prod.name_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("prod.cta_mode")}</Label>
        <Select value={ctaMode} onValueChange={(v) => setCtaMode(v as typeof ctaMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">{t("prod.cta_none")}</SelectItem>
            <SelectItem value="BOOK_SERVICE">{t("prod.cta_book")}</SelectItem>
            <SelectItem value="EXTERNAL_LINK">{t("prod.cta_link")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {ctaMode !== "NONE" && (
        <div className="space-y-2">
          <Label>{t("prod.cta_text")}</Label>
          <Input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder={t("prod.cta_text")}
          />
        </div>
      )}

      {ctaMode === "EXTERNAL_LINK" && (
        <div className="space-y-2">
          <Label>{t("prod.external_url")}</Label>
          <Input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label className="cursor-pointer">{t("prod.featured")}</Label>
        <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label className="cursor-pointer">{t("prod.visible")}</Label>
        <Switch checked={isVisible} onCheckedChange={setIsVisible} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="me-2 size-4 animate-spin" />}
          {product ? t("common.save") : t("prod.add")}
        </Button>
      </div>
    </form>
  );
}
