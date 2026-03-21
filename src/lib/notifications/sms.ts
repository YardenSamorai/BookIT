import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const statusCallbackUrl = process.env.TWILIO_STATUS_CALLBACK_URL;

function getClient() {
  if (!accountSid || !authToken) {
    return null;
  }
  return twilio(accountSid, authToken);
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");

  if (cleaned.startsWith("0") && !cleaned.startsWith("00")) {
    cleaned = "+972" + cleaned.slice(1);
  }

  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

export interface SmsResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const result = await sendSmsWithDetails(to, body);
  return result.success;
}

export async function sendSmsWithDetails(to: string, body: string): Promise<SmsResult> {
  const client = getClient();

  if (!client || !fromNumber) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV SMS] To: ${to} | Message: ${body}`);
      return { success: true, messageSid: "dev-mock-sms" };
    }
    console.warn("Twilio not configured. SMS not sent.");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalizePhone(to),
      ...(statusCallbackUrl ? { statusCallback: statusCallbackUrl } : {}),
    });
    return { success: true, messageSid: message.sid };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to send SMS:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  const message = `BookIT - קוד האימות שלך: ${code}`;
  return sendSmsWithDetails(phone, message);
}
