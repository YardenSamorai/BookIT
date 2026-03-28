import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import {
  appointmentStatusEnum,
  appointmentPaymentStatusEnum,
  appointmentSourceEnum,
  cancelledByEnum,
  performedByEnum,
} from "./enums";
import { businesses } from "./businesses";
import { customers } from "./customers";
import { services } from "./services";
import { staffMembers } from "./staff";
import { customerPackages } from "./customers";
import { customerCards } from "./cards";
import { classInstances } from "./classes";

export const appointments = pgTable(
  "appointment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "restrict" }),
    customerPackageId: uuid("customer_package_id").references(
      () => customerPackages.id,
      { onDelete: "set null" }
    ),
    customerCardId: uuid("customer_card_id").references(
      () => customerCards.id,
      { onDelete: "set null" }
    ),
    classInstanceId: uuid("class_instance_id").references(
      () => classInstances.id,
      { onDelete: "set null" }
    ),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("PENDING"),
    paymentStatus: appointmentPaymentStatusEnum("payment_status")
      .notNull()
      .default("UNPAID"),
    paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
    stripePaymentId: text("stripe_payment_id"),
    source: appointmentSourceEnum("source").notNull().default("ONLINE"),
    cancelReason: text("cancel_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: cancelledByEnum("cancelled_by"),
    notes: text("notes"),
    seriesId: uuid("series_id"),
    googleEventId: text("google_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointment_business_time_idx").on(table.businessId, table.startTime),
    index("appointment_staff_time_idx").on(
      table.staffId,
      table.startTime,
      table.endTime
    ),
    index("appointment_customer_idx").on(table.customerId),
    index("appointment_business_status_idx").on(table.businessId, table.status),
  ]
);

export const appointmentLogs = pgTable(
  "appointment_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    performedBy: performedByEnum("performed_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointment_log_appointment_idx").on(table.appointmentId),
  ]
);
