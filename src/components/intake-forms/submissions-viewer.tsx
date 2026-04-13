"use client";

import { useState } from "react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  User,
} from "lucide-react";
import type { IntakeFormField } from "@/actions/intake-forms";

interface Submission {
  id: string;
  responses: unknown;
  submittedAt: Date;
  appointmentId: string | null;
  customerName: string | null;
  customerPhone: string | null;
}

interface Props {
  submissions: Submission[];
  fields: IntakeFormField[];
}

export function SubmissionsViewer({ submissions, fields }: Props) {
  const t = useT();
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-8 text-center">
        <ClipboardList className="mx-auto size-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t("intake.no_submissions" as never)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-5 py-3">
        <h3 className="font-semibold flex items-center gap-2">
          <ClipboardList className="size-4" />
          {t("intake.view_submissions" as never)}
          <span className="text-xs text-muted-foreground font-normal">
            ({submissions.length})
          </span>
        </h3>
      </div>
      <div className="divide-y">
        {submissions.map((sub) => {
          const isOpen = expandedId === sub.id;
          const responses = (sub.responses ?? {}) as Record<string, unknown>;
          const dateStr = new Date(sub.submittedAt).toLocaleDateString(
            locale === "he" ? "he-IL" : "en-US",
            { day: "numeric", month: "short", year: "numeric" }
          );

          return (
            <div key={sub.id}>
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : sub.id)}
                className="flex w-full items-center gap-3 px-5 py-3 text-sm hover:bg-muted/50 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                )}
                <User className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">
                  {sub.customerName ?? sub.customerPhone ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground ms-auto">
                  {dateStr}
                </span>
              </button>

              {isOpen && (
                <div className="bg-muted/30 px-5 pb-4 pt-2 space-y-2.5">
                  {fields.map((field) => {
                    const val = responses[field.id];
                    return (
                      <div key={field.id} className="text-sm">
                        <span className="font-medium text-muted-foreground">
                          {field.label}
                        </span>
                        <p className="mt-0.5">
                          {val === true
                            ? "✓"
                            : val === false
                              ? "✗"
                              : Array.isArray(val)
                                ? val.join(", ")
                                : val != null
                                  ? String(val)
                                  : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
