import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import {
  cardStatusEnum,
  cardPaymentStatusEnum,
  cardPaymentMethodEnum,
  cardUsageActionEnum,
  cardSourceEnum,
  cardActorTypeEnum,
} from "./enums";
import { businesses } from "./businesses";
import { services } from "./services";
import { customers } from "./customers";
import { users } from "./users";
import { appointments } from "./appointments";

// ─── card_template ──────────────────────────────────────────────────────────

export const cardTemplates = pgTable(
  "card_template",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sessionCount: integer("session_count").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    expirationDays: integer("expiration_days"),
    isActive: boolean("is_active").notNull().default(true),
    isPurchasable: boolean("is_purchasable").notNull().default(false),
    isArchived: boolean("is_archived").notNull().default(false),
    restoreOnLateCancel: boolean("restore_on_late_cancel")
      .notNull()
      .default(false),
    restoreOnNoShow: boolean("restore_on_no_show").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("card_template_business_idx").on(table.businessId),
    index("card_template_active_idx").on(
      table.businessId,
      table.isActive,
      table.isArchived
    ),
  ]
);

// ─── card_template_service (many-to-many) ───────────────────────────────────

export const cardTemplateServices = pgTable(
  "card_template_service",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cardTemplateId: uuid("card_template_id")
      .notNull()
      .references(() => cardTemplates.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("card_template_service_unique").on(
      table.cardTemplateId,
      table.serviceId
    ),
    index("card_template_service_template_idx").on(table.cardTemplateId),
    index("card_template_service_service_idx").on(table.serviceId),
  ]
);

// ─── customer_card ──────────────────────────────────────────────────────────

export const customerCards = pgTable(
  "customer_card",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    cardTemplateId: uuid("card_template_id").references(
      () => cardTemplates.id,
      { onDelete: "set null" }
    ),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    // Snapshot fields (immutable after creation)
    templateSnapshotName: text("template_snapshot_name").notNull(),
    templateSnapshotDescription: text("template_snapshot_description"),
    templateSnapshotSessionCount: integer(
      "template_snapshot_session_count"
    ).notNull(),
    templateSnapshotPrice: decimal("template_snapshot_price", {
      precision: 10,
      scale: 2,
    }).notNull(),
    templateSnapshotExpirationDays: integer(
      "template_snapshot_expiration_days"
    ),
    snapshotRestoreOnLateCancel: boolean("snapshot_restore_on_late_cancel")
      .notNull()
      .default(false),
    snapshotRestoreOnNoShow: boolean("snapshot_restore_on_no_show")
      .notNull()
      .default(false),

    // Session tracking (mutated ONLY via mutateCardSessions ledger)
    sessionsTotal: integer("sessions_total").notNull(),
    sessionsUsed: integer("sessions_used").notNull().default(0),
    sessionsRemaining: integer("sessions_remaining").notNull(),

    // Status
    status: cardStatusEnum("status").notNull().default("PENDING_PAYMENT"),

    // Payment
    paymentStatus: cardPaymentStatusEnum("payment_status")
      .notNull()
      .default("PENDING"),
    paymentMethod: cardPaymentMethodEnum("payment_method")
      .notNull()
      .default("OTHER"),
    stripePaymentId: text("stripe_payment_id"),
    paymentConfirmedAt: timestamp("payment_confirmed_at", {
      withTimezone: true,
    }),

    // Source
    source: cardSourceEnum("source").notNull().default("DASHBOARD"),

    notes: text("notes"),
    purchasedAt: timestamp("purchased_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("customer_card_customer_idx").on(table.customerId),
    index("customer_card_business_idx").on(table.businessId, table.customerId),
    index("customer_card_status_idx").on(table.businessId, table.status),
    index("customer_card_eligibility_idx").on(
      table.customerId,
      table.status,
      table.paymentStatus,
      table.sessionsRemaining
    ),
    check(
      "customer_card_sessions_total_gte_0",
      sql`${table.sessionsTotal} >= 0`
    ),
    check(
      "customer_card_sessions_used_gte_0",
      sql`${table.sessionsUsed} >= 0`
    ),
    check(
      "customer_card_sessions_remaining_gte_0",
      sql`${table.sessionsRemaining} >= 0`
    ),
    check(
      "customer_card_sessions_integrity",
      sql`${table.sessionsUsed} + ${table.sessionsRemaining} = ${table.sessionsTotal}`
    ),
  ]
);

// ─── card_usage (audit trail) ───────────────────────────────────────────────

export const cardUsages = pgTable(
  "card_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerCardId: uuid("customer_card_id")
      .notNull()
      .references(() => customerCards.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, {
      onDelete: "set null",
    }),
    action: cardUsageActionEnum("action").notNull(),
    deltaSessions: integer("delta_sessions").notNull(),
    actorType: cardActorTypeEnum("actor_type").notNull(),
    performedByUserId: uuid("performed_by_user_id").references(
      () => users.id,
      { onDelete: "set null" }
    ),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("card_usage_card_idx").on(table.customerCardId),
    index("card_usage_appointment_idx").on(table.appointmentId),
    index("card_usage_created_idx").on(table.customerCardId, table.createdAt),
  ]
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const cardTemplateRelations = relations(cardTemplates, ({ one, many }) => ({
  business: one(businesses, {
    fields: [cardTemplates.businessId],
    references: [businesses.id],
  }),
  services: many(cardTemplateServices),
  customerCards: many(customerCards),
}));

export const cardTemplateServiceRelations = relations(
  cardTemplateServices,
  ({ one }) => ({
    cardTemplate: one(cardTemplates, {
      fields: [cardTemplateServices.cardTemplateId],
      references: [cardTemplates.id],
    }),
    service: one(services, {
      fields: [cardTemplateServices.serviceId],
      references: [services.id],
    }),
  })
);

export const customerCardRelations = relations(customerCards, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerCards.customerId],
    references: [customers.id],
  }),
  cardTemplate: one(cardTemplates, {
    fields: [customerCards.cardTemplateId],
    references: [cardTemplates.id],
  }),
  business: one(businesses, {
    fields: [customerCards.businessId],
    references: [businesses.id],
  }),
  usages: many(cardUsages),
}));

export const cardUsageRelations = relations(cardUsages, ({ one }) => ({
  customerCard: one(customerCards, {
    fields: [cardUsages.customerCardId],
    references: [customerCards.id],
  }),
  appointment: one(appointments, {
    fields: [cardUsages.appointmentId],
    references: [appointments.id],
  }),
  performedBy: one(users, {
    fields: [cardUsages.performedByUserId],
    references: [users.id],
  }),
}));
