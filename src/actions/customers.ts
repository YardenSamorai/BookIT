"use server";

import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { customers, customerNotes, customerActivities, users } from "@/lib/db/schema";
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

export async function updateCustomerName(
  customerId: string,
  name: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Name is required." };

  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.businessId, businessId)),
    columns: { userId: true },
  });

  if (!customer) return { success: false, error: "Customer not found." };

  await db
    .update(users)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(users.id, customer.userId));

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}

export async function addCustomer(data: {
  name: string;
  phone: string;
  email?: string;
}): Promise<ActionResult<{ customerId: string }>> {
  const { businessId } = await requireBusinessOwner();

  const phone = data.phone?.replace(/[^+\d]/g, "");
  if (!data.name?.trim() || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

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
      .values({
        name: data.name.trim(),
        phone,
        email: data.email?.trim() || null,
        role: "CUSTOMER",
      })
      .returning({ id: users.id });
    userId = newUser.id;
  }

  const existingCustomer = await db.query.customers.findFirst({
    where: and(eq(customers.businessId, businessId), eq(customers.userId, userId)),
    columns: { id: true },
  });

  if (existingCustomer) {
    return { success: false, error: "Customer already exists." };
  }

  const [customer] = await db
    .insert(customers)
    .values({ businessId, userId })
    .returning({ id: customers.id });

  revalidatePath("/dashboard/customers");
  return { success: true, data: { customerId: customer.id } };
}

export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));

  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}

// ─── Customer Profile V2 actions ────────────────────────────────────────────

