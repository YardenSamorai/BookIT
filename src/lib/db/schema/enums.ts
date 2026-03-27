import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "BUSINESS_OWNER",
  "CUSTOMER",
  "BOTH",
  "SUPER_ADMIN",
]);

export const businessTypeEnum = pgEnum("business_type", [
  "BARBER",
  "BEAUTY",
  "FITNESS",
  "TUTOR",
  "CLINIC",
  "GENERIC",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "FREE",
  "STARTER",
  "PRO",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "PAST_DUE",
  "CANCELLED",
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "FULL",
  "DEPOSIT",
  "ON_SITE",
  "CONTACT_FOR_PRICE",
  "FREE",
]);

export const approvalTypeEnum = pgEnum("approval_type", [
  "AUTO",
  "MANUAL",
]);

export const staffAssignmentModeEnum = pgEnum("staff_assignment_mode", [
  "SPECIFIC",
  "LIST",
  "ANY",
]);

export const packagePaymentStatusEnum = pgEnum("package_payment_status", [
  "PAID",
  "PENDING",
  "FAILED",
]);

export const customerPackageStatusEnum = pgEnum("customer_package_status", [
  "ACTIVE",
  "EXPIRED",
  "FULLY_USED",
  "CANCELLED",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

export const appointmentPaymentStatusEnum = pgEnum("appointment_payment_status", [
  "UNPAID",
  "PAID",
  "DEPOSIT_PAID",
  "REFUNDED",
  "ON_SITE",
  "FREE",
  "PACKAGE",
]);

export const appointmentSourceEnum = pgEnum("appointment_source", [
  "ONLINE",
  "DASHBOARD",
  "WALK_IN",
]);

export const cancelledByEnum = pgEnum("cancelled_by", [
  "CUSTOMER",
  "BUSINESS",
]);

export const performedByEnum = pgEnum("performed_by", [
  "SYSTEM",
  "CUSTOMER",
  "BUSINESS",
]);

export const ctaModeEnum = pgEnum("cta_mode", [
  "BOOK_SERVICE",
  "EXTERNAL_LINK",
  "NONE",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "EMAIL",
  "WHATSAPP",
  "SMS",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "BOOKING_CONFIRMED",
  "BOOKING_OWNER",
  "REMINDER",
  "CANCELLATION",
  "RESCHEDULE",
  "OTP",
  "MANUAL",
  "STAFF_NEW_BOOKING",
  "STAFF_CANCELLATION",
  "STAFF_RESCHEDULE",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
]);

export const classInstanceStatusEnum = pgEnum("class_instance_status", [
  "SCHEDULED",
  "CANCELLED",
]);

// ── New Card System enums ──

export const cardStatusEnum = pgEnum("card_status", [
  "PENDING_PAYMENT",
  "ACTIVE",
  "EXPIRED",
  "FULLY_USED",
  "CANCELLED",
  "REFUNDED",
]);

export const cardPaymentStatusEnum = pgEnum("card_payment_status", [
  "PAID",
  "PENDING",
  "FAILED",
  "REFUNDED",
]);

export const cardPaymentMethodEnum = pgEnum("card_payment_method", [
  "CASH",
  "TRANSFER",
  "STRIPE",
  "ON_SITE",
  "OTHER",
]);

export const cardUsageActionEnum = pgEnum("card_usage_action", [
  "ACTIVATED",
  "USED",
  "RESTORED",
  "MANUAL_ADD",
  "MANUAL_DEDUCT",
  "EXPIRED",
  "CANCELLED",
]);

export const cardSourceEnum = pgEnum("card_source", [
  "PUBLIC_SITE",
  "DASHBOARD",
  "MANUAL_GRANT",
  "IMPORT",
]);

export const cardActorTypeEnum = pgEnum("card_actor_type", [
  "SYSTEM",
  "STAFF",
  "CUSTOMER",
  "CRON",
]);

// ── Customer Profile V2 enums ──

export const customerLifecycleStatusEnum = pgEnum("customer_lifecycle_status", [
  "LEAD",
  "ACTIVE",
  "INACTIVE",
  "BLOCKED",
  "ARCHIVED",
]);

export const customerActivityTypeEnum = pgEnum("customer_activity_type", [
  "CREATED",
  "PROFILE_UPDATED",
  "STATUS_CHANGED",
  "APPOINTMENT_BOOKED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_COMPLETED",
  "APPOINTMENT_NO_SHOW",
  "CARD_PURCHASED",
  "CARD_ACTIVATED",
  "CARD_USED",
  "CARD_RESTORED",
  "CARD_CANCELLED",
  "PAYMENT_UPDATED",
  "NOTE_ADDED",
  "TAG_UPDATED",
]);

export const activityActorTypeEnum = pgEnum("activity_actor_type", [
  "SYSTEM",
  "STAFF",
  "CUSTOMER",
]);

export const billingStatusEnum = pgEnum("billing_status", [
  "PENDING",
  "PAID",
  "OVERDUE",
  "WAIVED",
]);
