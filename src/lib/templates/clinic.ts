import type { BusinessTemplate } from "./types";
import { makeHours, makeVerticalSections } from "./shared";

export const clinicTemplate: BusinessTemplate = {
  services: [
    { title: "Consultation", description: "Initial consultation", durationMinutes: 30, price: "200.00", paymentMode: "FULL" },
    { title: "Treatment", description: "Standard treatment session", durationMinutes: 60, price: "400.00", paymentMode: "DEPOSIT" },
  ],
  hours: makeHours([0, 1, 2, 3, 4], "08:00", "17:00"),
  sections: (locale) =>
    makeVerticalSections(locale, {
      heroHeadline: "tpl.clinic.hero_headline",
      heroSubtitle: "tpl.clinic.hero_subtitle",
      about: "tpl.clinic.about",
      aboutH1: "tpl.clinic.about_h1",
      aboutH2: "tpl.clinic.about_h2",
      aboutH3: "tpl.clinic.about_h3",
    }),
};
