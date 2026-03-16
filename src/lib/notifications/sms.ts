import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    return null;
  }
  return twilio(accountSid, authToken);
}

/**
 * Normalize an Israeli local phone number (e.g. 0526843000) to
 * international E.164 format (+972526843000).
 */
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

export async function sendSms(to: string, body: string): Promise<boolean> {
  const client = getClient();

  if (!client || !fromNumber) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV SMS] To: ${to} | Message: ${body}`);
      return true;
    }
    console.warn("Twilio not configured. SMS not sent.");
    return false;
  }

  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to: normalizePhone(to),
    });
    return true;
  } catch (err) {
    console.error("Failed to send SMS:", err);
    return false;
  }
}

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  const message = `BookIT - קוד האימות שלך: ${code}`;
  return sendSms(phone, message);
}
