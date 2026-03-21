import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, notificationPreferences, notificationLogs } from "@/lib/db/schema";
import { getLimitsForPlan, type PlanType } from "@/lib/plans/limits";
import { sendWhatsAppText, type WhatsAppResult } from "./whatsapp";
import { sendSms } from "./sms";
import { getTemplateForNotification, renderTemplate } from "./templates";

export type NotificationType =
  | "BOOKING_CONFIRMED"
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
    emailEnabled: true,
    smsEnabled: false,
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
  const { plan, locale } = await getBusinessInfo(payload.businessId);
  const limits = getLimitsForPlan(plan);

  if (!limits.whatsappNotifications) {
    return { success: false, error: "PLAN_NOT_ALLOWED" };
  }

  const prefs = await getNotificationPrefs(payload.businessId);

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

    whatsappResult = await sendWhatsAppText(payload.recipientPhone, renderedWa);
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

    const sent = await sendSms(payload.recipientPhone, renderedSms);
    smsResult = sent
      ? { success: true, messageSid: undefined }
      : { success: false, error: "SMS send failed" };
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

export { getNotificationPrefs };
