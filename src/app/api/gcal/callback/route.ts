import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { calendarConnections } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import {
  exchangeCode,
  getGoogleEmail,
} from "@/lib/calendar/google-client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.redirect(new URL("/dashboard/settings", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateEncoded = request.nextUrl.searchParams.get("state");

  if (!code || !stateEncoded) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?gcal=error", request.url)
    );
  }

  let state: { businessId: string; staffId: string | null };
  try {
    state = JSON.parse(Buffer.from(stateEncoded, "base64url").toString());
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?gcal=error", request.url)
    );
  }

  if (state.businessId !== session.user.businessId) {
    return NextResponse.redirect(
      new URL("/dashboard/settings?gcal=error", request.url)
    );
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?gcal=error", request.url)
      );
    }

    const email = await getGoogleEmail(tokens.access_token);

    const staffCondition = state.staffId
      ? eq(calendarConnections.staffId, state.staffId)
      : isNull(calendarConnections.staffId);

    const existing = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.businessId, state.businessId),
        staffCondition
      ),
    });

    if (existing) {
      await db
        .update(calendarConnections)
        .set({
          googleEmail: email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600_000),
          syncToken: null,
          channelId: null,
          channelExpiration: null,
          updatedAt: new Date(),
        })
        .where(eq(calendarConnections.id, existing.id));
    } else {
      await db.insert(calendarConnections).values({
        businessId: state.businessId,
        staffId: state.staffId,
        googleEmail: email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600_000),
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/settings?gcal=connected", request.url)
    );
  } catch (err) {
    console.error("[GCal Callback] Error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?gcal=error", request.url)
    );
  }
}