export async function logCustomerActivity(
  customerId: string,
  businessId: string,
  type: (typeof customerActivities.$inferInsert)["type"],
  opts: {
    actorType: "SYSTEM" | "STAFF" | "CUSTOMER";
    actorUserId?: string | null;
    actorName: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  await db.insert(customerActivities).values({
    customerId,
    businessId,
    type,
    actorType: opts.actorType,
    actorUserId: opts.actorUserId ?? null,
    actorName: opts.actorName,
    entityType: opts.entityType ?? null,
    entityId: opts.entityId ?? null,
    metadata: opts.metadata ?? null,
  });
}

export async function updateCustomerProfile(
  customerId: string,
  data: {
    name?: string;
    phone?: string;
    email?: string | null;
    birthday?: string | null;
    address?: string | null;
    source?: string | null;
    gender?: string | null;
    preferredLanguage?: string | null;
    generalNotes?: string | null;
    smsOptIn?: boolean;
    whatsappOptIn?: boolean;
    emailMarketingOptIn?: boolean;
    reminderChannel?: string | null;
  }
): Promise<ActionResult> {
  const { businessId, session } = await requireBusinessOwner();

  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.businessId, businessId)),
    columns: { userId: true },
  });
  if (!customer) return { success: false, error: "Customer not found." };

  try {
    if (data.name !== undefined || data.phone !== undefined || data.email !== undefined) {
      if (data.name !== undefined) {
        const trimmed = data.name.trim();
        if (!trimmed || trimmed.length < 2)
          return { success: false, error: "Name must be at least 2 characters." };
      }

      if (data.phone !== undefined) {
        const phone = data.phone.replace(/[^+\d]/g, "");
        if (!phone || phone.length < 9)
          return { success: false, error: "Invalid phone number." };
        const existing = await db.query.users.findFirst({
          where: and(eq(users.phone, phone), ne(users.id, customer.userId)),
          columns: { id: true },
        });
        if (existing) {
          return {
            success: false,
            error: "This phone number is already registered to another account in the system. The same phone cannot be used for multiple accounts.",
          };
        }
      }

      if (data.email !== undefined && data.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          return { success: false, error: "Invalid email address." };
        const existing = await db.query.users.findFirst({
          where: and(eq(users.email, data.email), ne(users.id, customer.userId)),
          columns: { id: true },
        });
        if (existing) {
          return {
            success: false,
            error: "This email is already registered to another account in the system.",
          };
        }
      }

      await db
        .update(users)
        .set({
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.phone !== undefined
            ? { phone: data.phone.replace(/[^+\d]/g, "") }
            : {}),
          ...(data.email !== undefined
            ? { email: data.email || null }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, customer.userId));
    }

    await db
      .update(customers)
      .set({
        ...(data.birthday !== undefined ? { birthday: data.birthday } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.gender !== undefined ? { gender: data.gender } : {}),
        ...(data.preferredLanguage !== undefined
          ? { preferredLanguage: data.preferredLanguage }
          : {}),
        ...(data.generalNotes !== undefined
          ? { generalNotes: data.generalNotes }
          : {}),
        ...(data.smsOptIn !== undefined ? { smsOptIn: data.smsOptIn } : {}),
        ...(data.whatsappOptIn !== undefined
          ? { whatsappOptIn: data.whatsappOptIn }
          : {}),
        ...(data.emailMarketingOptIn !== undefined
          ? { emailMarketingOptIn: data.emailMarketingOptIn }
          : {}),
        ...(data.reminderChannel !== undefined
          ? { reminderChannel: data.reminderChannel }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    await logCustomerActivity(customerId, businessId, "PROFILE_UPDATED", {
      actorType: "STAFF",
      actorUserId: session.user.id,
      actorName: session.user.name ?? "Owner",
    });
  } catch (err: unknown) {
    console.error("[updateCustomerProfile] DB error:", err);

    const cause = (err as { cause?: Record<string, unknown> })?.cause;
    const code = (cause?.code as string) ?? (err as { code?: string })?.code;
    const detail =
      String(cause?.detail ?? "") ||
      String((err as { detail?: string })?.detail ?? "") ||
      (err instanceof Error ? err.message : String(err));

    if (code === "23505") {
      if (detail.includes("email"))
        return { success: false, error: "This email is already in use." };
      if (detail.includes("phone"))
        return { success: false, error: "This phone number is already in use." };
      return {
        success: false,
        error: "A user with this email or phone already exists.",
      };
    }

    return {
      success: false,
      error: "Failed to update profile. Please try again.",
    };
  }

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}

export async function updateCustomerStatus(
  customerId: string,
  newStatus: "LEAD" | "ACTIVE" | "INACTIVE" | "BLOCKED" | "ARCHIVED"
): Promise<ActionResult> {
  const { businessId, session } = await requireBusinessOwner();

  const customer = await db.query.customers.findFirst({
    where: and(eq(customers.id, customerId), eq(customers.businessId, businessId)),
    columns: { status: true },
  });
  if (!customer) return { success: false, error: "Customer not found." };

  const oldStatus = customer.status;
  if (oldStatus === newStatus) return { success: true, data: undefined };

  await db
    .update(customers)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(customers.id, customerId));

  await logCustomerActivity(customerId, businessId, "STATUS_CHANGED", {
    actorType: "STAFF",
    actorUserId: session.user.id,
    actorName: session.user.name ?? "Owner",
    metadata: { oldStatus, newStatus },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}

export async function archiveCustomer(customerId: string): Promise<ActionResult> {
  return updateCustomerStatus(customerId, "ARCHIVED");
}

export async function updateGeneralNotes(
  customerId: string,
  generalNotes: string
): Promise<ActionResult> {
  const { businessId, session } = await requireBusinessOwner();

  await db
    .update(customers)
    .set({ generalNotes, updatedAt: new Date() })
    .where(and(eq(customers.id, customerId), eq(customers.businessId, businessId)));

  await logCustomerActivity(customerId, businessId, "PROFILE_UPDATED", {
    actorType: "STAFF",
    actorUserId: session.user.id,
    actorName: session.user.name ?? "Owner",
    metadata: { field: "generalNotes" },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true, data: undefined };
}
