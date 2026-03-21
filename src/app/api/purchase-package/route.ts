import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, servicePackages, customerPackages, customers } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, businessId } = body;

  if (!productId || !businessId) {
    return NextResponse.json({ error: "Missing productId or businessId" }, { status: 400 });
  }

  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.businessId, businessId)),
  });

  if (!product?.servicePackageId) {
    return NextResponse.json({ error: "Product has no linked package" }, { status: 400 });
  }

  const pkg = await db.query.servicePackages.findFirst({
    where: eq(servicePackages.id, product.servicePackageId),
  });

  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.businessId, businessId),
      eq(customers.userId, session.user.id)
    ),
    columns: { id: true },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found. Please book at least once first." }, { status: 400 });
  }

  const expiresAt = pkg.expirationDays
    ? new Date(Date.now() + pkg.expirationDays * 24 * 60 * 60 * 1000)
    : null;

  const [row] = await db
    .insert(customerPackages)
    .values({
      customerId: customer.id,
      packageId: pkg.id,
      businessId,
      sessionsRemaining: pkg.sessionCount,
      sessionsUsed: 0,
      paymentStatus: "PENDING",
      expiresAt,
      status: "ACTIVE",
    })
    .returning({ id: customerPackages.id });

  return NextResponse.json({
    success: true,
    customerPackageId: row.id,
    sessionsCount: pkg.sessionCount,
  });
}
