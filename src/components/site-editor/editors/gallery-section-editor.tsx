"use client";

import { useMemo } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Images, Plus, Trash2 } from "lucide-react";

interface GalleryImage {
  url: string;
  caption: string;
}

interface GallerySectionEditorProps {
  content: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

const MAX_IMAGES = 8;

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

export function GallerySectionEditor({ content, onChange }: GallerySectionEditorProps) {
  const t = useT();
  const rawImages = content.images;
  const images = useMemo(() => parseImages(rawImages), [rawImages]);

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
    if (images.length >= MAX_IMAGES) return;
    updateImages([...images, { url: "", caption: "" }]);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("gallery_editor.title")}</Label>
        <Input
          value={(content.title as string) ?? "Our Work"}
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
          value={(content.layout as string) ?? "grid"}
          onValueChange={(v) => v && onChange({ layout: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("gallery_editor.images")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImage}
            disabled={images.length >= MAX_IMAGES}
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
