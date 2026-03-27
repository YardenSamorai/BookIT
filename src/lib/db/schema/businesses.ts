import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  time,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  businessTypeEnum,
  subscriptionPlanEnum,
  subscriptionStatusEnum,
  subdomainStatusEnum,
} from "./enums";
import { users } from "./users";

export const businesses = pgTable(
  "business",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    type: businessTypeEnum("type").notNull(),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    primaryColor: text("primary_color").notNull().default("#0F172A"),
    secondaryColor: text("secondary_color").notNull().default("#3B82F6"),
    timezone: text("timezone").notNull().default("Asia/Jerusalem"),
    currency: text("currency").notNull().default("ILS"),
    language: text("language").notNull().default("he"),
    slotGranularityMin: integer("slot_granularity_min").notNull().default(30),
    defaultBufferMin: integer("default_buffer_min").notNull().default(0),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    subscriptionPlan: subscriptionPlanEnum("subscription_plan")
      .notNull()
      .default("FREE"),
    subscriptionStatus: subscriptionStatusEnum("subscription_status")
      .notNull()
      .default("ACTIVE"),
    messageQuotaOverride: integer("message_quota_override"),
    brandingRemoved: boolean("branding_removed").notNull().default(false),
    customSubdomain: text("custom_subdomain"),
    subdomainStatus: subdomainStatusEnum("subdomain_status"),
    subdomainRejectReason: text("subdomain_reject_reason"),
    subdomainRequestedAt: timestamp("subdomain_requested_at", { withTimezone: true }),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("business_slug_idx").on(table.slug),
    uniqueIndex("business_subdomain_idx").on(table.customSubdomain),
    index("business_owner_idx").on(table.ownerId),
  ]
);

export const businessHours = pgTable(
  "business_hours",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isOpen: boolean("is_open").notNull().default(true),
  },
  (table) => [
    uniqueIndex("business_hours_unique").on(table.businessId, table.dayOfWeek),
  ]
);
