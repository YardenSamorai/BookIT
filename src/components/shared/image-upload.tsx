"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/storage/upload";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from "@/lib/storage/types";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale-context";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  aspectRatio?: "square" | "video" | "banner";
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

const ASPECT_CLASSES = {
  square: "aspect-square",
  video: "aspect-video",
  banner: "aspect-[3/1]",
};

export function ImageUpload({
  value,
  onChange,
  folder,
  aspectRatio = "video",
  className,
  disabled,
  placeholder,
}: ImageUploadProps) {
  const t = useT();
  const resolvedPlaceholder = placeholder ?? t("upload.drag_drop");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        setError(t("upload.error_type"));
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(t("upload.error_size", { n: MAX_FILE_SIZE_MB }));
        return;
      }

      setUploading(true);
      setError("");

      try {
        const result = await uploadFile(file, folder);
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("upload.error_failed"));
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (value) {
    return (
      <div className={cn("relative group rounded-xl overflow-hidden border", ASPECT_CLASSES[aspectRatio], className)}>
        <img
          src={value}
          alt="Uploaded"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="me-1 size-4" />}
            {t("common.replace")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onChange("")}
            disabled={disabled || uploading}
          >
            <Trash2 className="me-1 size-4" />
            {t("common.remove")}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all cursor-pointer",
          ASPECT_CLASSES[aspectRatio],
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          (disabled || uploading) && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("common.uploading")}</p>
          </>
        ) : (
          <>
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{resolvedPlaceholder}</p>
              <p className="text-xs text-muted-foreground">
                {t("upload.file_types", { n: MAX_FILE_SIZE_MB })}
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
