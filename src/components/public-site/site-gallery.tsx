"use client";

import { useRef, useCallback, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { SiteTheme } from "@/lib/themes/presets";
import { t, type Locale } from "@/lib/i18n";
import { AnimatedStagger } from "./animated-section";

interface GalleryImage {
  url: string;
  caption: string;
}

interface SiteGalleryProps {
  theme: SiteTheme;
  content?: Record<string, unknown>;
  sectionIndex: number;
  locale: Locale;
}

function parseImages(raw: unknown): GalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown) => {
      const o = item as Record<string, unknown>;
      return {
        url: String(o?.url ?? ""),
        caption: String(o?.caption ?? ""),
      };
    })
    .filter((img) => img.url);
}

const SPEED_MAP: Record<string, number> = { slow: 5, normal: 3, fast: 1.5 };

export function SiteGallery({ theme, content = {}, sectionIndex, locale }: SiteGalleryProps) {
  const images = parseImages(content.images);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const title = (content.title as string) || t(locale, "pub.our_work");
  const subtitle = (content.subtitle as string) || "";
  const columns = Number(content.columns ?? 3);
  const layout = (content.layout as string) || "grid";
  const marquee = content.marquee === true;
  const speed = (content.marquee_speed as string) || "normal";
  const alternateDir = content.marquee_alternate !== false;

  const colClass =
    columns === 2
      ? "grid-cols-2 sm:grid-cols-2"
      : columns === 4
        ? "grid-cols-3 sm:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3";

  const openImage = (idx: number) => setLightboxIndex(idx);

  return (
    <section
      id="gallery"
      className={`scroll-mt-20 ${theme.sectionSpacing} ${sectionIndex % 2 === 0 ? theme.sectionBgEven : theme.sectionBgOdd}`}
    >
      <div className={`mx-auto ${marquee ? "max-w-full" : "max-w-6xl px-4 sm:px-6"}`}>
        <div className={`text-center ${marquee ? "px-4 sm:px-6" : ""}`}>
          <h2
            className={`${theme.headingSize.section} ${theme.headingWeight} ${theme.font} tracking-tight`}
            style={{ color: "var(--section-heading, #111827)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-md" style={{ color: "var(--section-body, #6b7280)" }}>{subtitle}</p>
          )}
        </div>

        {marquee ? (
          <GalleryMarquee images={images} theme={theme} speed={speed} columns={columns} layout={layout} alternateDir={alternateDir} onImageClick={openImage} />
        ) : layout === "masonry" ? (
          <AnimatedStagger className={`mt-8 columns-3 gap-2 space-y-2 sm:mt-12 sm:columns-2 sm:gap-4 sm:space-y-4 ${columns >= 3 ? "lg:columns-3" : ""}`}>
            {images.map((img, i) => (
              <GalleryItem key={i} image={img} theme={theme} onClick={() => openImage(i)} />
            ))}
          </AnimatedStagger>
        ) : (
          <AnimatedStagger className={`mt-8 grid gap-2 sm:mt-12 sm:gap-4 ${colClass}`}>
            {images.map((img, i) => (
              <GalleryItem key={i} image={img} theme={theme} onClick={() => openImage(i)} />
            ))}
          </AnimatedStagger>
        )}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

function splitIntoRows(images: GalleryImage[], rowCount: number): GalleryImage[][] {
  const rows: GalleryImage[][] = Array.from({ length: rowCount }, () => []);
  images.forEach((img, i) => {
    rows[i % rowCount].push(img);
  });
  return rows;
}

function GalleryMarquee({
  images,
  theme,
  speed,
  columns,
  layout,
  alternateDir,
  onImageClick,
}: {
  images: GalleryImage[];
  theme: SiteTheme;
  speed: string;
  columns: number;
  layout: string;
  alternateDir: boolean;
  onImageClick?: (index: number) => void;
}) {
  const rowCount = Math.max(1, Math.min(columns, Math.ceil(images.length / 2)));
  const rows = useMemo(() => splitIntoRows(images, rowCount), [images, rowCount]);
  const secsPerItem = SPEED_MAP[speed] ?? 3;
  const isMasonry = layout === "masonry";

  return (
    <div className="mt-8 space-y-2 sm:mt-12 sm:space-y-3">
      {rows.map((rowImages, rowIdx) => (
        <MarqueeRow
          key={rowIdx}
          images={rowImages}
          allImages={images}
          theme={theme}
          secsPerItem={secsPerItem}
          reverse={alternateDir ? rowIdx % 2 === 1 : false}
          isMasonry={isMasonry}
          rowIdx={rowIdx}
          onImageClick={onImageClick}
        />
      ))}
    </div>
  );
}

function MarqueeRow({
  images,
  allImages,
  theme,
  secsPerItem,
  reverse,
  isMasonry,
  rowIdx,
  onImageClick,
}: {
  images: GalleryImage[];
  allImages: GalleryImage[];
  theme: SiteTheme;
  secsPerItem: number;
  reverse: boolean;
  isMasonry: boolean;
  rowIdx: number;
  onImageClick?: (index: number) => void;
}) {
  const copies = Math.max(4, Math.ceil(16 / images.length));
  const repeated = useMemo(() => {
    const arr: GalleryImage[] = [];
    for (let c = 0; c < copies; c++) arr.push(...images);
    return arr;
  }, [images, copies]);

  const pct = (100 / copies).toFixed(6);

  const stripRef = useRef<HTMLDivElement>(null);
  const touchState = useRef({ startX: 0, currentOffset: 0, dragging: false });
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const pauseAnimation = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const computed = getComputedStyle(el);
    const matrix = new DOMMatrix(computed.transform);
    touchState.current.currentOffset = matrix.m41;
    el.style.animationPlayState = "paused";
    el.style.transform = `translateX(${matrix.m41}px)`;
  }, []);

  const resumeAnimation = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.animationPlayState = "running";
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    touchState.current.startX = e.touches[0].clientX;
    touchState.current.dragging = true;
    pauseAnimation();
  }, [pauseAnimation]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.dragging) return;
    const el = stripRef.current;
    if (!el) return;
    const delta = e.touches[0].clientX - touchState.current.startX;
    el.style.transform = `translateX(${touchState.current.currentOffset + delta}px)`;
  }, []);

  const onTouchEnd = useCallback(() => {
    touchState.current.dragging = false;
    resumeTimer.current = setTimeout(resumeAnimation, 2000);
  }, [resumeAnimation]);

  const dur = Math.max(images.length * secsPerItem, 8);
  const animId = `gal-marquee-${rowIdx}`;
  const animIdRtl = `gal-marquee-rtl-${rowIdx}`;
  const stripClass = `gal-strip-${rowIdx}`;

  const heightClass = isMasonry && rowIdx % 2 === 1 ? "h-44 sm:h-56" : "h-40 sm:h-52";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-16 rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-16 rtl:bg-gradient-to-r" />

      <div
        ref={stripRef}
        className={`${stripClass} flex gap-2 sm:gap-3`}
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {repeated.map((img, i) => {
          const originalIdx = allImages.findIndex((a) => a.url === img.url);
          return (
            <div key={`${img.url}-${i}`} className={`shrink-0 ${heightClass} aspect-square`}>
              <GalleryItem image={img} theme={theme} onClick={onImageClick && originalIdx >= 0 ? () => onImageClick(originalIdx) : undefined} />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes ${animId} {
          0% { transform: translateX(0); }
          100% { transform: translateX(${reverse ? `${pct}%` : `-${pct}%`}); }
        }
        .${stripClass} {
          animation: ${animId} ${dur}s linear infinite;
        }
        .${stripClass}:hover {
          animation-play-state: paused;
        }
        [dir="rtl"] .${stripClass} {
          animation-name: ${animIdRtl};
        }
        @keyframes ${animIdRtl} {
          0% { transform: translateX(0); }
          100% { transform: translateX(${reverse ? `-${pct}%` : `${pct}%`}); }
        }
      `}</style>
    </div>
  );
}

function GalleryItem({ image, theme, onClick }: { image: GalleryImage; theme: SiteTheme; onClick?: () => void }) {
  return (
    <div
      className={`group relative size-full overflow-hidden ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div className="relative size-full overflow-hidden">
        <img
          src={image.url}
          alt={image.caption}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {image.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:p-4 sm:pt-8">
            <p className="text-xs font-medium text-white sm:text-sm">{image.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const current = images[index];
  const hasNext = index < images.length - 1;
  const hasPrev = index > 0;

  const goNext = useCallback(() => {
    if (hasNext) setIndex((i) => i + 1);
  }, [hasNext]);

  const goPrev = useCallback(() => {
    if (hasPrev) setIndex((i) => i - 1);
  }, [hasPrev]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
    touchRef.current.swiping = true;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current.swiping) return;
    touchRef.current.swiping = false;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) {
      // Swiped left → in RTL that means "prev", in LTR "next"
      const isRtl = document.documentElement.dir === "rtl";
      isRtl ? goPrev() : goNext();
    } else {
      const isRtl = document.documentElement.dir === "rtl";
      isRtl ? goNext() : goPrev();
    }
  }, [goNext, goPrev]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowRight") {
      document.documentElement.dir === "rtl" ? goPrev() : goNext();
    }
    if (e.key === "ArrowLeft") {
      document.documentElement.dir === "rtl" ? goNext() : goPrev();
    }
  }, [onClose, goNext, goPrev]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      autoFocus
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute end-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <X className="size-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 start-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
        {index + 1} / {images.length}
      </div>

      {/* Previous button (desktop) */}
      {hasPrev && (
        <button
          onClick={goPrev}
          className="absolute start-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
        >
          <ChevronLeft className="size-6 rtl:rotate-180" />
        </button>
      )}

      {/* Next button (desktop) */}
      {hasNext && (
        <button
          onClick={goNext}
          className="absolute end-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
        >
          <ChevronRight className="size-6 rtl:rotate-180" />
        </button>
      )}

      {/* Image */}
      <div className="flex max-h-[85vh] max-w-[90vw] items-center justify-center sm:max-w-[80vw]">
        <img
          src={current.url}
          alt={current.caption}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
          draggable={false}
        />
      </div>

      {/* Caption */}
      {current.caption && (
        <div className="absolute bottom-6 inset-x-0 text-center">
          <p className="mx-auto max-w-md rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {current.caption}
          </p>
        </div>
      )}
    </div>
  );
}
