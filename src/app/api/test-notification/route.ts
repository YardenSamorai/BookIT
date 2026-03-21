import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { sendWhatsAppText } from "@/lib/notifications/whatsapp";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const phone = body.phone as string;
  if (!phone) {
    return NextResponse.json({ error: "Phone required" }, { status: 400 });
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.ownerId, session.user.id),
    columns: { name: true },
  });

  const testMessage = `🧪 הודעת בדיקה מ-BookIT!\n\nזוהי הודעת בדיקה מהעסק "${business?.name ?? "BookIT"}".\nאם קיבלת הודעה זו, החיבור ל-WhatsApp עובד כמו שצריך! ✅`;

  const result = await sendWhatsAppText(phone, testMessage);

  if (result.success) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: result.error }, { status: 500 });
}
