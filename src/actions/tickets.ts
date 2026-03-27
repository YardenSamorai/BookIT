"use server";

import { db } from "@/lib/db";
import { supportTickets, businesses, users } from "@/lib/db/schema";
import { requireBusinessOwner, requireSuperAdmin } from "@/lib/auth/guards";
import { eq, desc, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Business Owner Actions ──

export async function createTicket(subject: string, description: string) {
  const { userId, businessId } = await requireBusinessOwner();

  if (!subject.trim() || !description.trim()) {
    return { success: false, error: "Subject and description are required" };
  }

  await db.insert(supportTickets).values({
    businessId,
    userId,
    subject: subject.trim(),
    description: description.trim(),
  });

  revalidatePath("/dashboard/tickets");
  return { success: true };
}

export async function getMyTickets() {
  const { businessId } = await requireBusinessOwner();

  return db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      priority: supportTickets.priority,
      adminNotes: supportTickets.adminNotes,
      resolvedAt: supportTickets.resolvedAt,
      createdAt: supportTickets.createdAt,
    })
    .from(supportTickets)
    .where(eq(supportTickets.businessId, businessId))
    .orderBy(desc(supportTickets.createdAt));
}

// ── Admin Actions ──

export async function getAllTickets(statusFilter?: string) {
  await requireSuperAdmin();

  const conditions = statusFilter
    ? and(
        eq(
          supportTickets.status,
          statusFilter as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
        )
      )
    : undefined;

  return db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      priority: supportTickets.priority,
      adminNotes: supportTickets.adminNotes,
      resolvedAt: supportTickets.resolvedAt,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      businessName: businesses.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(supportTickets)
    .leftJoin(businesses, eq(supportTickets.businessId, businesses.id))
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .where(conditions)
    .orderBy(desc(supportTickets.createdAt));
}

export async function updateTicketStatus(
  ticketId: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED",
  adminNotes?: string
) {
  await requireSuperAdmin();

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (adminNotes !== undefined) {
    updates.adminNotes = adminNotes;
  }

  if (status === "RESOLVED") {
    updates.resolvedAt = new Date();
  }

  await db
    .update(supportTickets)
    .set(updates)
    .where(eq(supportTickets.id, ticketId));

  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
  return { success: true };
}

export async function getTicketStats() {
  await requireSuperAdmin();

  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      open: sql<number>`count(*) filter (where ${supportTickets.status} = 'OPEN')`,
      inProgress: sql<number>`count(*) filter (where ${supportTickets.status} = 'IN_PROGRESS')`,
      resolved: sql<number>`count(*) filter (where ${supportTickets.status} = 'RESOLVED')`,
      closed: sql<number>`count(*) filter (where ${supportTickets.status} = 'CLOSED')`,
    })
    .from(supportTickets);

  return result;
}
