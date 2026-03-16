import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  time,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";

export const staffMembers = pgTable(
  "staff_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    roleTitle: text("role_title"),
    imageUrl: text("image_url"),
    bio: text("bio"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("staff_business_idx").on(table.businessId),
  ]
);

export const staffSchedules = pgTable(
  "staff_schedule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("staff_schedule_unique").on(table.staffId, table.dayOfWeek),
  ]
);

export const staffTimeOff = pgTable(
  "staff_time_off",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("staff_timeoff_idx").on(table.staffId, table.startDate, table.endDate),
  ]
);

export const staffBlockedSlots = pgTable(
  "staff_blocked_slot",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("staff_blocked_idx").on(table.staffId, table.startTime, table.endTime),
  ]
);
