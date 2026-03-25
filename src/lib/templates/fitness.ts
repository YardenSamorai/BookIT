import type { BusinessTemplate } from "./types";
import { makeHours, makeVerticalSections } from "./shared";

export const fitnessTemplate: BusinessTemplate = {
  services: [
    { title: "Personal Training", description: "One-on-one training session", durationMinutes: 60, price: "120.00", paymentMode: "FULL" },
    { title: "Fitness Assessment", description: "Full body assessment and plan", durationMinutes: 45, price: "80.00", paymentMode: "FULL" },
  ],
  hours: makeHours([0, 1, 2, 3, 4], "06:00", "22:00"),
  sections: (locale) =>
    makeVerticalSections(locale, {
      heroHeadline: "tpl.fitness.hero_headline",
      heroSubtitle: "tpl.fitness.hero_subtitle",
      about: "tpl.fitness.about",
      aboutH1: "tpl.fitness.about_h1",
      aboutH2: "tpl.fitness.about_h2",
      aboutH3: "tpl.fitness.about_h3",
    }),
};
