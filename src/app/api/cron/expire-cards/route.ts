import { NextRequest, NextResponse } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerCards, cardUsages } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 1. Expire active cards past their expiresAt
  const expiredCards = await db
    .update(customerCards)
    .set({
      status: "EXPIRED",
      closedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(customerCards.status, "ACTIVE"),
        lt(customerCards.expiresAt, now)
      )
    )
    .returning({ id: customerCards.id });

  // Log expiry for each card
  if (expiredCards.length > 0) {
    await db.insert(cardUsages).values(
      expiredCards.map((c) => ({
        customerCardId: c.id,
        action: "EXPIRED" as const,
        deltaSessions: 0,
        actorType: "CRON" as const,
        notes: "Auto-expired by cron",
      }))
    );
  }

  // 2. Cancel stale PENDING_PAYMENT cards (older than 72 hours)
  const staleCutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const staleCards = await db
    .update(customerCards)
    .set({
      status: "CANCELLED",
      closedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(customerCards.status, "PENDING_PAYMENT"),
        lt(customerCards.createdAt, staleCutoff)
      )
    )
    .returning({ id: customerCards.id });

  if (staleCards.length > 0) {
    await db.insert(cardUsages).values(
      staleCards.map((c) => ({
        customerCardId: c.id,
        action: "CANCELLED" as const,
        deltaSessions: 0,
        actorType: "CRON" as const,
        notes: "Auto-cancelled: payment not confirmed within 72 hours",
      }))
    );
  }

  return NextResponse.json({
    expired: expiredCards.length,
    cancelledStale: staleCards.length,
    timestamp: now.toISOString(),
  });
}
