"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signupSchema } from "@/validators/auth";
import { signIn } from "@/lib/auth/config";
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
