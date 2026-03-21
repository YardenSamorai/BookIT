"use server";

import { requireBusinessOwner } from "@/lib/auth/guards";
import { syncTwilioMessagesCore } from "@/lib/notifications/sync-twilio";

export async function syncTwilioMessages(): Promise<{ synced: number; error?: string }> {
  const { businessId } = await requireBusinessOwner();

  try {
    const result = await syncTwilioMessagesCore(businessId);
    return { synced: result.synced };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    return { synced: 0, error: msg };
  }
}
