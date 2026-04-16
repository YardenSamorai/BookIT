"use server";

import { eq, and, ne, or, ilike, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { customers, customerNotes, customerActivities, users } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import { auth } from "@/lib/auth/config";
import { normalizePhoneForStorage, phoneLookupCandidates } from "@/lib/utils/phone";
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

/**
 * Bulk-import customers from an uploaded spreadsheet. Safe to call in
 * batches from the client — the action is idempotent per canonical phone:
 * re-running with the same file will never create duplicates, never
 * overwrite existing users, and never "swap" an existing user's phone
 * with someone else's data.
 *
 * Failure modes handled:
 *   • Same phone formatted differently across rows (`050-1…` vs
 *     `+97250-1…`) — canonicalised so they collapse to one user.
 *   • Phone already belongs to a different user globally (e.g. the
 *     business owner previously typed that number for a different name)
 *     — we still link the customer row to the existing user (phones are
 *     globally unique), but we report it as `conflict` so the UI can
 *     surface it. We explicitly do NOT overwrite the existing user's name.
 *   • Invalid / missing name or phone — reported as `invalidRow`.
 *   • Duplicate rows within the same request batch — reported as
 *     `duplicateInBatch`.
 *   • Customer already exists in this business — reported as
 *     `alreadyInBusiness`.
 */
export async function importCustomers(
  rows: { name: string; phone: string; email?: string }[],
  initialStatus?: "LEAD" | "ACTIVE" | "INACTIVE"
): Promise<
  ActionResult<{
    imported: number;
    skipped: number;
    reasons: {
      invalidRow: number;
      duplicateInBatch: number;
      alreadyInBusiness: number;
      conflict: number;
      error: number;
    };
  }>
> {
  const { businessId } = await requireBusinessOwner();

  const reasons = {
    invalidRow: 0,
    duplicateInBatch: 0,
    alreadyInBusiness: 0,
    conflict: 0,
    error: 0,
  };
  let imported = 0;
  const seenCanonical = new Set<string>();

  for (const row of rows) {
    const name = row.name?.trim() ?? "";
    const canonical = normalizePhoneForStorage(row.phone);

    // Strict validation — bad rows never reach the DB.
    if (!name || name.length < 2 || !canonical) {
      reasons.invalidRow++;
      continue;
    }

    // Collapse identical phones appearing twice in the same request batch so
    // we never race against ourselves (two rows → two user inserts → unique
    // constraint violation on the second one).
    if (seenCanonical.has(canonical)) {
      reasons.duplicateInBatch++;
      continue;
    }
    seenCanonical.add(canonical);

    const email = row.email?.trim().toLowerCase() || null;

    try {
      // Look up by every possible formatting of this phone so that historical
      // rows stored before canonicalisation still match.
      const candidates = phoneLookupCandidates(canonical);
      const existingUser = candidates.length
        ? await db.query.users.findFirst({
            where: inArray(users.phone, candidates),
            columns: { id: true, name: true, phone: true, email: true },
          })
        : undefined;

      let userId: string;
      let isConflict = false;

      if (existingUser) {
        userId = existingUser.id;

        // A phone that already belongs to a differently-named user is a
        // soft conflict: we still reuse the user (phones are globally unique
        // so we cannot create a second one), but we DO NOT overwrite their
        // name/email with the imported values. The UI surfaces this count
        // so the owner can review.
        const existingNameLc = (existingUser.name ?? "").trim().toLowerCase();
        const importedNameLc = name.toLowerCase();
        if (existingNameLc && existingNameLc !== importedNameLc) {
          isConflict = true;
        }

        // Normalise the stored phone on the existing user so subsequent
        // lookups hit the canonical form and we slowly clean up historical
        // inconsistent data — but only for the phone itself, never for name.
        if (existingUser.phone !== canonical) {
          await db
            .update(users)
            .set({ phone: canonical, updatedAt: new Date() })
            .where(eq(users.id, existingUser.id));
        }
      } else {
        // Email is globally unique too; if it collides with someone else we
        // silently drop it from the insert so the row doesn't fail outright.
        let emailToInsert: string | null = email;
        if (emailToInsert) {
          const emailClash = await db.query.users.findFirst({
            where: eq(users.email, emailToInsert),
            columns: { id: true },
          });
          if (emailClash) {
            emailToInsert = null;
            isConflict = true;
          }
        }

        const [newUser] = await db
          .insert(users)
          .values({
            name,
            phone: canonical,
            email: emailToInsert,
            role: "CUSTOMER",
          })
          .returning({ id: users.id });
        userId = newUser.id;
      }

      // Is this user already a customer of THIS business? (Unique index on
      // business_id + user_id guarantees we cannot duplicate.)
      const existingCustomer = await db.query.customers.findFirst({
        where: and(
          eq(customers.businessId, businessId),
          eq(customers.userId, userId)
        ),
        columns: { id: true },
      });

      if (existingCustomer) {
        reasons.alreadyInBusiness++;
        continue;
      }

      await db
        .insert(customers)
        .values({
          businessId,
          userId,
          ...(initialStatus ? { status: initialStatus } : {}),
        });
      imported++;
      if (isConflict) reasons.conflict++;
    } catch (err) {
      console.error("[importCustomers] row failed:", err);
      reasons.error++;
    }
  }

  const skipped =
    reasons.invalidRow +
    reasons.duplicateInBatch +
    reasons.alreadyInBusiness +
    reasons.error;

  revalidatePath("/dashboard/customers");
  return { success: true, data: { imported, skipped, reasons } };
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

  // Use the shared canonicalizer so manual-add and import paths produce
  // byte-identical phone strings in the DB — essential for dedup.
  const phone = normalizePhoneForStorage(data.phone);
  if (!data.name?.trim() || !phone) {
    return { success: false, error: "Name and phone are required." };
  }

  const email = data.email?.trim() || null;

  const byPhone = await db.query.users.findFirst({
    where: inArray(users.phone, phoneLookupCandidates(phone)),
    columns: { id: true },
  });

  const byEmail = email
    ? await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true },
      })
    : undefined;

  let userId: string;
  if (byPhone) {
    userId = byPhone.id;
  } else if (byEmail) {
    userId = byEmail.id;
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name.trim(),
        phone,
        email,
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
    let targetUserId = customer.userId;

    if (data.name !== undefined || data.phone !== undefined || data.email !== undefined) {
      if (data.name !== undefined) {
        const trimmed = data.name.trim();
        if (!trimmed || trimmed.length < 2)
          return { success: false, error: "Name must be at least 2 characters." };
      }

      const cleanPhone = data.phone !== undefined
        ? data.phone.replace(/[^+\d]/g, "")
        : undefined;
      if (cleanPhone !== undefined && (!cleanPhone || cleanPhone.length < 9))
        return { success: false, error: "Invalid phone number." };

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        return { success: false, error: "Invalid email address." };

      let phoneConflict: { id: string } | undefined;
      let emailConflict: { id: string } | undefined;

      if (cleanPhone) {
        phoneConflict =
          (await db.query.users.findFirst({
            where: and(eq(users.phone, cleanPhone), ne(users.id, targetUserId)),
            columns: { id: true },
          })) ?? undefined;
      }

      if (data.email) {
        emailConflict =
          (await db.query.users.findFirst({
            where: and(
              eq(users.email, data.email),
              ne(users.id, targetUserId),
              ...(phoneConflict ? [ne(users.id, phoneConflict.id)] : []),
            ),
            columns: { id: true },
          })) ?? undefined;
      }

      if (phoneConflict && emailConflict && phoneConflict.id !== emailConflict.id) {
        return {
          success: false,
          error: "Phone and email belong to different existing accounts.",
        };
      }

      const relink = phoneConflict || emailConflict;

      if (relink) {
        const dupeInBiz = await db.query.customers.findFirst({
          where: and(
            eq(customers.businessId, businessId),
            eq(customers.userId, relink.id),
          ),
          columns: { id: true },
        });
        if (dupeInBiz) {
          return {
            success: false,
            error: phoneConflict
              ? "This phone number belongs to another customer in your business."
              : "This email belongs to another customer in your business.",
          };
        }

        targetUserId = relink.id;
        await db
          .update(customers)
          .set({ userId: relink.id, updatedAt: new Date() })
          .where(eq(customers.id, customerId));
      }

      const userSet: Record<string, unknown> = {};
      if (data.name !== undefined) userSet.name = data.name.trim();
      if (!relink) {
        if (cleanPhone !== undefined) userSet.phone = cleanPhone;
        if (data.email !== undefined) userSet.email = data.email || null;
      }

      if (Object.keys(userSet).length > 0) {
        await db
          .update(users)
          .set({ ...userSet, updatedAt: new Date() })
          .where(eq(users.id, targetUserId));
      }
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

// ─── Customer Self-Service actions ─────────────────────────────────────────────

export async function updateCustomerSelfProfile(data: {
  firstName: string;
  lastName: string;
  email?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || firstName.length < 2) {
    return { success: false, error: "First name must be at least 2 characters.", field: "firstName" };
  }
  if (!lastName || lastName.length < 1) {
    return { success: false, error: "Last name is required.", field: "lastName" };
  }

  const email = data.email?.trim() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Invalid email address.", field: "email" };
  }

  try {
    if (email) {
      const emailConflict = await db.query.users.findFirst({
        where: and(eq(users.email, email), ne(users.id, session.user.id)),
        columns: { id: true },
      });
      if (emailConflict) {
        return { success: false, error: "This email is already in use.", field: "email" };
      }
    }

    const fullName = `${firstName} ${lastName}`;
    await db
      .update(users)
      .set({
        firstName,
        lastName,
        name: fullName,
        email: email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));
  } catch (err: unknown) {
    const cause = (err as { cause?: Record<string, unknown> })?.cause;
    const code = (cause?.code as string) ?? (err as { code?: string })?.code;
    if (code === "23505") {
      return { success: false, error: "This email is already in use.", field: "email" };
    }
    return { success: false, error: "Failed to update profile." };
  }

  return { success: true, data: undefined };
}

export async function completeCustomerOnboarding(data: {
  firstName: string;
  lastName: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated." };
  }

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  if (!firstName || firstName.length < 2) {
    return { success: false, error: "First name must be at least 2 characters." };
  }
  if (!lastName || lastName.length < 1) {
    return { success: false, error: "Last name is required." };
  }

  const fullName = `${firstName} ${lastName}`;
  await db
    .update(users)
    .set({ firstName, lastName, name: fullName, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true, data: undefined };
}

export async function searchCustomers(
  query: string
): Promise<{ id: string; name: string; phone: string | null; email: string | null; status: string }[]> {
  const { businessId } = await requireBusinessOwner();
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const pattern = `%${q}%`;
  const results = await db
    .select({
      id: customers.id,
      name: users.name,
      phone: users.phone,
      email: users.email,
      status: customers.status,
    })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(
        eq(customers.businessId, businessId),
        ne(customers.status, "ARCHIVED"),
        or(
          ilike(users.name, pattern),
          ilike(users.phone, pattern),
          ilike(users.email, pattern),
        )
      )
    )
    .limit(8);

  return results.map((r) => ({
    id: r.id,
    name: r.name ?? "",
    phone: r.phone,
    email: r.email,
    status: r.status,
  }));
}
