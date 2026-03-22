import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  cardTemplates,
  cardTemplateServices,
  customerCards,
  cardUsages,
  customers,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json();
  const { cardTemplateId, businessId } = body;

  if (!cardTemplateId || !businessId) {
    return NextResponse.json(
      { error: "Missing cardTemplateId or businessId" },
      { status: 400 }
    );
  }

  const template = await db.query.cardTemplates.findFirst({
    where: and(
      eq(cardTemplates.id, cardTemplateId),
      eq(cardTemplates.businessId, businessId),
      eq(cardTemplates.isActive, true),
      eq(cardTemplates.isPurchasable, true),
      eq(cardTemplates.isArchived, false)
    ),
  });

  if (!template) {
    return NextResponse.json(
      { error: "Card template not found or not available for purchase" },
      { status: 404 }
    );
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.businessId, businessId),
      eq(customers.userId, session.user.id)
    ),
    columns: { id: true },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found. Please book at least once first." },
      { status: 400 }
    );
  }

  const expiresAt = template.expirationDays
    ? new Date(Date.now() + template.expirationDays * 24 * 60 * 60 * 1000)
    : null;

  const [card] = await db
    .insert(customerCards)
    .values({
      customerId: customer.id,
      cardTemplateId: template.id,
      businessId,
      templateSnapshotName: template.name,
      templateSnapshotDescription: template.description,
      templateSnapshotSessionCount: template.sessionCount,
      templateSnapshotPrice: template.price,
      templateSnapshotExpirationDays: template.expirationDays,
      snapshotRestoreOnLateCancel: template.restoreOnLateCancel,
      snapshotRestoreOnNoShow: template.restoreOnNoShow,
      sessionsTotal: template.sessionCount,
      sessionsUsed: 0,
      sessionsRemaining: template.sessionCount,
      status: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      paymentMethod: "STRIPE",
      source: "PUBLIC_SITE",
      expiresAt,
    })
    .returning({ id: customerCards.id });

  await db.insert(cardUsages).values({
    customerCardId: card.id,
    action: "ACTIVATED",
    deltaSessions: 0,
    actorType: "CUSTOMER",
    notes: "Purchased from public site, pending payment",
  });

  revalidatePath(`/dashboard/customers/${customer.id}`);
  revalidatePath("/dashboard/packages");

  return NextResponse.json({
    success: true,
    customerCardId: card.id,
    sessionsCount: template.sessionCount,
    price: template.price,
  });
}
