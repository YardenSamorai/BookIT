import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getIntakeForm, getFormSubmissions } from "@/lib/db/queries/intake-forms";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { IntakeFormBuilder } from "@/components/intake-forms/intake-form-builder";
import { SubmissionsViewer } from "@/components/intake-forms/submissions-viewer";
import { notFound } from "next/navigation";

export default async function EditIntakeFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { businessId } = await requireBusinessOwner();

  const [form, locale, submissions] = await Promise.all([
    getIntakeForm(id, businessId),
    getBusinessLocale(businessId),
    getFormSubmissions(id, businessId),
  ]);

  if (!form) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "intake.edit" as never)}
        description={form.title}
      />
      <IntakeFormBuilder
        formId={form.id}
        initialTitle={form.title}
        initialDescription={form.description ?? ""}
        initialFields={(form.fields as never[]) ?? []}
      />
      {submissions.length > 0 && (
        <SubmissionsViewer
          submissions={submissions}
          fields={(form.fields as never[]) ?? []}
        />
      )}
    </div>
  );
}
