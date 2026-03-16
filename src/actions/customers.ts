"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { customers, customerNotes } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import type { ActionResult } from "@/types";

export async function addCustomerNote(
  customerId: string,
  businessId: string,
  content: string
): Promise<ActionResult<{ noteId: string }>> {
  const { session } = await requireBusinessOwner();

  if (!content.trim()) {
    return { success: false, error: "Note content is required." };
  }

  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.businessId, businessId)),
    columns: { id: true },
  });

  if (!customer) {
    return { success: false, error: "Customer not found." };
  }

  const [note] = await db
    .insert(customerNotes)
    .values({
      customerId,
      businessId,
      authorName: session.user.name ?? "Owner",
      content: content.trim(),
    })
    .returning({ id: customerNotes.id });

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true, data: { noteId: note.id } };
}

export async function updateCustomerTags(
  customerId: string,
  tags: string[]
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(customers)
    .set({ tags, updatedAt: new Date() })
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}
