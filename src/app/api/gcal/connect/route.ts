import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getAuthUrl } from "@/lib/calendar/google-client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staffId = request.nextUrl.searchParams.get("staffId");

  const state = JSON.stringify({
    businessId: session.user.businessId,
    staffId: staffId || null,
  });

  const stateEncoded = Buffer.from(state).toString("base64url");
  const url = getAuthUrl(stateEncoded);

  return NextResponse.redirect(url);
}
