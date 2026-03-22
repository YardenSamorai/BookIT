import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerCards, cardUsages } from "@/lib/db/schema";
import type { PgTransaction } from "drizzle-orm/pg-core";

type TxOrDb = typeof db;

interface MutateCardSessionsInput {
  customerCardId: string;
  delta: number;
  action:
    | "ACTIVATED"
    | "USED"
    | "RESTORED"
    | "MANUAL_ADD"
    | "MANUAL_DEDUCT"
    | "EXPIRED"
    | "CANCELLED";
  appointmentId?: string | null;
  actorType: "SYSTEM" | "STAFF" | "CUSTOMER" | "CRON";
  performedByUserId?: string | null;
  notes?: string | null;
}

interface MutateResult {
  success: boolean;
  error?: string;
  sessionsRemaining?: number;
  sessionsUsed?: number;
  sessionsTotal?: number;
  newStatus?: string;
}

/**
 * Single ledger function for ALL session counter mutations.
 * Must be called within a db.transaction() for safety.
 *
 * Enforces:
 * - Row-level lock (SELECT ... FOR UPDATE)
 * - Idempotency (no duplicate USED entries for same appointmentId)
 * - Integrity (used + remaining = total) via DB CHECK constraints
 * - Auto status transitions (FULLY_USED / ACTIVE)
 */
export async function mutateCardSessions(
  tx: TxOrDb,
  input: MutateCardSessionsInput
): Promise<MutateResult> {
  const {
    customerCardId,
    delta,
    action,
    appointmentId,
    actorType,
    performedByUserId,
    notes,
  } = input;

  // 1. Acquire row lock
  const [card] = await tx.execute(
    sql`SELECT id, sessions_total, sessions_used, sessions_remaining, status
        FROM customer_card
        WHERE id = ${customerCardId}
        FOR UPDATE`
  );

  if (!card) {
    return { success: false, error: "Card not found" };
  }

  const currentTotal = card.sessions_total as number;
  const currentUsed = card.sessions_used as number;
  const currentRemaining = card.sessions_remaining as number;
  const currentStatus = card.status as string;

  // 2. Guard: don't mutate terminal cards (except restore from FULLY_USED)
  if (
    ["CANCELLED", "REFUNDED", "EXPIRED"].includes(currentStatus) &&
    delta > 0 &&
    action !== "MANUAL_ADD"
  ) {
    return {
      success: false,
      error: `Card is ${currentStatus}, cannot modify`,
    };
  }

  // 3. Idempotency: check no duplicate USED for same appointment
  if (appointmentId && action === "USED") {
    const [existing] = await tx
      .select({ id: cardUsages.id })
      .from(cardUsages)
      .where(
        and(
          eq(cardUsages.customerCardId, customerCardId),
          eq(cardUsages.appointmentId, appointmentId),
          eq(cardUsages.action, "USED")
        )
      )
      .limit(1);

    if (existing) {
      return { success: false, error: "Session already deducted for this appointment" };
    }
  }

  // 4. Compute new values
  let newRemaining: number;
  let newUsed: number;
  let newTotal: number;

  if (action === "MANUAL_ADD") {
    // Adding sessions increases both total and remaining
    newTotal = currentTotal + delta;
    newUsed = currentUsed;
    newRemaining = currentRemaining + delta;
  } else if (action === "MANUAL_DEDUCT") {
    // Deducting removes from remaining, increases used
    newTotal = currentTotal;
    newUsed = currentUsed + Math.abs(delta);
    newRemaining = currentRemaining + delta; // delta is negative
  } else if (delta < 0) {
    // USED: deduct session
    newTotal = currentTotal;
    newUsed = currentUsed + Math.abs(delta);
    newRemaining = currentRemaining + delta;
  } else {
    // RESTORED: give back session
    newTotal = currentTotal;
    newUsed = currentUsed - delta;
    newRemaining = currentRemaining + delta;
  }

  // 5. Validate
  if (newRemaining < 0) {
    return { success: false, error: "Not enough sessions remaining" };
  }
  if (newUsed < 0) {
    return { success: false, error: "Sessions used cannot be negative" };
  }
  if (newUsed + newRemaining !== newTotal) {
    return {
      success: false,
      error: `Integrity violation: ${newUsed} + ${newRemaining} != ${newTotal}`,
    };
  }

  // 6. Determine status transition
  let newStatus = currentStatus;
  let closedAt: Date | null = null;

  if (newRemaining === 0 && currentStatus === "ACTIVE") {
    newStatus = "FULLY_USED";
    closedAt = new Date();
  } else if (
    newRemaining > 0 &&
    currentStatus === "FULLY_USED"
  ) {
    newStatus = "ACTIVE";
    closedAt = null;
  }

  // 7. Atomic UPDATE
  await tx
    .update(customerCards)
    .set({
      sessionsUsed: newUsed,
      sessionsRemaining: newRemaining,
      sessionsTotal: newTotal,
      status: newStatus as typeof customerCards.$inferSelect.status,
      closedAt,
      updatedAt: new Date(),
    })
    .where(eq(customerCards.id, customerCardId));

  // 8. Insert audit trail
  await tx.insert(cardUsages).values({
    customerCardId,
    appointmentId: appointmentId || null,
    action,
    deltaSessions: delta,
    actorType,
    performedByUserId: performedByUserId || null,
    notes: notes || null,
  });

  return {
    success: true,
    sessionsRemaining: newRemaining,
    sessionsUsed: newUsed,
    sessionsTotal: newTotal,
    newStatus,
  };
}

/**
 * Convenience wrapper that handles the transaction for simple cases.
 */
export async function mutateCardSessionsWithTx(
  input: MutateCardSessionsInput
): Promise<MutateResult> {
  return db.transaction(async (tx) => {
    return mutateCardSessions(tx as unknown as TxOrDb, input);
  });
}
