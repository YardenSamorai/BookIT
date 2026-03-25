import type { BusinessTemplate } from "./types";
import { makeHours, makeVerticalSections } from "./shared";

export const tutorTemplate: BusinessTemplate = {
  services: [
    { title: "Private Lesson", description: "One-on-one tutoring session", durationMinutes: 60, price: "100.00", paymentMode: "FULL" },
    { title: "Group Session", description: "Small group learning session", durationMinutes: 90, price: "70.00", paymentMode: "FULL" },
  ],
  hours: makeHours([0, 1, 2, 3, 4], "14:00", "21:00"),
  sections: (locale) =>
    makeVerticalSections(locale, {
      heroHeadline: "tpl.tutor.hero_headline",
      heroSubtitle: "tpl.tutor.hero_subtitle",
      about: "tpl.tutor.about",
      aboutH1: "tpl.tutor.about_h1",
      aboutH2: "tpl.tutor.about_h2",
      aboutH3: "tpl.tutor.about_h3",
    }),
};
