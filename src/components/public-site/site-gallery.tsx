"use client";

import { useRef, useCallback } from "react";
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
  if (images.length === 0) return null;

  const title = (content.title as string) || t(locale, "pub.our_work");
  const subtitle = (content.subtitle as string) || "";
  const columns = Number(content.columns ?? 3);
  const layout = (content.layout as string) || "grid";
  const marquee = content.marquee === true;
  const speed = (content.marquee_speed as string) || "normal";

  const colClass =
    columns === 2
      ? "grid-cols-2 sm:grid-cols-2"
      : columns === 4
        ? "grid-cols-3 sm:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-3 sm:grid-cols-2 lg:grid-cols-3";

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
          <GalleryMarquee images={images} theme={theme} speed={speed} />
        ) : layout === "masonry" ? (
          <AnimatedStagger className={`mt-8 columns-3 gap-2 space-y-2 sm:mt-12 sm:columns-2 sm:gap-4 sm:space-y-4 ${columns >= 3 ? "lg:columns-3" : ""}`}>
            {images.map((img, i) => (
              <GalleryItem key={i} image={img} theme={theme} />
            ))}
          </AnimatedStagger>
        ) : (
          <AnimatedStagger className={`mt-8 grid gap-2 sm:mt-12 sm:gap-4 ${colClass}`}>
            {images.map((img, i) => (
              <GalleryItem key={i} image={img} theme={theme} />
            ))}
          </AnimatedStagger>
        )}
      </div>
    </section>
  );
}

function GalleryMarquee({
  images,
  theme,
  speed,
}: {
  images: GalleryImage[];
  theme: SiteTheme;
  speed: string;
}) {
  const doubled = [...images, ...images];
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

  const secsPerItem = SPEED_MAP[speed] ?? 3;
  const dur = Math.max(images.length * secsPerItem, 8);

  return (
    <div className="relative mt-8 overflow-hidden sm:mt-12">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20 rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20 rtl:bg-gradient-to-r" />

      <div
        ref={stripRef}
        className="gallery-marquee-strip flex gap-3 py-2 sm:gap-5"
        style={{ touchAction: "pan-y" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {doubled.map((img, i) => (
          <div key={`${img.url}-${i}`} className="w-52 shrink-0 sm:w-72">
            <GalleryItem image={img} theme={theme} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes gallery-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .gallery-marquee-strip {
          animation: gallery-marquee ${dur}s linear infinite;
        }
        .gallery-marquee-strip:hover {
          animation-play-state: paused;
        }
        [dir="rtl"] .gallery-marquee-strip {
          animation-name: gallery-marquee-rtl;
        }
        @keyframes gallery-marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }
      `}</style>
    </div>
  );
}

function GalleryItem({ image, theme }: { image: GalleryImage; theme: SiteTheme }) {
  return (
    <div className={`group relative overflow-hidden ${theme.radius.lg} ${theme.card} ${theme.cardHover} transition-all`}>
      <div className="relative aspect-square overflow-hidden">
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
