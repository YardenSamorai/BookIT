"use server";

import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { requireBusinessOwner, requireSuperAdmin } from "@/lib/auth/guards";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "login",
  "signup",
  "mail",
  "ftp",
  "blog",
  "help",
  "support",
  "status",
  "docs",
  "dev",
  "staging",
  "test",
]);

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

function validateSubdomain(subdomain: string): string | null {
  const clean = subdomain.toLowerCase().trim();
  if (clean.length < 3) return "subdomain_too_short";
  if (clean.length > 63) return "subdomain_too_long";
  if (!SUBDOMAIN_REGEX.test(clean)) return "subdomain_invalid_chars";
  if (RESERVED_SUBDOMAINS.has(clean)) return "subdomain_reserved";
  return null;
}

// ── Business Owner Actions ──

export async function requestSubdomain(subdomain: string) {
  const { businessId } = await requireBusinessOwner();

  const clean = subdomain.toLowerCase().trim();
  const validationError = validateSubdomain(clean);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const existing = await db.query.businesses.findFirst({
    where: and(
      eq(businesses.customSubdomain, clean),
    ),
    columns: { id: true },
  });

  if (existing && existing.id !== businessId) {
    return { success: false, error: "subdomain_taken" };
  }

  await db
    .update(businesses)
    .set({
      customSubdomain: clean,
      subdomainStatus: "PENDING",
      subdomainRejectReason: null,
      subdomainRequestedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function cancelSubdomainRequest() {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(businesses)
    .set({
      customSubdomain: null,
      subdomainStatus: null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getMySubdomainStatus() {
  const { businessId } = await requireBusinessOwner();

  const biz = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { customSubdomain: true, subdomainStatus: true, slug: true },
  });

  return biz;
}

// ── Admin Actions ──

export async function getSubdomainRequests() {
  await requireSuperAdmin();

  return db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      customSubdomain: businesses.customSubdomain,
      subdomainStatus: businesses.subdomainStatus,
      subdomainRejectReason: businesses.subdomainRejectReason,
      subdomainRequestedAt: businesses.subdomainRequestedAt,
      updatedAt: businesses.updatedAt,
    })
    .from(businesses)
    .where(isNotNull(businesses.subdomainStatus))
    .orderBy(businesses.updatedAt);
}

export async function approveSubdomain(businessId: string) {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({
      subdomainStatus: "APPROVED",
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath("/admin/subdomains");
  return { success: true };
}

export async function rejectSubdomain(businessId: string, reason?: string) {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({
      subdomainStatus: "REJECTED",
      subdomainRejectReason: reason || null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath("/admin/subdomains");
  return { success: true };
}

export async function revokeSubdomain(businessId: string) {
  await requireSuperAdmin();

  await db
    .update(businesses)
    .set({
      customSubdomain: null,
      subdomainStatus: null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath("/admin/subdomains");
  return { success: true };
}

export async function getPendingSubdomainCount() {
  await requireSuperAdmin();

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(businesses)
    .where(eq(businesses.subdomainStatus, "PENDING"));

  return result?.count ?? 0;
}
