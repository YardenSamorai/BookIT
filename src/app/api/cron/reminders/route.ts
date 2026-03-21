import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  notificationPreferences,
  notificationLogs,
  services,
  staffMembers,
  customers,
  users,
  businesses,
} from "@/lib/db/schema";
import { sendBookingNotification } from "@/lib/notifications/send-notification";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let totalSent = 0;

  const allPrefs = await db.query.notificationPreferences.findMany({
    where: eq(notificationPreferences.whatsappEnabled, true),
  });

  for (const prefs of allPrefs) {
    const reminderWindows: number[] = [];

    const r1 = prefs.reminderHoursBefore ?? 24;
    reminderWindows.push(r1);

    const r2 = prefs.reminderHoursBefore2;
    if (r2 && r2 > 0) {
      reminderWindows.push(r2);
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, prefs.businessId),
      columns: { name: true },
    });
    const businessName = business?.name ?? "";

    for (const reminderHours of reminderWindows) {
      const windowStart = new Date(now.getTime() + (reminderHours - 0.25) * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (reminderHours + 0.25) * 60 * 60 * 1000);

      const upcomingAppointments = await db
        .select({
          id: appointments.id,
          businessId: appointments.businessId,
          customerId: appointments.customerId,
          startTime: appointments.startTime,
          serviceTitle: services.title,
          staffName: staffMembers.name,
        })
        .from(appointments)
        .innerJoin(services, eq(appointments.serviceId, services.id))
        .innerJoin(staffMembers, eq(appointments.staffId, staffMembers.id))
        .where(
          and(
            eq(appointments.businessId, prefs.businessId),
            eq(appointments.status, "CONFIRMED"),
            gte(appointments.startTime, windowStart),
            lt(appointments.startTime, windowEnd)
          )
        );

      for (const apt of upcomingAppointments) {
        const alreadySent = await db.query.notificationLogs.findFirst({
          where: and(
            eq(notificationLogs.appointmentId, apt.id),
            eq(notificationLogs.type, "REMINDER"),
            eq(notificationLogs.status, "SENT")
          ),
          columns: { id: true },
        });

        if (alreadySent && reminderWindows.length === 1) continue;

        if (alreadySent && reminderWindows.length > 1) {
          const allReminders = await db.query.notificationLogs.findMany({
            where: and(
              eq(notificationLogs.appointmentId, apt.id),
              eq(notificationLogs.type, "REMINDER")
            ),
            columns: { id: true },
          });
          if (allReminders.length >= reminderWindows.length) continue;
        }

        const customer = await db.query.customers.findFirst({
          where: eq(customers.id, apt.customerId),
          columns: { userId: true },
        });
        if (!customer) continue;

        const user = await db.query.users.findFirst({
          where: eq(users.id, customer.userId),
          columns: { phone: true, name: true },
        });
        if (!user?.phone) continue;

        const dateStr = new Date(apt.startTime).toLocaleDateString("he-IL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        const timeStr = new Date(apt.startTime).toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await sendBookingNotification({
          businessId: apt.businessId,
          appointmentId: apt.id,
          userId: customer.userId,
          recipientPhone: user.phone,
          type: "REMINDER",
          variables: {
            customerName: user.name || "",
            businessName,
            date: dateStr,
            time: timeStr,
            service: apt.serviceTitle,
            staff: apt.staffName,
          },
        });

        totalSent++;
      }
    }
  }

  return NextResponse.json({ ok: true, remindersSent: totalSent });
}
