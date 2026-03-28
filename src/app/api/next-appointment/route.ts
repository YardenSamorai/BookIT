import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getNextUpcomingAppointment } from "@/lib/db/queries/appointments";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ appointment: null });
  }

  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ appointment: null });
  }

  const apt = await getNextUpcomingAppointment(session.user.id, businessId);

  if (!apt) {
    return NextResponse.json({ appointment: null });
  }

  return NextResponse.json({
    appointment: {
      id: apt.id,
      startTime: apt.startTime.toISOString(),
      endTime: apt.endTime.toISOString(),
      serviceName: apt.serviceName,
      staffName: apt.staffName,
    },
  });
}
