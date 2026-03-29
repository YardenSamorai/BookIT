"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signupSchema } from "@/validators/auth";
import { signIn } from "@/lib/auth/config";
import { createOtp, verifyOtp, checkRateLimit } from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/notifications/sms";
import type { ActionResult } from "@/types";

export async function registerBusinessOwner(
  input: z.infer<typeof signupSchema>
): Promise<ActionResult<{ userId: string }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError.message, field: firstError.path[0] as string };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return { success: false, error: "An account with this email already exists", field: "email" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "BUSINESS_OWNER",
      emailVerified: false,
    })
    .returning({ id: users.id });

  return { success: true, data: { userId: user.id } };
}

export async function loginBusinessOwner(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });
    return {};
  } catch {
    return { error: "Invalid email or password" };
  }
}

export async function requestPasswordReset(
  email: string
): Promise<ActionResult<{ phoneMasked: string }>> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
    columns: { id: true, phone: true },
  });

  if (!user) {
    return { success: false, error: "NO_ACCOUNT" };
  }

  if (!user.phone) {
    return { success: false, error: "NO_PHONE" };
  }

  const allowed = await checkRateLimit(user.phone);
  if (!allowed) {
    return { success: false, error: "RATE_LIMIT" };
  }

  const code = await createOtp(user.phone);
  await sendOtpSms(user.phone, code);

  const masked = user.phone.replace(/^(.{3})(.*)(.{2})$/, (_, a, m, z) =>
    a + m.replace(/./g, "*") + z
  );

  return { success: true, data: { phoneMasked: masked } };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<ActionResult<void>> {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
    columns: { id: true, phone: true },
  });

  if (!user?.phone) {
    return { success: false, error: "User not found" };
  }

  const otpResult = await verifyOtp(user.phone, code);
  if (!otpResult.valid) {
    return { success: false, error: otpResult.error || "Invalid code" };
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, user.id));

  return { success: true, data: undefined };
}
