import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  jsonb,
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
    reminderHoursBefore2: integer("reminder_hours_before_2"),
    whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
    emailEnabled: boolean("email_enabled").notNull().default(true),
    smsEnabled: boolean("sms_enabled").notNull().default(false),
    smsBookingEnabled: boolean("sms_booking_enabled").notNull().default(false),
    notificationPhones: jsonb("notification_phones").$type<string[]>().default([]),
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
    messageBody: text("message_body"),
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
    index("notification_log_provider_msg_idx").on(table.providerMessageId),
  ]
);

export const messageTemplates = pgTable(
  "message_template",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    body: text("body").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("message_template_business_idx").on(table.businessId),
    uniqueIndex("message_template_unique").on(table.businessId, table.type, table.channel),
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
