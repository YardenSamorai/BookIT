import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { ticketStatusEnum, ticketPriorityEnum } from "./enums";
import { businesses } from "./businesses";
import { users } from "./users";

export const supportTickets = pgTable(
  "support_ticket",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    status: ticketStatusEnum("status").notNull().default("OPEN"),
    priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
    adminNotes: text("admin_notes"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ticket_business_idx").on(table.businessId),
    index("ticket_status_idx").on(table.status),
  ]
);
