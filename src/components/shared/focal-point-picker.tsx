"use client";

import { useRef, useCallback, useState } from "react";
import { Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";

interface FocalPointPickerProps {
  imageUrl: string;
  focalX: number;
  focalY: number;
  onChange: (x: number, y: number) => void;
  className?: string;
}

export function FocalPointPicker({
  imageUrl,
  focalX,
  focalY,
  onChange,
  className,
}: FocalPointPickerProps) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const calcPosition = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
      const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
      onChange(x, y);
    },
    [onChange]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      calcPosition(e.clientX, e.clientY);
    },
    [calcPosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      calcPosition(e.clientX, e.clientY);
    },
    [dragging, calcPosition]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative aspect-video cursor-crosshair overflow-hidden rounded-lg border-2 select-none",
          dragging ? "border-primary" : "border-muted-foreground/25"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt=""
          className="size-full object-cover pointer-events-none"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          draggable={false}
        />

        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Crosshair lines */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
          style={{ left: `${focalX}%` }}
        />
        <div
          className="absolute left-0 right-0 h-px bg-white/50 pointer-events-none"
          style={{ top: `${focalY}%` }}
        />

        {/* Focal point dot */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${focalX}%`,
            top: `${focalY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute size-8 rounded-full border-2 border-white/80 shadow-lg" />
            <div className="size-3 rounded-full bg-white shadow-md" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Move className="size-3" />
          {t("focal.hint" as any)}
        </p>
        <button
          type="button"
          onClick={() => onChange(50, 50)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("focal.reset" as any)}
        </button>
      </div>
    </div>
  );
}
