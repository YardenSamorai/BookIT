import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, users } from "@/lib/db/schema";
import { sendWhatsAppTemplate, getTemplateSid, buildTemplateVariables } from "@/lib/notifications/whatsapp";

const rateLimitMap = new Map<string, number[]>();
const MAX_TESTS = 3;
const WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_TESTS) return false;
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return true;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  const [business, user] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.ownerId, session.user.id),
      columns: { name: true, phone: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { phone: true },
    }),
  ]);

  const phone = business?.phone || user?.phone;
  if (!phone) {
    return NextResponse.json({ error: "No phone number configured" }, { status: 400 });
  }

  const templateSid = getTemplateSid("BOOKING_CONFIRMED");
  if (!templateSid) {
    return NextResponse.json({ error: "No WhatsApp template configured" }, { status: 500 });
  }

  const vars = {
    customerName: "לקוח לדוגמה",
    businessName: business?.name ?? "BookIT",
    date: "01/04/2026",
    time: "10:00",
    service: "בדיקת חיבור",
    staff: "צוות",
  };

  const contentVars = buildTemplateVariables("BOOKING_CONFIRMED", vars);
  const result = await sendWhatsAppTemplate(phone, templateSid, contentVars);

  if (result.success) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: result.error }, { status: 500 });
}
