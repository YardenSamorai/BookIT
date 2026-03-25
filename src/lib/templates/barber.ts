import type { BusinessTemplate } from "./types";
import { makeHours, makeVerticalSections } from "./shared";

export const barberTemplate: BusinessTemplate = {
  services: [
    { title: "Haircut", description: "Classic men's haircut", durationMinutes: 30, price: "60.00", paymentMode: "ON_SITE" },
    { title: "Beard Trim", description: "Beard shaping and trim", durationMinutes: 20, price: "40.00", paymentMode: "ON_SITE" },
    { title: "Hair + Beard", description: "Full haircut and beard grooming", durationMinutes: 45, price: "90.00", paymentMode: "ON_SITE" },
  ],
  hours: makeHours([0, 1, 2, 3, 4], "09:00", "20:00"),
  sections: (locale) =>
    makeVerticalSections(locale, {
      heroHeadline: "tpl.barber.hero_headline",
      heroSubtitle: "tpl.barber.hero_subtitle",
      about: "tpl.barber.about",
      aboutH1: "tpl.barber.about_h1",
      aboutH2: "tpl.barber.about_h2",
      aboutH3: "tpl.barber.about_h3",
    }),
};
