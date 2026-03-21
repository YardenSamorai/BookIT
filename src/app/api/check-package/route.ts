import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customerPackages, servicePackages, customers } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get("businessId");
  const serviceId = searchParams.get("serviceId");

  if (!businessId || !serviceId) {
    return NextResponse.json({ hasPackage: false });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ hasPackage: false });
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.businessId, businessId),
      eq(customers.userId, session.user.id)
    ),
    columns: { id: true },
  });

  if (!customer) {
    return NextResponse.json({ hasPackage: false });
  }

  const pkgs = await db
    .select({
      id: customerPackages.id,
      sessionsRemaining: customerPackages.sessionsRemaining,
      packageName: servicePackages.name,
    })
    .from(customerPackages)
    .innerJoin(servicePackages, eq(customerPackages.packageId, servicePackages.id))
    .where(
      and(
        eq(customerPackages.customerId, customer.id),
        eq(customerPackages.status, "ACTIVE"),
        eq(customerPackages.paymentStatus, "PAID"),
        eq(servicePackages.serviceId, serviceId)
      )
    )
    .limit(1);

  const activePkg = pkgs.find((p) => p.sessionsRemaining > 0);

  if (!activePkg) {
    return NextResponse.json({ hasPackage: false });
  }

  return NextResponse.json({
    hasPackage: true,
    sessionsRemaining: activePkg.sessionsRemaining,
    packageName: activePkg.packageName,
  });
}
