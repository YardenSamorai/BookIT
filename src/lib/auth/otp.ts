import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { otpVerifications } from "@/lib/db/schema";

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function checkRateLimit(phone: string): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const recentOtps = await db.query.otpVerifications.findMany({
    where: and(
      eq(otpVerifications.phone, phone),
      gt(otpVerifications.createdAt, windowStart)
    ),
  });

  return recentOtps.length < MAX_REQUESTS_PER_WINDOW;
}

export async function createOtp(phone: string): Promise<string> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(otpVerifications).values({
    phone,
    code,
    expiresAt,
  });

  return code;
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  // First try unverified OTPs
  let otp = await db.query.otpVerifications.findFirst({
    where: and(
      eq(otpVerifications.phone, phone),
      eq(otpVerifications.verified, false)
    ),
    orderBy: desc(otpVerifications.createdAt),
  });

  // If no unverified OTP, allow recently verified ones (for the name-step retry)
  if (!otp) {
    const recentWindow = new Date(Date.now() - 2 * 60 * 1000);
    otp = await db.query.otpVerifications.findFirst({
      where: and(
        eq(otpVerifications.phone, phone),
        eq(otpVerifications.verified, true),
        gt(otpVerifications.createdAt, recentWindow)
      ),
      orderBy: desc(otpVerifications.createdAt),
    });

    if (otp && otp.code === code) {
      return { valid: true };
    }

    return { valid: false, error: "No OTP found. Please request a new code." };
  }

  if (new Date() > otp.expiresAt) {
    return { valid: false, error: "OTP has expired. Please request a new code." };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return { valid: false, error: "Too many attempts. Please request a new code." };
  }

  if (otp.code !== code) {
    await db
      .update(otpVerifications)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(otpVerifications.id, otp.id));

    return { valid: false, error: "Invalid code. Please try again." };
  }

  await db
    .update(otpVerifications)
    .set({ verified: true })
    .where(eq(otpVerifications.id, otp.id));

  return { valid: true };
}
