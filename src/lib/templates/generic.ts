import type { BusinessTemplate } from "./types";
import { makeHours, DEFAULT_SECTIONS } from "./shared";

export const genericTemplate: BusinessTemplate = {
  services: [
    { title: "Consultation", description: "Initial consultation", durationMinutes: 30, price: "0.00", paymentMode: "FREE" },
    { title: "Service Session", description: "Standard service session", durationMinutes: 60, price: "0.00", paymentMode: "CONTACT_FOR_PRICE" },
  ],
  hours: makeHours([0, 1, 2, 3, 4], "09:00", "18:00"),
  sections: DEFAULT_SECTIONS,
};
