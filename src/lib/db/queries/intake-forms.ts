import { eq, and, count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  intakeForms,
  intakeFormSubmissions,
  services,
  customers,
  users,
} from "@/lib/db/schema";

export async function getIntakeForms(businessId: string) {
  const forms = await db
    .select({
      id: intakeForms.id,
      title: intakeForms.title,
      description: intakeForms.description,
      fields: intakeForms.fields,
      isActive: intakeForms.isActive,
      createdAt: intakeForms.createdAt,
      updatedAt: intakeForms.updatedAt,
    })
    .from(intakeForms)
    .where(eq(intakeForms.businessId, businessId))
    .orderBy(desc(intakeForms.createdAt));

  const enriched = await Promise.all(
    forms.map(async (form) => {
      const [svcCount] = await db
        .select({ value: count() })
        .from(services)
        .where(
          and(
            eq(services.businessId, businessId),
            eq(services.intakeFormId, form.id)
          )
        );
      const [subCount] = await db
        .select({ value: count() })
        .from(intakeFormSubmissions)
        .where(eq(intakeFormSubmissions.formId, form.id));

      return {
        ...form,
        serviceCount: svcCount?.value ?? 0,
        submissionCount: subCount?.value ?? 0,
      };
    })
  );

  return enriched;
}

export async function getIntakeForm(formId: string, businessId: string) {
  return db.query.intakeForms.findFirst({
    where: and(eq(intakeForms.id, formId), eq(intakeForms.businessId, businessId)),
  });
}

export async function getFormSubmissions(formId: string, businessId: string) {
  return db
    .select({
      id: intakeFormSubmissions.id,
      responses: intakeFormSubmissions.responses,
      submittedAt: intakeFormSubmissions.submittedAt,
      appointmentId: intakeFormSubmissions.appointmentId,
      customerName: users.name,
      customerPhone: users.phone,
    })
    .from(intakeFormSubmissions)
    .innerJoin(customers, eq(intakeFormSubmissions.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(
        eq(intakeFormSubmissions.formId, formId),
        eq(intakeFormSubmissions.businessId, businessId)
      )
    )
    .orderBy(desc(intakeFormSubmissions.submittedAt));
}

export async function getCustomerSubmissions(
  customerId: string,
  businessId: string
) {
  return db
    .select({
      id: intakeFormSubmissions.id,
      formId: intakeFormSubmissions.formId,
      formTitle: intakeForms.title,
      responses: intakeFormSubmissions.responses,
      submittedAt: intakeFormSubmissions.submittedAt,
    })
    .from(intakeFormSubmissions)
    .innerJoin(intakeForms, eq(intakeFormSubmissions.formId, intakeForms.id))
    .where(
      and(
        eq(intakeFormSubmissions.customerId, customerId),
        eq(intakeFormSubmissions.businessId, businessId)
      )
    )
    .orderBy(desc(intakeFormSubmissions.submittedAt));
}

export async function hasCustomerSubmittedForm(
  customerId: string,
  formId: string
): Promise<boolean> {
  const [result] = await db
    .select({ value: count() })
    .from(intakeFormSubmissions)
    .where(
      and(
        eq(intakeFormSubmissions.customerId, customerId),
        eq(intakeFormSubmissions.formId, formId)
      )
    );
  return (result?.value ?? 0) > 0;
}

export async function getServiceIntakeForm(serviceId: string) {
  const svc = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
    columns: { intakeFormId: true },
  });
  if (!svc?.intakeFormId) return null;

  return db.query.intakeForms.findFirst({
    where: and(
      eq(intakeForms.id, svc.intakeFormId),
      eq(intakeForms.isActive, true)
    ),
  });
}

export async function getIntakeFormCount(businessId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(intakeForms)
    .where(eq(intakeForms.businessId, businessId));
  return result?.value ?? 0;
}
