import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { classInstanceStatusEnum } from "./enums";
import { businesses } from "./businesses";
import { services } from "./services";
import { staffMembers } from "./staff";

export const classSchedules = pgTable(
  "class_schedule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    title: text("title"),
    daysOfWeek: jsonb("days_of_week").notNull().$type<number[]>(),
    startTime: text("start_time").notNull(),
    maxParticipants: integer("max_participants").notNull().default(10),
    effectiveFrom: date("effective_from").notNull(),
    effectiveUntil: date("effective_until"),
    isActive: boolean("is_active").notNull().default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("class_schedule_business_idx").on(table.businessId),
    index("class_schedule_active_idx").on(table.businessId, table.isActive),
  ]
);

export const classInstances = pgTable(
  "class_instance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classScheduleId: uuid("class_schedule_id")
      .notNull()
      .references(() => classSchedules.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    maxParticipants: integer("max_participants").notNull(),
    status: classInstanceStatusEnum("status").notNull().default("SCHEDULED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("class_instance_business_date_idx").on(table.businessId, table.date),
    index("class_instance_schedule_idx").on(table.classScheduleId),
  ]
);
