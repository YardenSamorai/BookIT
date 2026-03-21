"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { customerPackages, servicePackages } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import type { ActionResult } from "@/types";

export async function assignCustomerPackage(
  customerId: string,
  packageId: string,
  paymentStatus: "PAID" | "PENDING" = "PAID"
): Promise<ActionResult<{ id: string }>> {
  const { businessId } = await requireBusinessOwner();

  const pkg = await db.query.servicePackages.findFirst({
    where: and(
      eq(servicePackages.id, packageId),
      eq(servicePackages.businessId, businessId)
    ),
  });

  if (!pkg) return { success: false, error: "Package not found" };

  const expiresAt = pkg.expirationDays
    ? new Date(Date.now() + pkg.expirationDays * 24 * 60 * 60 * 1000)
    : null;

  const [row] = await db
    .insert(customerPackages)
    .values({
      customerId,
      packageId,
      businessId,
      sessionsRemaining: pkg.sessionCount,
      sessionsUsed: 0,
      paymentStatus,
      expiresAt,
      status: "ACTIVE",
    })
    .returning({ id: customerPackages.id });

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true, data: { id: row.id } };
}

export async function cancelCustomerPackage(
  customerPackageId: string
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(customerPackages)
    .set({ status: "CANCELLED" })
    .where(
      and(
        eq(customerPackages.id, customerPackageId),
        eq(customerPackages.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}

export async function updateCustomerPackagePayment(
  customerPackageId: string,
  paymentStatus: "PAID" | "PENDING"
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(customerPackages)
    .set({ paymentStatus })
    .where(
      and(
        eq(customerPackages.id, customerPackageId),
        eq(customerPackages.businessId, businessId)
      )
    );

  revalidatePath("/dashboard/customers");
  return { success: true, data: undefined };
}
