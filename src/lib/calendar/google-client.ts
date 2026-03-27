import { google } from "googleapis";
import { db } from "@/lib/db";
import { calendarConnections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/gcal/callback`
  );
}

export function getAuthUrl(state: string) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function revokeToken(token: string) {
  const client = getOAuth2Client();
  try {
    await client.revokeToken(token);
  } catch {
    // Token may already be revoked
  }
}

export async function getAuthenticatedClient(connectionId: string) {
  const conn = await db.query.calendarConnections.findFirst({
    where: eq(calendarConnections.id, connectionId),
  });
  if (!conn) throw new Error("Calendar connection not found");

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: conn.accessToken,
    refresh_token: conn.refreshToken,
    expiry_date: conn.tokenExpiresAt.getTime(),
  });

  if (conn.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    await db
      .update(calendarConnections)
      .set({
        accessToken: credentials.access_token!,
        tokenExpiresAt: new Date(credentials.expiry_date!),
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, connectionId));
    client.setCredentials(credentials);
  }

  return { client, connection: conn };
}

export async function getGoogleEmail(accessToken: string): Promise<string> {
  const client = getOAuth2Client();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return data.email || "unknown";
}

export { google, SCOPES };
