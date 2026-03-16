import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

export type SiteSectionType =
  | "hero"
  | "about"
  | "services"
  | "team"
  | "gallery"
  | "testimonials"
  | "cta_banner"
  | "products"
  | "booking"
  | "contact";

export type SiteSection = {
  type: SiteSectionType;
  enabled: boolean;
  order: number;
  layout: string;
  content: Record<string, unknown>;
};

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
  website?: string;
};

export const siteConfigs = pgTable(
  "site_config",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    sections: jsonb("sections").$type<SiteSection[]>().notNull().default([]),
    themePreset: text("theme_preset").notNull().default("modern"),
    puckData: jsonb("puck_data").$type<Record<string, unknown>>(),
    socialLinks: jsonb("social_links").$type<SocialLinks>().default({}),
    customCss: text("custom_css"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("site_config_business_unique").on(table.businessId),
  ]
);
