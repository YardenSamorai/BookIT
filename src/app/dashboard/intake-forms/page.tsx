import { requireBusinessOwner } from "@/lib/auth/guards";
import { getBusinessLocale } from "@/lib/db/queries/business";
import { getIntakeForms, getIntakeFormCount } from "@/lib/db/queries/intake-forms";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/shared/page-header";
import { IntakeFormsList } from "@/components/intake-forms/intake-forms-list";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAddIntakeForm } from "@/lib/plans/gates";
import type { PlanType } from "@/lib/plans/limits";

export default async function IntakeFormsPage() {
  const { businessId } = await requireBusinessOwner();

  const [forms, locale, biz] = await Promise.all([
    getIntakeForms(businessId),
    getBusinessLocale(businessId),
    db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { subscriptionPlan: true },
    }),
  ]);

  const plan = (biz?.subscriptionPlan ?? "FREE") as PlanType;
  const gate = canAddIntakeForm(plan, forms.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "intake.title" as never)}
        description={t(locale, "intake.subtitle" as never)}
      >
        {gate.allowed && (
          <Link href="/dashboard/intake-forms/new">
            <Button>
              <Plus className="mr-1.5 size-4" />
              {t(locale, "intake.create" as never)}
            </Button>
          </Link>
        )}
      </PageHeader>
      <IntakeFormsList forms={forms} />
    </div>
  );
}
