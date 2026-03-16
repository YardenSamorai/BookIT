import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { users } from "./users";
import { services } from "./services";
import { appointments } from "./appointments";

export const reviews = pgTable(
  "review",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id")
      .references(() => appointments.id, { onDelete: "set null" }),
    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("review_business_idx").on(table.businessId),
    index("review_user_idx").on(table.userId),
    index("review_business_rating_idx").on(table.businessId, table.rating),
  ]
);
