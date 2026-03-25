"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, AlignLeft, GalleryHorizontal, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

interface ProductItem {
  id: string;
  title: string;
  images?: string[] | null;
  price?: string | null;
}

interface ProductsSectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  products: ProductItem[];
}

const LAYOUTS = [
  { value: "cards", icon: LayoutGrid, labelKey: "products_editor.layout_cards", descKey: "products_editor.layout_cards_desc" },
  { value: "list", icon: List, labelKey: "products_editor.layout_list", descKey: "products_editor.layout_list_desc" },
  { value: "minimal", icon: AlignLeft, labelKey: "products_editor.layout_minimal", descKey: "products_editor.layout_minimal_desc" },
  { value: "carousel", icon: GalleryHorizontal, labelKey: "products_editor.layout_carousel", descKey: "products_editor.layout_carousel_desc" },
] as const;

export function ProductsSectionEditor({ content, onChange, products }: ProductsSectionEditorProps) {
  const t = useT();
  const layout = (content.layout as string) ?? "cards";
  const showPrices = content.show_prices !== false;
  const showDescriptions = content.show_descriptions !== false;
  const showImages = content.show_images !== false;

  const savedOrder = Array.isArray(content.product_order) ? (content.product_order as string[]) : null;

  const orderedProducts = useMemo(() => {
    if (!savedOrder || savedOrder.length === 0) return products;
    const byId = new Map(products.map((p) => [p.id, p]));
    const ordered: ProductItem[] = [];
    for (const id of savedOrder) {
      const p = byId.get(id);
      if (p) {
        ordered.push(p);
        byId.delete(id);
      }
    }
    for (const p of byId.values()) ordered.push(p);
    return ordered;
  }, [products, savedOrder]);

  const moveProduct = (fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= orderedProducts.length) return;
    const ids = orderedProducts.map((p) => p.id);
    [ids[fromIdx], ids[toIdx]] = [ids[toIdx], ids[fromIdx]];
    onChange({ product_order: ids });
  };

  return (
    <div className="space-y-6">
      {/* ── Text ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("products_editor.text" as any)}
        </p>
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label>{t("products_editor.heading" as any)}</Label>
            <Input
              value={(content.heading as string) ?? ""}
              onChange={(e) => onChange({ heading: e.target.value })}
              placeholder={t("products_editor.heading_ph" as any)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("products_editor.subtitle" as any)}</Label>
            <Input
              value={(content.subtitle as string) ?? ""}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder={t("products_editor.subtitle_ph" as any)}
            />
          </div>
        </div>
      </div>

      {/* ── Layout Picker ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("products_editor.layout" as any)}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUTS.map(({ value, icon: Icon, labelKey, descKey }) => {
            const active = layout === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ layout: value })}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3.5 text-center transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                )}
              >
                <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                  {t(labelKey as any)}
                </span>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {t(descKey as any)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("products_editor.appearance" as any)}
        </p>
        <div className="space-y-0 divide-y rounded-lg border">
          {layout === "cards" && (
            <div className="flex items-center justify-between px-4 py-3">
              <Label className="text-sm font-normal">{t("products_editor.columns" as any)}</Label>
              <Select
                value={String(content.columns ?? 4)}
                onValueChange={(v) => onChange({ columns: Number(v) })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {layout !== "minimal" && (
            <div className="flex items-center justify-between px-4 py-3">
              <Label htmlFor="prod-show-images" className="text-sm font-normal">
                {t("products_editor.show_images" as any)}
              </Label>
              <Switch
                id="prod-show-images"
                checked={showImages}
                onCheckedChange={(v) => onChange({ show_images: !!v })}
              />
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3">
            <Label htmlFor="prod-show-prices" className="text-sm font-normal">
              {t("products_editor.show_prices" as any)}
            </Label>
            <Switch
              id="prod-show-prices"
              checked={showPrices}
              onCheckedChange={(v) => onChange({ show_prices: !!v })}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <Label htmlFor="prod-show-desc" className="text-sm font-normal">
              {t("products_editor.show_descriptions" as any)}
            </Label>
            <Switch
              id="prod-show-desc"
              checked={showDescriptions}
              onCheckedChange={(v) => onChange({ show_descriptions: !!v })}
            />
          </div>
        </div>
      </div>

      {/* ── Product Order ── */}
      {orderedProducts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("products_editor.order" as any)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("products_editor.order_desc" as any)}
          </p>
          <div className="space-y-1 rounded-lg border p-2">
            {orderedProducts.map((product, idx) => (
              <div
                key={product.id}
                className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2"
              >
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />

                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt=""
                    className="size-8 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                    {product.title.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.title}</p>
                  {product.price && (
                    <p className="text-xs text-muted-foreground">₪{product.price}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={idx === 0}
                    onClick={() => moveProduct(idx, -1)}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={idx === orderedProducts.length - 1}
                    onClick={() => moveProduct(idx, 1)}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t("summary.auto_products" as any)}
      </p>
    </div>
  );
}
