"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Images, Plus, Trash2 } from "lucide-react";

interface GalleryImage {
  url: string;
  caption: string;
}

interface GallerySectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
  maxImages?: number;
}

function parseImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return {
      url: String(o?.url ?? ""),
      caption: String(o?.caption ?? ""),
    };
  });
}

const LAYOUT_LABELS = {
  grid: "gallery_editor.grid",
  masonry: "gallery_editor.masonry",
  carousel: "gallery_editor.carousel",
} as const;

const SPEED_LABELS = {
  slow: "gallery_editor.speed_slow",
  normal: "gallery_editor.speed_normal",
  fast: "gallery_editor.speed_fast",
} as const;

export function GallerySectionEditor({ content, onChange, maxImages = 50 }: GallerySectionEditorProps) {
  const t = useT();
  const rawImages = content.images;
  const images = useMemo(() => parseImages(rawImages), [rawImages]);

  const marquee = content.marquee === true;
  const layout = (content.layout as string) ?? "grid";
  const speed = (content.marquee_speed as string) ?? "normal";

  const updateImages = (next: GalleryImage[]) => {
    onChange({ images: next });
  };

  const updateImage = (index: number, patch: Partial<GalleryImage>) => {
    const next = [...images];
    next[index] = { ...next[index], ...patch };
    updateImages(next);
  };

  const removeImage = (index: number) => {
    updateImages(images.filter((_, i) => i !== index));
  };

  const addImage = () => {
    if (images.length >= maxImages) return;
    updateImages([...images, { url: "", caption: "" }]);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("gallery_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("gallery_editor.title_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("gallery_editor.subtitle")}</Label>
        <Input
          value={(content.subtitle as string) ?? ""}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={t("gallery_editor.subtitle_ph")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("gallery_editor.layout")}</Label>
        <Select
          value={layout}
          onValueChange={(v) => v && onChange({ layout: v })}
        >
          <SelectTrigger>
            <span>{t((LAYOUT_LABELS as Record<string, string>)[layout] as any ?? "gallery_editor.grid")}</span>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="grid">{t("gallery_editor.grid")}</SelectItem>
            <SelectItem value="masonry">{t("gallery_editor.masonry")}</SelectItem>
            <SelectItem value="carousel">{t("gallery_editor.carousel")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("gallery_editor.columns")}</Label>
        <Select
          value={String(content.columns ?? 3)}
          onValueChange={(v) => onChange({ columns: Number(v) })}
        >
          <SelectTrigger>
            <span>{String(content.columns ?? 3)}</span>
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label>{t("gallery_editor.marquee")}</Label>
            <p className="text-xs text-muted-foreground">{t("gallery_editor.marquee_desc")}</p>
          </div>
          <Switch
            checked={marquee}
            onCheckedChange={(checked) => onChange({ marquee: checked })}
          />
        </div>
      </div>

      {marquee && (
        <div className="space-y-2">
          <Label>{t("gallery_editor.speed")}</Label>
          <Select
            value={speed}
            onValueChange={(v) => v && onChange({ marquee_speed: v })}
          >
            <SelectTrigger>
              <span>{t((SPEED_LABELS as Record<string, string>)[speed] as any ?? "gallery_editor.speed_normal")}</span>
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="slow">{t("gallery_editor.speed_slow")}</SelectItem>
              <SelectItem value="normal">{t("gallery_editor.speed_normal")}</SelectItem>
              <SelectItem value="fast">{t("gallery_editor.speed_fast")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("gallery_editor.images")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImage}
            disabled={images.length >= maxImages}
          >
            <Plus className="me-1 size-4" />
            {t("gallery_editor.add_image")}
          </Button>
        </div>

        <div className="space-y-4">
          {images.map((img, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-lg border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <ImageUpload
                    value={img.url}
                    onChange={(url) => updateImage(index, { url })}
                    folder="gallery"
                    aspectRatio="square"
                    placeholder={t("gallery_editor.upload_n", { n: index + 1 })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImage(index)}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("gallery_editor.caption")}</Label>
                <Input
                  value={img.caption}
                  onChange={(e) => updateImage(index, { caption: e.target.value })}
                  placeholder={t("gallery_editor.caption_ph")}
                />
              </div>
            </div>
          ))}
        </div>

        {images.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-6 text-center">
            <Images className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium">{t("empty.gallery_title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("empty.gallery_desc")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
