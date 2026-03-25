import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte, count, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  classInstances,
  classSchedules,
  services,
  staffMembers,
  appointments,
} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get("businessId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  if (!businessId || !dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "Missing required parameters: businessId, dateFrom, dateTo" },
      { status: 400 }
    );
  }

  try {
    const instances = await db
      .select({
        id: classInstances.id,
        classScheduleId: classInstances.classScheduleId,
        serviceId: classInstances.serviceId,
        staffId: classInstances.staffId,
        date: classInstances.date,
        startTime: classInstances.startTime,
        endTime: classInstances.endTime,
        maxParticipants: classInstances.maxParticipants,
        status: classInstances.status,
        serviceName: sql<string>`COALESCE(${classSchedules.title}, ${services.title})`.as("service_name"),
        staffName: staffMembers.name,
      })
      .from(classInstances)
      .innerJoin(services, eq(classInstances.serviceId, services.id))
      .innerJoin(staffMembers, eq(classInstances.staffId, staffMembers.id))
      .innerJoin(classSchedules, eq(classInstances.classScheduleId, classSchedules.id))
      .where(
        and(
          eq(classInstances.businessId, businessId),
          gte(classInstances.date, dateFrom),
          lte(classInstances.date, dateTo),
          eq(classInstances.status, "SCHEDULED")
        )
      );

    const enriched = await Promise.all(
      instances.map(async (inst) => {
        const [result] = await db
          .select({ value: count() })
          .from(appointments)
          .where(
            and(
              eq(appointments.classInstanceId, inst.id),
              eq(appointments.status, "CONFIRMED")
            )
          );
        return {
          ...inst,
          startTime: new Date(inst.startTime).toISOString(),
          endTime: new Date(inst.endTime).toISOString(),
          bookedCount: result?.value ?? 0,
        };
      })
    );

    return NextResponse.json({ instances: enriched });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch workout instances" },
      { status: 500 }
    );
  }
}
