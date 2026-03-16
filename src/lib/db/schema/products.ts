import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { ctaModeEnum } from "./enums";
import { businesses } from "./businesses";
import { services } from "./services";

export const products = pgTable(
  "product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }),
    images: text("images").array().notNull().default([]),
    category: text("category"),
    relatedServiceId: uuid("related_service_id").references(() => services.id, {
      onDelete: "set null",
    }),
    ctaMode: ctaModeEnum("cta_mode").notNull().default("NONE"),
    ctaText: text("cta_text"),
    externalUrl: text("external_url"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_business_idx").on(table.businessId),
  ]
);
