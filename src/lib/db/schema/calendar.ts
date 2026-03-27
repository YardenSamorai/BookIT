import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { businesses } from "./businesses";
import { staffMembers } from "./staff";

export const calendarConnections = pgTable(
  "calendar_connection",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => staffMembers.id, {
      onDelete: "cascade",
    }),
    provider: text("provider").notNull().default("GOOGLE"),
    googleEmail: text("google_email").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", {
      withTimezone: true,
    }).notNull(),
    calendarId: text("calendar_id").notNull().default("primary"),
    syncToken: text("sync_token"),
    channelId: text("channel_id"),
    channelExpiration: timestamp("channel_expiration", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("calendar_conn_business_staff_idx").on(
      table.businessId,
      table.staffId
    ),
    index("calendar_conn_business_idx").on(table.businessId),
  ]
);
