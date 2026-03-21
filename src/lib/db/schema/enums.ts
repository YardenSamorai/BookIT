import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "BUSINESS_OWNER",
  "CUSTOMER",
  "BOTH",
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
