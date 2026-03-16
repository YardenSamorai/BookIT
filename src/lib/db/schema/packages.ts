import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { services } from "./services";

export const servicePackages = pgTable(
  "service_package",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sessionCount: integer("session_count").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    expirationDays: integer("expiration_days"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("package_business_idx").on(table.businessId),
    index("package_service_idx").on(table.serviceId),
  ]
);
