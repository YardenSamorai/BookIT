import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, classSchedules } from "@/lib/db/schema";
import { getAvailability } from "@/lib/scheduling/availability";
import {
  getClassInstancesForRange,
  getInstanceBookingCount,
} from "@/lib/db/queries/classes";

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

    const isGroup = service?.isGroup ?? false;

    let classInstanceSlots: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      maxParticipants: number;
      bookedCount: number;
      staffId: string;
      staffName: string;
      serviceName: string;
    }[] = [];

    if (isGroup) {
      const hasSchedules = await db.query.classSchedules.findFirst({
        where: and(
          eq(classSchedules.businessId, businessId),
          eq(classSchedules.serviceId, serviceId),
          eq(classSchedules.isActive, true)
        ),
        columns: { id: true },
      });

      if (hasSchedules) {
        const instances = await getClassInstancesForRange(businessId, dateFrom, dateTo);
        const serviceInstances = instances.filter((ci) => ci.serviceId === serviceId);

        classInstanceSlots = await Promise.all(
          serviceInstances.map(async (ci) => ({
            id: ci.id,
            date: ci.date,
            startTime: new Date(ci.startTime).toISOString(),
            endTime: new Date(ci.endTime).toISOString(),
            maxParticipants: ci.maxParticipants,
            bookedCount: await getInstanceBookingCount(ci.id),
            staffId: ci.staffId,
            staffName: ci.staffName,
            serviceName: ci.serviceName,
          }))
        );
      }
    }

    return NextResponse.json({
      days: availability,
      isGroup,
      maxParticipants: service?.maxParticipants ?? 1,
      classInstances: classInstanceSlots,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to compute availability" },
      { status: 500 }
    );
  }
}
