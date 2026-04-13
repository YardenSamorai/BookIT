"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/locale-context";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toggleIntakeFormActive, deleteIntakeForm } from "@/actions/intake-forms";
import {
  FileText,
  Pencil,
  Trash2,
  ClipboardList,
  Layers,
} from "lucide-react";

interface FormItem {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  serviceCount: number;
  submissionCount: number;
  createdAt: Date;
}

export function IntakeFormsList({ forms }: { forms: FormItem[] }) {
  const t = useT();

  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <FileText className="size-10 text-muted-foreground/40" />
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {t("intake.no_forms" as never)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {t("intake.no_forms_desc" as never)}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {forms.map((form) => (
        <FormCard key={form.id} form={form} />
      ))}
    </div>
  );
}

function FormCard({ form }: { form: FormItem }) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      await toggleIntakeFormActive(form.id, checked);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(t("intake.delete_confirm" as never))) return;
    startTransition(async () => {
      await deleteIntakeForm(form.id);
      router.refresh();
    });
  }

  return (
    <div className="group relative rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{form.title}</h3>
          {form.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {form.description}
            </p>
          )}
        </div>
        <Switch
          checked={form.isActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
        />
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Layers className="size-3.5" />
          {t("intake.services_using" as never, { n: String(form.serviceCount) })}
        </span>
        <span className="flex items-center gap-1">
          <ClipboardList className="size-3.5" />
          {t("intake.submissions" as never, { n: String(form.submissionCount) })}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link href={`/dashboard/intake-forms/${form.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Pencil className="mr-1.5 size-3.5" />
            {t("common.edit")}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
