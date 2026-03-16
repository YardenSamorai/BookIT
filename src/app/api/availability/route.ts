import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { getAvailability } from "@/lib/scheduling/availability";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get("businessId");
  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId") || undefined;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!businessId || !serviceId || !dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "Missing required parameters: businessId, serviceId, dateFrom, dateTo" },
      { status: 400 }
    );
  }

  try {
    const [availability, service] = await Promise.all([
      getAvailability({ businessId, serviceId, staffId, dateFrom, dateTo }),
      db.query.services.findFirst({
        where: eq(services.id, serviceId),
        columns: { isGroup: true, maxParticipants: true },
      }),
    ]);

    return NextResponse.json({
      days: availability,
      isGroup: service?.isGroup ?? false,
      maxParticipants: service?.maxParticipants ?? 1,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to compute availability" },
      { status: 500 }
    );
  }
}
