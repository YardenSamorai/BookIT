import type { SiteSection } from "@/lib/db/schema/site-config";
import type { HoursTemplate } from "./types";
import { t, type Locale } from "@/lib/i18n";

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

export function makeDefaultSections(locale: Locale): SiteSection[] {
  return [
    {
      type: "hero",
      enabled: true,
      order: 0,
      layout: "centered",
      content: {
        headline: "",
        subtitle: t(locale, "pub.default_subtitle"),
        cta_text: t(locale, "pub.book_now"),
      },
    },
    {
      type: "about",
      enabled: true,
      order: 1,
      layout: "image-left",
      content: { description: "", image: "" },
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
      type: "gallery",
      enabled: false,
      order: 4,
      layout: "grid",
      content: { columns: 3 },
    },
    {
      type: "testimonials",
      enabled: false,
      order: 5,
      layout: "cards",
      content: {},
    },
    {
      type: "cta_banner",
      enabled: false,
      order: 6,
      layout: "centered",
      content: {
        headline: t(locale, "pub.cta_default"),
        button_text: t(locale, "pub.book_now"),
      },
    },
    {
      type: "booking",
      enabled: true,
      order: 7,
      layout: "default",
      content: {},
    },
    {
      type: "products",
      enabled: false,
      order: 8,
      layout: "carousel",
      content: {},
    },
    {
      type: "contact",
      enabled: true,
      order: 9,
      layout: "split",
      content: { show_map: false },
    },
  ];
}

export function makeVerticalSections(
  locale: Locale,
  keys: {
    heroHeadline: Parameters<typeof t>[1];
    heroSubtitle: Parameters<typeof t>[1];
    about: Parameters<typeof t>[1];
    aboutH1: Parameters<typeof t>[1];
    aboutH2: Parameters<typeof t>[1];
    aboutH3: Parameters<typeof t>[1];
  }
): SiteSection[] {
  const base = makeDefaultSections(locale);
  return base.map((s) => {
    switch (s.type) {
      case "hero":
        return { ...s, content: { ...s.content, headline: t(locale, keys.heroHeadline) } };
      case "about":
        return {
          ...s,
          content: {
            ...s.content,
            description: t(locale, keys.about),
            highlight_1: t(locale, keys.aboutH1),
            highlight_2: t(locale, keys.aboutH2),
            highlight_3: t(locale, keys.aboutH3),
          },
        };
      default:
        return s;
    }
  });
}

/** @deprecated Use makeDefaultSections(locale) in new code */
export const DEFAULT_SECTIONS: SiteSection[] = makeDefaultSections("he");
