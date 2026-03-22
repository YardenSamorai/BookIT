import { pgTable, uuid, text, boolean, timestamp, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userRoleEnum } from "./enums";

export const users = pgTable(
  "user",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").unique(),
    phone: text("phone").unique(),
    name: text("name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    passwordHash: text("password_hash"),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").notNull().default("CUSTOMER"),
    emailVerified: boolean("email_verified").notNull().default(false),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("email_or_phone_required", sql`${table.email} IS NOT NULL OR ${table.phone} IS NOT NULL`),
    index("user_email_idx").on(table.email),
    index("user_phone_idx").on(table.phone),
  ]
);
