"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { customers, customerNotes, users } from "@/lib/db/schema";
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

export async function importCustomers(
  rows: { name: string; phone: string; email?: string }[]
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const { businessId } = await requireBusinessOwner();

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const phone = row.phone?.replace(/[^+\d]/g, "");
    if (!row.name?.trim() || !phone) {
      skipped++;
      continue;
    }

    try {
      const existing = await db.query.users.findFirst({
        where: eq(users.phone, phone),
        columns: { id: true },
      });

      let userId: string;
      if (existing) {
        userId = existing.id;
      } else {
        const [newUser] = await db
          .insert(users)
          .values({ name: row.name.trim(), phone, role: "CUSTOMER" })
          .returning({ id: users.id });
        userId = newUser.id;
      }

      const existingCustomer = await db.query.customers.findFirst({
        where: and(eq(customers.businessId, businessId), eq(customers.userId, userId)),
        columns: { id: true },
      });

      if (existingCustomer) {
        skipped++;
        continue;
      }

      await db.insert(customers).values({ businessId, userId });
      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/dashboard/customers");
  return { success: true, data: { imported, skipped } };
}

export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));

  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}
