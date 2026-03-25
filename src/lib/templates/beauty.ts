import type { BusinessTemplate } from "./types";
import { makeHours, makeVerticalSections } from "./shared";

export const beautyTemplate: BusinessTemplate = {
  services: [
    { title: "Manicure", description: "Classic manicure with polish", durationMinutes: 45, price: "80.00", paymentMode: "ON_SITE" },
    { title: "Facial Treatment", description: "Deep cleansing facial", durationMinutes: 60, price: "150.00", paymentMode: "FULL" },
    { title: "Lash Extensions", description: "Full set lash extensions", durationMinutes: 90, price: "200.00", paymentMode: "DEPOSIT" },
  ],
  hours: makeHours([0, 1, 2, 3, 4, 5], "09:00", "19:00"),
  sections: (locale) =>
    makeVerticalSections(locale, {
      heroHeadline: "tpl.beauty.hero_headline",
      heroSubtitle: "tpl.beauty.hero_subtitle",
      about: "tpl.beauty.about",
      aboutH1: "tpl.beauty.about_h1",
      aboutH2: "tpl.beauty.about_h2",
      aboutH3: "tpl.beauty.about_h3",
    }),
};
