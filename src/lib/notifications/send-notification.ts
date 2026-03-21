import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, notificationPreferences, notificationLogs, users } from "@/lib/db/schema";
import { getLimitsForPlan, type PlanType } from "@/lib/plans/limits";
import { sendWhatsAppText, type WhatsAppResult } from "./whatsapp";
import { sendSmsWithDetails } from "./sms";
import { getTemplateForNotification, renderTemplate } from "./templates";

export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_OWNER"
  | "REMINDER"
  | "CANCELLATION"
  | "RESCHEDULE";

interface NotificationPayload {
  businessId: string;
  appointmentId?: string;
  userId?: string;
  recipientPhone: string;
  type: NotificationType;
  variables: Record<string, string>;
}

async function getBusinessInfo(businessId: string) {
  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { subscriptionPlan: true, language: true },
  });
  return {
    plan: (biz?.subscriptionPlan as PlanType) ?? "FREE",
    locale: (biz?.language as "en" | "he") ?? "he",
  };
}

async function getNotificationPrefs(businessId: string) {
  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.businessId, businessId),
  });
  return prefs ?? {
    whatsappEnabled: true,
    smsBookingEnabled: false,
    reminderHoursBefore: 24,
    reminderHoursBefore2: null,
  };
}

async function logNotification(
  payload: NotificationPayload,
  channel: "WHATSAPP" | "SMS",
  messageBody: string,
  result: { success: boolean; messageSid?: string; error?: string }
) {
  try {
    await db.insert(notificationLogs).values({
      businessId: payload.businessId,
      appointmentId: payload.appointmentId || null,
      userId: payload.userId || null,
      channel,
      type: payload.type,
      recipient: payload.recipientPhone,
      messageBody,
      status: result.success ? "SENT" : "FAILED",
      provider: "twilio",
      providerMessageId: result.messageSid || null,
      errorMessage: result.error || null,
      sentAt: result.success ? new Date() : null,
    });
  } catch (err) {
    console.error("Failed to log notification:", err);
  }
}

/**
 * Central notification dispatcher.
 * Loads templates, renders message body, sends via WhatsApp and/or SMS,
 * and logs all attempts with the full message body.
 */
export async function sendBookingNotification(
  payload: NotificationPayload
): Promise<WhatsAppResult> {
  console.log(`[Notification] Sending ${payload.type} to ${payload.recipientPhone}`);

  const { plan, locale } = await getBusinessInfo(payload.businessId);
  const limits = getLimitsForPlan(plan);

  if (!limits.whatsappNotifications) {
    console.log("[Notification] Blocked by plan limits");
    return { success: false, error: "PLAN_NOT_ALLOWED" };
  }

  const prefs = await getNotificationPrefs(payload.businessId);
  console.log(`[Notification] Prefs: whatsapp=${prefs.whatsappEnabled}, sms=${prefs.smsBookingEnabled}`);

  let whatsappResult: WhatsAppResult = { success: false, error: "DISABLED" };
  let smsResult: { success: boolean; messageSid?: string; error?: string } = { success: false, error: "DISABLED" };

  if (prefs.whatsappEnabled) {
    const waBody = await getTemplateForNotification(
      payload.businessId,
      payload.type,
      "WHATSAPP",
      locale
    );
    const renderedWa = renderTemplate(waBody, payload.variables);
    console.log(`[Notification] Sending WhatsApp to ${payload.recipientPhone}`);

    whatsappResult = await sendWhatsAppText(payload.recipientPhone, renderedWa);
    console.log(`[Notification] WhatsApp result:`, whatsappResult);
    await logNotification(payload, "WHATSAPP", renderedWa, whatsappResult);
  }

  if (prefs.smsBookingEnabled) {
    const smsBody = await getTemplateForNotification(
      payload.businessId,
      payload.type,
      "SMS",
      locale
    );
    const renderedSms = renderTemplate(smsBody, payload.variables);

    smsResult = await sendSmsWithDetails(payload.recipientPhone, renderedSms);
    console.log(`[Notification] SMS result:`, smsResult);
    await logNotification(payload, "SMS", renderedSms, smsResult);
  }

  if (whatsappResult.success) return whatsappResult;
  if (smsResult.success) return { success: true };
  return whatsappResult;
}

/**
 * Fire-and-forget wrapper for use in booking actions.
 * Never throws - failures are logged silently.
 */
export async function sendBookingNotificationSafe(
  payload: NotificationPayload
): Promise<void> {
  try {
    await sendBookingNotification(payload);
  } catch (err) {
    console.error("Notification send failed:", err);
  }
}

/**
 * Send notification to the business owner when a new booking is made.
 */
export async function sendOwnerBookingNotification(
  businessId: string,
  ownerId: string,
  variables: Record<string, string>
): Promise<void> {
  try {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, ownerId),
      columns: { phone: true, name: true },
    });

    if (!owner?.phone) {
      console.log("Owner notification skipped: no phone number");
      return;
    }

    const { plan, locale } = await getBusinessInfo(businessId);
    const limits = getLimitsForPlan(plan);
    if (!limits.whatsappNotifications) return;

    const prefs = await getNotificationPrefs(businessId);

    const ownerPayload: NotificationPayload = {
      businessId,
      recipientPhone: owner.phone,
      type: "BOOKING_OWNER",
      variables,
    };

    if (prefs.whatsappEnabled) {
      const waBody = await getTemplateForNotification(
        businessId,
        "BOOKING_OWNER",
        "WHATSAPP",
        locale
      );
      const rendered = renderTemplate(waBody, variables);
      const result = await sendWhatsAppText(owner.phone, rendered);
      await logNotification(ownerPayload, "WHATSAPP", rendered, result);
    }

    if (prefs.smsBookingEnabled) {
      const smsBody = await getTemplateForNotification(
        businessId,
        "BOOKING_OWNER",
        "SMS",
        locale
      );
      const rendered = renderTemplate(smsBody, variables);
      const result = await sendSmsWithDetails(owner.phone, rendered);
      await logNotification(ownerPayload, "SMS", rendered, result);
    }
  } catch (err) {
    console.error("Owner notification failed:", err);
  }
}

export { getNotificationPrefs };
