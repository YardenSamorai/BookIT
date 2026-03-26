import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const waNumber = process.env.TWILIO_WHATSAPP_NUMBER; // "whatsapp:+972XXXXXXXXX"
const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL;

function getClient() {
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

function normalizeWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("0") && !cleaned.startsWith("00")) {
    cleaned = "+972" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return `whatsapp:${cleaned}`;
}

export interface WhatsAppResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_OWNER"
  | "REMINDER"
  | "CANCELLATION"
  | "RESCHEDULE"
  | "STAFF_NEW_BOOKING"
  | "STAFF_CANCELLATION"
  | "STAFF_RESCHEDULE";

const TEMPLATE_SIDS: Partial<Record<NotificationType, string | undefined>> = {
  BOOKING_CONFIRMED: process.env.WA_TEMPLATE_BOOKING_CONFIRMED,
  BOOKING_OWNER: process.env.WA_TEMPLATE_BOOKING_OWNER,
  REMINDER: process.env.WA_TEMPLATE_REMINDER,
  CANCELLATION: process.env.WA_TEMPLATE_CANCELLED,
  RESCHEDULE: process.env.WA_TEMPLATE_RESCHEDULED,
};

/**
 * Build WhatsApp Content Template variables from our notification variables.
 * Each template has a specific variable order matching the approved template body.
 */
function buildTemplateVariables(
  type: NotificationType,
  vars: Record<string, string>
): Record<string, string> {
  const dateTime = `${vars.date || ""} בשעה ${vars.time || ""}`.trim();

  switch (type) {
    // {{1}}=customerName, {{2}}=businessName, {{3}}=dateTime, {{4}}=service
    case "BOOKING_CONFIRMED":
    case "REMINDER":
    case "CANCELLATION":
    case "RESCHEDULE":
      return {
        "1": vars.customerName || "",
        "2": vars.businessName || "",
        "3": dateTime,
        "4": vars.service || "",
      };
    // {{1}}=service, {{2}}=dateTime, {{3}}=staff, {{4}}=price, {{5}}=remaining, {{6}}=customerName
    case "BOOKING_OWNER":
      return {
        "1": vars.service || "",
        "2": dateTime,
        "3": vars.staff || "",
        "4": vars.price || "לא צוין",
        "5": vars.remainingSpots || "בדוק במערכת",
        "6": vars.customerName || "",
      };
    default:
      return {};
  }
}

export function getTemplateSid(type: NotificationType): string | undefined {
  const sid = TEMPLATE_SIDS[type];
  return sid || undefined;
}

export async function sendWhatsAppTemplate(
  to: string,
  contentSid: string,
  contentVariables: Record<string, string>
): Promise<WhatsAppResult> {
  const client = getClient();

  if (!client || !waNumber) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV WhatsApp Template] To: ${to} | SID: ${contentSid} | Vars:`, contentVariables);
      return { success: true, messageSid: "dev-mock-template" };
    }
    return { success: false, error: "Twilio WhatsApp not configured" };
  }

  try {
    const message = await client.messages.create({
      from: waNumber,
      to: normalizeWhatsAppPhone(to),
      contentSid,
      contentVariables: JSON.stringify(contentVariables),
      ...(statusCallbackUrl ? { statusCallback: statusCallbackUrl } : {}),
    });
    return { success: true, messageSid: message.sid };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send WhatsApp template:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

export { buildTemplateVariables };

export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<WhatsAppResult> {
  const client = getClient();

  if (!client || !waNumber) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV WhatsApp] To: ${to} | Message: ${body}`);
      return { success: true, messageSid: "dev-mock" };
    }
    return { success: false, error: "Twilio WhatsApp not configured" };
  }

  try {
    const message = await client.messages.create({
      from: waNumber,
      to: normalizeWhatsAppPhone(to),
      body,
      ...(statusCallbackUrl ? { statusCallback: statusCallbackUrl } : {}),
    });
    return { success: true, messageSid: message.sid };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send WhatsApp text:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
