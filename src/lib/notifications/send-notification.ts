import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, notificationPreferences, notificationLogs, users, staffMembers, customers } from "@/lib/db/schema";
import { getLimitsForPlan, type PlanType } from "@/lib/plans/limits";
import { sendWhatsAppText, sendWhatsAppTemplate, getTemplateSid, buildTemplateVariables, type WhatsAppResult } from "./whatsapp";
import { sendSmsWithDetails } from "./sms";
import { getTemplateForNotification, renderTemplate } from "./templates";

export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_OWNER"
  | "REMINDER"
  | "CANCELLATION"
  | "RESCHEDULE"
  | "STAFF_NEW_BOOKING"
  | "STAFF_CANCELLATION"
  | "STAFF_RESCHEDULE";

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

  const isCustomerFacing = !payload.type.startsWith("STAFF_") && payload.type !== "BOOKING_OWNER";
  let customerWhatsappOptIn = true;
  let customerSmsOptIn = true;

  if (isCustomerFacing && payload.userId) {
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.businessId, payload.businessId),
        eq(customers.userId, payload.userId)
      ),
      columns: { whatsappOptIn: true, smsOptIn: true },
    });
    if (customer) {
      customerWhatsappOptIn = customer.whatsappOptIn;
      customerSmsOptIn = customer.smsOptIn;
    }
  }

  let whatsappResult: WhatsAppResult = { success: false, error: "DISABLED" };
  let smsResult: { success: boolean; messageSid?: string; error?: string } = { success: false, error: "DISABLED" };
  let whatsappAttempted = false;

  if (prefs.whatsappEnabled && customerWhatsappOptIn) {
    const templateSid = getTemplateSid(payload.type);

    if (templateSid) {
      const contentVars = buildTemplateVariables(payload.type, payload.variables);
      console.log(`[Notification] Sending WhatsApp template ${templateSid} to ${payload.recipientPhone}`);
      whatsappResult = await sendWhatsAppTemplate(payload.recipientPhone, templateSid, contentVars);
      whatsappAttempted = true;
      console.log(`[Notification] WhatsApp template result:`, whatsappResult);
      await logNotification(payload, "WHATSAPP", `[Template: ${templateSid}] vars: ${JSON.stringify(contentVars)}`, whatsappResult);
    } else {
      console.log(`[Notification] No WhatsApp template for ${payload.type}, skipping WhatsApp (freeform blocked by WhatsApp policy)`);
    }
  }

  // Send SMS if explicitly enabled, OR as automatic fallback when WhatsApp failed/wasn't attempted
  const shouldSendSms =
    (prefs.smsBookingEnabled && customerSmsOptIn) ||
    (!whatsappResult.success && customerSmsOptIn);

  if (shouldSendSms) {
    const smsBody = await getTemplateForNotification(
      payload.businessId,
      payload.type,
      "SMS",
      locale
    );
    const renderedSms = renderTemplate(smsBody, payload.variables);

    smsResult = await sendSmsWithDetails(payload.recipientPhone, renderedSms);
    console.log(`[Notification] SMS ${whatsappAttempted && !whatsappResult.success ? "(fallback)" : ""} result:`, smsResult);
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
    const [owner, biz] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, ownerId),
        columns: { phone: true, name: true },
      }),
      db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { phone: true },
      }),
    ]);

    const ownerPhone = owner?.phone || biz?.phone;
    if (!ownerPhone) {
      console.log("Owner notification skipped: no phone on user or business");
      return;
    }

    const { plan, locale } = await getBusinessInfo(businessId);
    const limits = getLimitsForPlan(plan);
    if (!limits.whatsappNotifications) return;

    const prefs = await getNotificationPrefs(businessId);

    const ownerPayload: NotificationPayload = {
      businessId,
      recipientPhone: ownerPhone,
      type: "BOOKING_OWNER",
      variables,
    };

    let waSuccess = false;
    if (prefs.whatsappEnabled) {
      const templateSid = getTemplateSid("BOOKING_OWNER");
      if (templateSid) {
        const contentVars = buildTemplateVariables("BOOKING_OWNER", variables);
        const result = await sendWhatsAppTemplate(ownerPhone, templateSid, contentVars);
        await logNotification(ownerPayload, "WHATSAPP", `[Template: ${templateSid}] vars: ${JSON.stringify(contentVars)}`, result);
        waSuccess = result.success;
      }
    }

    if (prefs.smsBookingEnabled || !waSuccess) {
      const smsBody = await getTemplateForNotification(
        businessId,
        "BOOKING_OWNER",
        "SMS",
        locale
      );
      const rendered = renderTemplate(smsBody, variables);
      const result = await sendSmsWithDetails(ownerPhone, rendered);
      await logNotification(ownerPayload, "SMS", rendered, result);
    }
  } catch (err) {
    console.error("Owner notification failed:", err);
  }
}

/**
 * Send notification to the assigned staff member for booking events.
 * Looks up staff phone number, sends via WhatsApp/SMS based on business prefs.
 */
export async function sendStaffNotification(
  businessId: string,
  staffId: string,
  type: "STAFF_NEW_BOOKING" | "STAFF_CANCELLATION" | "STAFF_RESCHEDULE",
  variables: Record<string, string>
): Promise<void> {
  try {
    const staff = await db.query.staffMembers.findFirst({
      where: eq(staffMembers.id, staffId),
      columns: { phone: true, name: true },
    });

    if (!staff?.phone) {
      console.log(`[StaffNotification] Skipped: staff ${staffId} has no phone`);
      return;
    }

    const { plan, locale } = await getBusinessInfo(businessId);
    const limits = getLimitsForPlan(plan);
    if (!limits.whatsappNotifications) return;

    const prefs = await getNotificationPrefs(businessId);

    const staffPayload: NotificationPayload = {
      businessId,
      recipientPhone: staff.phone,
      type,
      variables,
    };

    let waSuccess = false;
    if (prefs.whatsappEnabled) {
      const templateSid = getTemplateSid(type);
      if (templateSid) {
        const contentVars = buildTemplateVariables(type, variables);
        const result = await sendWhatsAppTemplate(staff.phone, templateSid, contentVars);
        await logNotification(staffPayload, "WHATSAPP", `[Template: ${templateSid}] vars: ${JSON.stringify(contentVars)}`, result);
        waSuccess = result.success;
      } else {
        console.log(`[StaffNotification] No WhatsApp template for ${type}, skipping WhatsApp`);
      }
    }

    if (prefs.smsBookingEnabled || !waSuccess) {
      const smsBody = await getTemplateForNotification(businessId, type, "SMS", locale);
      const rendered = renderTemplate(smsBody, variables);
      const result = await sendSmsWithDetails(staff.phone, rendered);
      await logNotification(staffPayload, "SMS", rendered, result);
    }
  } catch (err) {
    console.error("Staff notification failed:", err);
  }
}

export { getNotificationPrefs };
