import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { customers } from "./customers";
import { appointments } from "./appointments";

export const intakeForms = pgTable(
  "intake_form",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    fields: jsonb("fields").notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("intake_form_business_idx").on(table.businessId),
  ]
);

export const intakeFormSubmissions = pgTable(
  "intake_form_submission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => intakeForms.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    responses: jsonb("responses").notNull().default({}),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("intake_sub_form_idx").on(table.formId),
    index("intake_sub_customer_idx").on(table.customerId),
    index("intake_sub_business_idx").on(table.businessId),
    index("intake_sub_customer_form_idx").on(table.customerId, table.formId),
  ]
);
