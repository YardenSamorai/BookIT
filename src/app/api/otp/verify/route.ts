import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { otpVerifySchema } from "@/validators/auth";
import { verifyOtp } from "@/lib/auth/otp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone, code, name } = parsed.data;

    const result = await verifyOtp(phone, code);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (!user) {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for new users", needsName: true },
          { status: 400 }
        );
      }

      const [newUser] = await db
        .insert(users)
        .values({
          phone,
          name,
          role: "CUSTOMER",
          phoneVerified: true,
        })
        .returning();

      user = newUser;
    } else {
      if (!user.name && !name) {
        return NextResponse.json(
          { error: "Name is required", needsName: true },
          { status: 400 }
        );
      }

      const updates: Record<string, unknown> = {};
      if (!user.phoneVerified) updates.phoneVerified = true;
      if (!user.name && name) updates.name = name;

      if (Object.keys(updates).length > 0) {
        await db
          .update(users)
          .set(updates)
          .where(eq(users.id, user.id));
        if (updates.name) user = { ...user, name: name! };
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isNew: !user.phoneVerified,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
