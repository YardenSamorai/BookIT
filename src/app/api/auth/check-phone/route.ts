import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.phone, phone),
      columns: { id: true, name: true },
    });

    return NextResponse.json({
      exists: !!user,
      hasName: !!user?.name,
    });
  } catch {
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
