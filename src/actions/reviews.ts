"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { requireBusinessOwner } from "@/lib/auth/guards";
import type { ActionResult } from "@/types";

export async function toggleReviewPublished(
  reviewId: string,
  isPublished: boolean
): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .update(reviews)
    .set({ isPublished })
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, businessId)));

  revalidatePath("/dashboard/reviews");
  return { success: true, data: undefined };
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const { businessId } = await requireBusinessOwner();

  await db
    .delete(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.businessId, businessId)));

  revalidatePath("/dashboard/reviews");
  return { success: true, data: undefined };
}
