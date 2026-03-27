import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { subscriptionPlanEnum, billingStatusEnum } from "./enums";

export const adminBillingRecords = pgTable(
  "admin_billing_record",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    periodLabel: text("period_label").notNull(),
    planAtTime: subscriptionPlanEnum("plan_at_time").notNull(),
    amountIls: integer("amount_ils").notNull(),
    status: billingStatusEnum("status").notNull().default("PENDING"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("billing_business_period_idx").on(
      table.businessId,
      table.periodLabel
    ),
    index("billing_status_idx").on(table.status),
  ]
);
