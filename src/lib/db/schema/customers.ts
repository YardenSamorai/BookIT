import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  packagePaymentStatusEnum,
  customerPackageStatusEnum,
  customerLifecycleStatusEnum,
  customerActivityTypeEnum,
  activityActorTypeEnum,
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
    status: customerLifecycleStatusEnum("status").notNull().default("LEAD"),
    tags: text("tags").array().notNull().default([]),
    cancellationCount: integer("cancellation_count").notNull().default(0),
    noShowCount: integer("no_show_count").notNull().default(0),

    // Profile fields (business-specific, all optional)
    birthday: date("birthday"),
    address: text("address"),
    source: text("source"),
    gender: text("gender"),
    preferredLanguage: text("preferred_language"),
    generalNotes: text("general_notes"),

    // Communication preferences
    smsOptIn: boolean("sms_opt_in").notNull().default(true),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(true),
    emailMarketingOptIn: boolean("email_marketing_opt_in").notNull().default(true),
    reminderChannel: text("reminder_channel"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("customer_business_user_unique").on(table.businessId, table.userId),
    index("customer_business_idx").on(table.businessId),
    index("customer_status_idx").on(table.businessId, table.status),
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

// ─── customer_activity (audit timeline) ─────────────────────────────────────

export const customerActivities = pgTable(
  "customer_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    type: customerActivityTypeEnum("type").notNull(),
    actorType: activityActorTypeEnum("actor_type").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorName: text("actor_name").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("customer_activity_customer_idx").on(table.customerId, table.createdAt),
    index("customer_activity_business_idx").on(table.businessId, table.customerId),
  ]
);
