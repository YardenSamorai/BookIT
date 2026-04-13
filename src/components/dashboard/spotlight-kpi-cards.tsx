"use client";

import { useEffect, type ReactNode } from "react";

interface KpiCard {
  label: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  glowColor: string;
  accentColor: string;
}

function SpotlightWrapper({
  children,
  glowColor,
}: {
  children: ReactNode;
  glowColor: string;
}) {
  return (
    <div className="spotlight-card group relative overflow-hidden rounded-xl bg-border p-px transition-all duration-300 ease-in-out">
      {children}
      <div
        className="blob absolute top-0 left-0 size-24 rounded-full opacity-0 blur-3xl transition-all duration-300 ease-in-out"
        style={{ backgroundColor: glowColor }}
      />
      <div className="fake-blob absolute top-0 left-0 size-24 rounded-full" />
    </div>
  );
}

export function SpotlightKpiCards({ cards }: { cards: KpiCard[] }) {
  useEffect(() => {
    const all = document.querySelectorAll(".spotlight-card");

    const handleMouseMove = (ev: MouseEvent) => {
      all.forEach((e) => {
        const blob = e.querySelector(".blob") as HTMLElement;
        const fblob = e.querySelector(".fake-blob") as HTMLElement;
        if (!blob || !fblob) return;

        const rec = fblob.getBoundingClientRect();
        blob.style.opacity = "1";
        blob.animate(
          [
            {
              transform: `translate(${ev.clientX - rec.left - rec.width / 2}px, ${ev.clientY - rec.top - rec.height / 2}px)`,
            },
          ],
          { duration: 300, fill: "forwards" }
        );
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <SpotlightWrapper key={i} glowColor={card.glowColor}>
          <div className="relative z-10 flex flex-col rounded-[11px] bg-card p-5 transition-all duration-300 ease-in-out group-hover:bg-card/90 group-hover:backdrop-blur-[20px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {card.label}
              </span>
              <div
                className="flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${card.accentColor}15` }}
              >
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">{card.value}</div>
            <p className="mt-1.5 text-xs text-muted-foreground">{card.subtitle}</p>
          </div>
        </SpotlightWrapper>
      ))}
    </div>
  );
}
