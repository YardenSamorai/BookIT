"use client";

import { useState } from "react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import {
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";

interface IntakeSubmission {
  id: string;
  formId: string;
  formTitle: string;
  responses: unknown;
  submittedAt: Date;
}

export function IntakeFormsTab({
  submissions,
}: {
  submissions: IntakeSubmission[];
}) {
  const t = useT();
  const locale = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
        <ClipboardCheck className="size-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          {t("intake.no_submissions" as never)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub) => {
        const isOpen = expandedId === sub.id;
        const responses = (sub.responses ?? {}) as Record<string, unknown>;
        const dateStr = new Date(sub.submittedAt).toLocaleDateString(
          locale === "he" ? "he-IL" : "en-US",
          { day: "numeric", month: "short", year: "numeric" }
        );

        return (
          <div
            key={sub.id}
            className="rounded-xl border bg-card overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : sub.id)}
              className="flex w-full items-center gap-3 p-4 text-sm hover:bg-muted/50 transition-colors"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 text-start">
                <p className="font-medium">{sub.formTitle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dateStr}
                </p>
              </div>
              {isOpen ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="border-t bg-muted/30 px-4 pb-4 pt-3 space-y-3">
                {Object.entries(responses).map(([key, val]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      {key}
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
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
