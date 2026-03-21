import { NextRequest, NextResponse } from "next/server";
import { otpSendSchema } from "@/validators/auth";
import { checkRateLimit, createOtp } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/notifications/sms";
import { db } from "@/lib/db";
import { notificationLogs } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpSendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;

    const withinLimit = await checkRateLimit(phone);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait before trying again." },
        { status: 429 }
      );
    }

    const code = await createOtp(phone);

    const result = await sendOtpSms(phone, code);

    try {
      const messageBody = `BookIT - קוד האימות שלך: ${code}`;
      await db.insert(notificationLogs).values({
        businessId: null,
        channel: "SMS",
        type: "OTP",
        recipient: phone,
        messageBody,
        status: result.success ? "SENT" : "FAILED",
        provider: "twilio",
        providerMessageId: result.messageSid || null,
        errorMessage: result.error || null,
        sentAt: result.success ? new Date() : null,
      });
    } catch {
      // logging failure should not block OTP flow
    }

    if (!result.success && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Failed to send SMS. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
