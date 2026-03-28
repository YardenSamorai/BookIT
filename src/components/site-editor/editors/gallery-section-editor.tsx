"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { useT } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { uploadFile } from "@/lib/storage/upload";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from "@/lib/storage/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Images, Plus, Trash2, ImagePlus, Loader2, X } from "lucide-react";

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
  const alternateDir = content.marquee_alternate !== false;

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
        <>
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

          <div className="flex items-center justify-between">
            <div>
              <Label>{t("gallery_editor.alternate_dir" as any)}</Label>
              <p className="text-xs text-muted-foreground">{t("gallery_editor.alternate_dir_desc" as any)}</p>
            </div>
            <Switch
              checked={alternateDir}
              onCheckedChange={(checked) => onChange({ marquee_alternate: checked })}
            />
          </div>
        </>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("gallery_editor.images")} ({images.length}/{maxImages})</Label>
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

        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <GalleryThumb
                key={index}
                img={img}
                index={index}
                onUpdate={updateImage}
                onRemove={removeImage}
                t={t}
              />
            ))}
          </div>
        ) : (
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

function GalleryThumb({
  img,
  index,
  onUpdate,
  onRemove,
  t,
}: {
  img: GalleryImage;
  index: number;
  onUpdate: (index: number, patch: Partial<GalleryImage>) => void;
  onRemove: (index: number) => void;
  t: ReturnType<typeof useT>;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, "gallery");
      onUpdate(index, { url: result.url });
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  }, [index, onUpdate]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="group relative">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); if (inputRef.current) inputRef.current.value = ""; }}
        className="hidden"
      />

      {img.url ? (
        <div
          className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <img src={img.url} alt={img.caption} className="size-full object-cover" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
            className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-3" />
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary/50 hover:bg-muted/50"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground/50" />
          )}
        </div>
      )}

      <Input
        value={img.caption}
        onChange={(e) => onUpdate(index, { caption: e.target.value })}
        placeholder={t("gallery_editor.caption_ph")}
        className="mt-1 h-7 text-xs"
      />
    </div>
  );
}
