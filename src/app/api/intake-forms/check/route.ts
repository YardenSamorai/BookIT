import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  services,
  intakeForms,
  intakeFormSubmissions,
  customers,
} from "@/lib/db/schema";
import { count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get("businessId");
  const serviceId = searchParams.get("serviceId");

  if (!businessId || !serviceId) {
    return NextResponse.json({ required: false });
  }

  const service = await db.query.services.findFirst({
    where: and(eq(services.id, serviceId), eq(services.businessId, businessId)),
    columns: { intakeFormId: true },
  });

  if (!service?.intakeFormId) {
    return NextResponse.json({ required: false });
  }

  const form = await db.query.intakeForms.findFirst({
    where: and(
      eq(intakeForms.id, service.intakeFormId),
      eq(intakeForms.isActive, true)
    ),
  });

  if (!form) {
    return NextResponse.json({ required: false });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({
      required: true,
      formId: form.id,
      formTitle: form.title,
      formDescription: form.description,
      fields: form.fields,
    });
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.businessId, businessId),
      eq(customers.userId, session.user.id)
    ),
    columns: { id: true },
  });

  if (customer) {
    const [result] = await db
      .select({ value: count() })
      .from(intakeFormSubmissions)
      .where(
        and(
          eq(intakeFormSubmissions.customerId, customer.id),
          eq(intakeFormSubmissions.formId, form.id)
        )
      );

    if ((result?.value ?? 0) > 0) {
      return NextResponse.json({ required: false, alreadySubmitted: true });
    }
  }

  return NextResponse.json({
    required: true,
    formId: form.id,
    formTitle: form.title,
    formDescription: form.description,
    fields: form.fields,
  });
}
