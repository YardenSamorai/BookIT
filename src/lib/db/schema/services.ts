import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import {
  paymentModeEnum,
  approvalTypeEnum,
  staffAssignmentModeEnum,
} from "./enums";
import { businesses } from "./businesses";
import { staffMembers } from "./staff";

export const serviceCategories = pgTable(
  "service_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("service_category_business_idx").on(table.businessId),
  ]
);

export const services = pgTable(
  "service",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => serviceCategories.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferMinutes: integer("buffer_minutes"),
    price: decimal("price", { precision: 10, scale: 2 }),
    depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
    paymentMode: paymentModeEnum("payment_mode").notNull().default("FREE"),
    approvalType: approvalTypeEnum("approval_type").notNull().default("AUTO"),
    cancelHoursBefore: integer("cancel_hours_before"),
    rescheduleHoursBefore: integer("reschedule_hours_before"),
    staffAssignmentMode: staffAssignmentModeEnum("staff_assignment_mode")
      .notNull()
      .default("ANY"),
    imageUrl: text("image_url"),
    meetingLink: text("meeting_link"),
    isGroup: boolean("is_group").notNull().default(false),
    maxParticipants: integer("max_participants").default(1),
    blocksAllStaff: boolean("blocks_all_staff").notNull().default(false),
    autoManaged: boolean("auto_managed").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("service_business_idx").on(table.businessId),
    index("service_active_idx").on(table.businessId, table.isActive),
  ]
);

export const serviceStaff = pgTable(
  "service_staff",
  {
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staffMembers.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.serviceId, table.staffId] }),
  ]
);
