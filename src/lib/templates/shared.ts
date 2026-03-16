import type { SiteSection } from "@/lib/db/schema/site-config";
import type { HoursTemplate } from "./types";

export function makeHours(
  openDays: number[],
  start: string,
  end: string
): HoursTemplate[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    startTime: start,
    endTime: end,
    isOpen: openDays.includes(i),
  }));
}

export const DEFAULT_SECTIONS: SiteSection[] = [
  {
    type: "hero",
    enabled: true,
    order: 0,
    layout: "centered",
    content: { headline: "", subtitle: "", cta_text: "Book Now" },
  },
  {
    type: "about",
    enabled: true,
    order: 1,
    layout: "image-left",
    content: { text: "", image_url: "" },
  },
  {
    type: "services",
    enabled: true,
    order: 2,
    layout: "grid-3",
    content: {},
  },
  {
    type: "team",
    enabled: true,
    order: 3,
    layout: "cards",
    content: {},
  },
  {
    type: "products",
    enabled: false,
    order: 4,
    layout: "carousel",
    content: {},
  },
  {
    type: "booking",
    enabled: true,
    order: 5,
    layout: "default",
    content: {},
  },
  {
    type: "contact",
    enabled: true,
    order: 6,
    layout: "default",
    content: { show_map: false },
  },
];
