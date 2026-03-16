import { NextRequest, NextResponse } from "next/server";
import { otpSendSchema } from "@/validators/auth";
import { checkRateLimit, createOtp } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/notifications/sms";

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

    const sent = await sendOtpSms(phone, code);

    if (!sent && process.env.NODE_ENV !== "development") {
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
