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
  notificationChannelEnum,
  notificationTypeEnum,
  notificationStatusEnum,
} from "./enums";
import { businesses } from "./businesses";
import { appointments } from "./appointments";
import { users } from "./users";

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    reminderHoursBefore: integer("reminder_hours_before").notNull().default(24),
    whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
    emailEnabled: boolean("email_enabled").notNull().default(true),
    smsEnabled: boolean("sms_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_prefs_business_unique").on(table.businessId),
  ]
);

export const notificationLogs = pgTable(
  "notification_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    channel: notificationChannelEnum("channel").notNull(),
    type: notificationTypeEnum("type").notNull(),
    recipient: text("recipient").notNull(),
    status: notificationStatusEnum("status").notNull().default("QUEUED"),
    provider: text("provider").notNull(),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notification_log_business_idx").on(table.businessId, table.createdAt),
    index("notification_log_appointment_idx").on(table.appointmentId),
  ]
);

export const otpVerifications = pgTable(
  "otp_verification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phone: text("phone").notNull(),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verified: boolean("verified").notNull().default(false),
    attempts: integer("attempts").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("otp_phone_idx").on(table.phone, table.createdAt),
  ]
);
