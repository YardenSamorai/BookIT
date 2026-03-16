import type { SiteSection } from "@/lib/db/schema/site-config";

export interface ServiceTemplate {
  title: string;
  description: string;
  durationMinutes: number;
  price: string;
  paymentMode: "FULL" | "DEPOSIT" | "ON_SITE" | "CONTACT_FOR_PRICE" | "FREE";
}

export interface HoursTemplate {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

export interface BusinessTemplate {
  services: ServiceTemplate[];
  hours: HoursTemplate[];
  sections: SiteSection[];
}
