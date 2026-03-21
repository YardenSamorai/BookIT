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
