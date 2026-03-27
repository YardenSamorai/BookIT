import { google } from "googleapis";
import { db } from "@/lib/db";
import {
  appointments,
  calendarConnections,
  services,
  staffMembers,
  customers,
  users,
  businesses,
  staffBlockedSlots,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getAuthenticatedClient } from "./google-client";

// ── Outbound: Bookit → Google Calendar ──

export async function pushEventToGoogle(appointmentId: string) {
  const apt = await getAppointmentWithDetails(appointmentId);
  if (!apt) return;

  const conn = await findConnection(apt.businessId, apt.staffId);
  if (!conn) return;

  try {
    const { client, connection } = await getAuthenticatedClient(conn.id);
    const calendar = google.calendar({ version: "v3", auth: client });

    const event = buildGoogleEvent(apt);

    const res = await calendar.events.insert({
      calendarId: connection.calendarId,
      requestBody: event,
    });

    if (res.data.id) {
      await db
        .update(appointments)
        .set({ googleEventId: res.data.id })
        .where(eq(appointments.id, appointmentId));
    }

    console.log(`[GCal] Created event ${res.data.id} for appointment ${appointmentId}`);
  } catch (err) {
    console.error(`[GCal] Failed to push event for ${appointmentId}:`, err);
  }
}

export async function updateGoogleEvent(appointmentId: string) {
  const apt = await getAppointmentWithDetails(appointmentId);
  if (!apt?.googleEventId) return;

  const conn = await findConnection(apt.businessId, apt.staffId);
  if (!conn) return;

  try {
    const { client, connection } = await getAuthenticatedClient(conn.id);
    const calendar = google.calendar({ version: "v3", auth: client });

    const event = buildGoogleEvent(apt);

    await calendar.events.update({
      calendarId: connection.calendarId,
      eventId: apt.googleEventId,
      requestBody: event,
    });

    console.log(`[GCal] Updated event ${apt.googleEventId}`);
  } catch (err) {
    console.error(`[GCal] Failed to update event for ${appointmentId}:`, err);
  }
}

export async function deleteGoogleEvent(appointmentId: string) {
  const apt = await getAppointmentWithDetails(appointmentId);
  if (!apt?.googleEventId) return;

  const conn = await findConnection(apt.businessId, apt.staffId);
  if (!conn) return;

  try {
    const { client, connection } = await getAuthenticatedClient(conn.id);
    const calendar = google.calendar({ version: "v3", auth: client });

    await calendar.events.delete({
      calendarId: connection.calendarId,
      eventId: apt.googleEventId,
    });

    console.log(`[GCal] Deleted event ${apt.googleEventId}`);
  } catch (err) {
    console.error(`[GCal] Failed to delete event for ${appointmentId}:`, err);
  }
}

// ── Inbound: Google Calendar → Bookit ──

