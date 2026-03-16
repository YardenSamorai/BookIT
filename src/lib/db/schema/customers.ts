import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  packagePaymentStatusEnum,
  customerPackageStatusEnum,
} from "./enums";
import { businesses } from "./businesses";
import { users } from "./users";
import { servicePackages } from "./packages";

export const customers = pgTable(
  "customer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tags: text("tags").array().notNull().default([]),
    cancellationCount: integer("cancellation_count").notNull().default(0),
    noShowCount: integer("no_show_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_business_user_unique").on(table.businessId, table.userId),
    index("customer_business_idx").on(table.businessId),
  ]
);

export const customerNotes = pgTable(
  "customer_note",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("customer_note_customer_idx").on(table.customerId),
    index("customer_note_business_idx").on(table.businessId, table.customerId),
  ]
);

export const customerPackages = pgTable(
  "customer_package",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    packageId: uuid("package_id")
      .notNull()
      .references(() => servicePackages.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    sessionsRemaining: integer("sessions_remaining").notNull(),
    sessionsUsed: integer("sessions_used").notNull().default(0),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    paymentStatus: packagePaymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),
    stripePaymentId: text("stripe_payment_id"),
    status: customerPackageStatusEnum("status").notNull().default("ACTIVE"),
  },
  (table) => [
    index("customer_package_customer_idx").on(table.customerId),
    index("customer_package_business_idx").on(table.businessId, table.customerId),
  ]
);
