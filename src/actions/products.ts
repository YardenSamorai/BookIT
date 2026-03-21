"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import type { ActionResult } from "@/types";

interface ProductInput {
  title: string;
  description?: string;
  price?: string;
  images?: string[];
  category?: string;
  relatedServiceId?: string;
  servicePackageId?: string;
  ctaMode: "BOOK_SERVICE" | "EXTERNAL_LINK" | "NONE";
  ctaText?: string;
  externalUrl?: string;
  isFeatured: boolean;
  isVisible: boolean;
}

export async function createProduct(
  businessId: string,
  input: ProductInput
): Promise<ActionResult<{ productId: string }>> {
  const { businessId: authBizId } = await requireBusinessOwner();
  if (authBizId !== businessId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!input.title.trim()) {
    return { success: false, error: "Title is required", field: "title" };
  }

  const [product] = await db
    .insert(products)
    .values({
      businessId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      price: input.price || null,
      images: input.images ?? [],
      category: input.category?.trim() || null,
      relatedServiceId: input.relatedServiceId || null,
      servicePackageId: input.servicePackageId || null,
      ctaMode: input.ctaMode,
      ctaText: input.ctaText?.trim() || null,
      externalUrl: input.externalUrl?.trim() || null,
      isFeatured: input.isFeatured,
      isVisible: input.isVisible,
    })
    .returning({ id: products.id });

  revalidatePath("/dashboard");
  return { success: true, data: { productId: product.id } };
}

export async function updateProduct(
  productId: string,
  businessId: string,
  input: ProductInput
): Promise<ActionResult> {
  const { businessId: authBizId } = await requireBusinessOwner();
  if (authBizId !== businessId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!input.title.trim()) {
    return { success: false, error: "Title is required", field: "title" };
  }

  await db
    .update(products)
    .set({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      price: input.price || null,
      images: input.images ?? [],
      category: input.category?.trim() || null,
      relatedServiceId: input.relatedServiceId || null,
      servicePackageId: input.servicePackageId || null,
      ctaMode: input.ctaMode,
      ctaText: input.ctaText?.trim() || null,
      externalUrl: input.externalUrl?.trim() || null,
      isFeatured: input.isFeatured,
      isVisible: input.isVisible,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.businessId, businessId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}

export async function deleteProduct(
  productId: string,
  businessId: string
): Promise<ActionResult> {
  const { businessId: authBizId } = await requireBusinessOwner();
  if (authBizId !== businessId) {
    return { success: false, error: "Unauthorized" };
  }

  await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.businessId, businessId)));

  revalidatePath("/dashboard");
  return { success: true, data: undefined };
}