export async function syncInboundChanges(connectionId: string) {
  const { client, connection } = await getAuthenticatedClient(connectionId);
  const calendar = google.calendar({ version: "v3", auth: client });

  const staffId = connection.staffId;
  if (!staffId) return;

  try {
    const params: {
      calendarId: string;
      singleEvents: boolean;
      maxResults: number;
      syncToken?: string;
      timeMin?: string;
    } = {
      calendarId: connection.calendarId,
      singleEvents: true,
      maxResults: 250,
    };

    if (connection.syncToken) {
      params.syncToken = connection.syncToken;
    } else {
      params.timeMin = new Date().toISOString();
    }

    let nextPageToken: string | undefined;
    let newSyncToken: string | undefined;

    do {
      const res = await calendar.events.list({
        ...params,
        ...(nextPageToken ? { pageToken: nextPageToken } : {}),
      });

      const events = res.data.items || [];
      newSyncToken = res.data.nextSyncToken || undefined;
      nextPageToken = res.data.nextPageToken || undefined;

      for (const event of events) {
        if (event.extendedProperties?.private?.bookitId) continue;

        if (event.status === "cancelled" && event.id) {
          await db
            .delete(staffBlockedSlots)
            .where(eq(staffBlockedSlots.googleEventId, event.id));
          continue;
        }

        if (!event.start?.dateTime || !event.end?.dateTime || !event.id) continue;

        const startTime = new Date(event.start.dateTime);
        const endTime = new Date(event.end.dateTime);

        const existing = await db.query.staffBlockedSlots.findFirst({
          where: eq(staffBlockedSlots.googleEventId, event.id),
        });

        if (existing) {
          await db
            .update(staffBlockedSlots)
            .set({
              startTime,
              endTime,
              reason: event.summary || "Google Calendar",
            })
            .where(eq(staffBlockedSlots.id, existing.id));
        } else {
          await db.insert(staffBlockedSlots).values({
            staffId,
            startTime,
            endTime,
            reason: event.summary || "Google Calendar",
            googleEventId: event.id,
          });
        }
      }
    } while (nextPageToken);

    if (newSyncToken) {
      await db
        .update(calendarConnections)
        .set({ syncToken: newSyncToken, updatedAt: new Date() })
        .where(eq(calendarConnections.id, connectionId));
    }

    console.log(`[GCal] Inbound sync complete for connection ${connectionId}`);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 410) {
      await db
        .update(calendarConnections)
        .set({ syncToken: null, updatedAt: new Date() })
        .where(eq(calendarConnections.id, connectionId));
      console.log(`[GCal] Sync token expired for ${connectionId}, will do full sync next time`);
    } else {
      console.error(`[GCal] Inbound sync error for ${connectionId}:`, err);
    }
  }
}

export async function setupWebhookChannel(connectionId: string) {
  const { client, connection } = await getAuthenticatedClient(connectionId);
  const calendar = google.calendar({ version: "v3", auth: client });

  const channelId = `bookit-${connectionId}-${Date.now()}`;
  const baseUrl = process.env.NEXTAUTH_URL;
  if (!baseUrl) return;

  try {
    const res = await calendar.events.watch({
      calendarId: connection.calendarId,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: `${baseUrl}/api/gcal/webhook`,
        token: connectionId,
      },
    });

    await db
      .update(calendarConnections)
      .set({
        channelId,
        channelExpiration: res.data.expiration
          ? new Date(Number(res.data.expiration))
          : null,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connectionId));

    console.log(`[GCal] Webhook channel set up: ${channelId}`);
  } catch (err) {
    console.error(`[GCal] Failed to set up webhook for ${connectionId}:`, err);
  }
}

// ── Helpers ──

async function getAppointmentWithDetails(appointmentId: string) {
  const [row] = await db
    .select({
      id: appointments.id,
      businessId: appointments.businessId,
      staffId: appointments.staffId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      notes: appointments.notes,
      googleEventId: appointments.googleEventId,
      serviceName: services.title,
      customerName: users.name,
      customerPhone: users.phone,
      businessName: businesses.name,
      businessAddress: businesses.address,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .innerJoin(businesses, eq(appointments.businessId, businesses.id))
    .where(eq(appointments.id, appointmentId));

  return row || null;
}

async function findConnection(businessId: string, staffId: string) {
  let conn = await db.query.calendarConnections.findFirst({
    where: and(
      eq(calendarConnections.businessId, businessId),
      eq(calendarConnections.staffId, staffId)
    ),
  });

  if (!conn) {
    conn = await db.query.calendarConnections.findFirst({
      where: and(
        eq(calendarConnections.businessId, businessId),
        isNull(calendarConnections.staffId)
      ),
    });
  }

  return conn || null;
}

function buildGoogleEvent(apt: NonNullable<Awaited<ReturnType<typeof getAppointmentWithDetails>>>) {
  return {
    summary: `${apt.serviceName} - ${apt.customerName}`,
    description: [
      `Customer: ${apt.customerName}`,
      apt.customerPhone ? `Phone: ${apt.customerPhone}` : null,
      apt.notes ? `Notes: ${apt.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    start: {
      dateTime: apt.startTime.toISOString(),
      timeZone: "Asia/Jerusalem",
    },
    end: {
      dateTime: apt.endTime.toISOString(),
      timeZone: "Asia/Jerusalem",
    },
    location: apt.businessAddress || undefined,
    extendedProperties: {
      private: {
        bookitId: apt.id,
      },
    },
  };
}
