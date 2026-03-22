import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { customers, users } from "@/lib/db/schema";
import { findActiveCardsForService } from "@/lib/db/queries/cards";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const businessId = searchParams.get("businessId");
  const serviceId = searchParams.get("serviceId");
  const phone = searchParams.get("phone");
  const customerId = searchParams.get("customerId");

  if (!businessId || !serviceId) {
    return NextResponse.json({ cards: [] });
  }

  let resolvedCustomerId = customerId;

  if (!resolvedCustomerId && phone) {
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    const user = await db.query.users.findFirst({
      where: eq(users.phone, cleanPhone),
      columns: { id: true },
    });
    if (user) {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.businessId, businessId),
          eq(customers.userId, user.id)
        ),
        columns: { id: true },
      });
      resolvedCustomerId = customer?.id ?? null;
    }
  }

  if (!resolvedCustomerId) {
    return NextResponse.json({ cards: [] });
  }

  const cards = await findActiveCardsForService(resolvedCustomerId, serviceId);

  return NextResponse.json({
    cards: cards.map((c) => ({
      id: c.id,
      name: c.templateSnapshotName,
      sessionsRemaining: c.sessionsRemaining,
      sessionsTotal: c.sessionsTotal,
      expiresAt: c.expiresAt,
    })),
  });
}
