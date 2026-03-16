import type { BusinessTemplate } from "./types";
import { makeHours, DEFAULT_SECTIONS } from "./shared";

export const clinicTemplate: BusinessTemplate = {
  services: [
    { title: "Consultation", description: "Initial consultation", durationMinutes: 30, price: "200.00", paymentMode: "FULL" },
    { title: "Treatment", description: "Standard treatment session", durationMinutes: 60, price: "400.00", paymentMode: "DEPOSIT" },
  ],
  hours: makeHours([0, 1, 2, 3, 4], "08:00", "17:00"),
  sections: DEFAULT_SECTIONS,
};
