import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviews, appointments, businesses } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";

const submitReviewSchema = z.object({
  businessId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = submitReviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { businessId, appointmentId, serviceId, rating, comment } = parsed.data;

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (appointmentId) {
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, session.user.id), eq(reviews.appointmentId, appointmentId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
    }
  }

  const [review] = await db
    .insert(reviews)
    .values({
      businessId,
      userId: session.user.id,
      appointmentId: appointmentId ?? null,
      serviceId: serviceId ?? null,
      rating,
      comment: comment?.trim() || null,
    })
    .returning({ id: reviews.id });

  return NextResponse.json({ success: true, reviewId: review.id });
}
