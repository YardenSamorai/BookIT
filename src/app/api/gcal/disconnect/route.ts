import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { calendarConnections, staffBlockedSlots } from "@/lib/db/schema";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { revokeToken } from "@/lib/calendar/google-client";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const staffId: string | null = body.staffId || null;
  const businessId = session.user.businessId;

  const staffCondition = staffId
    ? eq(calendarConnections.staffId, staffId)
    : isNull(calendarConnections.staffId);

  const conn = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.businessId, businessId),
      staffCondition
    ),
  });

  if (!conn) {
    return NextResponse.json({ error: "Not connected" }, { status: 404 });
  }

  await revokeToken(conn.accessToken);

  // Clean up Google-synced blocked slots for this staff
  if (conn.staffId) {
    await db
      .delete(staffBlockedSlots)
      .where(
        and(
          eq(staffBlockedSlots.staffId, conn.staffId),
          isNotNull(staffBlockedSlots.googleEventId)
        )
      );
  }

  await db
    .delete(calendarConnections)
    .where(eq(calendarConnections.id, conn.id));

  return NextResponse.json({ success: true });
}
