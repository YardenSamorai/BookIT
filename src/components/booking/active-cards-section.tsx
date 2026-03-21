"use client";

import { CreditCard } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerPackageRow } from "@/lib/db/queries/customers";

interface Props {
  packages: CustomerPackageRow[];
  secondaryColor: string;
}

export function ActiveCardsSection({ packages, secondaryColor }: Props) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const activePackages = packages.filter((p) => p.status === "ACTIVE");
  if (activePackages.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <CreditCard className="size-4" style={{ color: secondaryColor }} />
        {t("pkg.customer_title" as Parameters<typeof t>[0])}
      </h3>
      {activePackages.map((cp) => {
        const total = cp.sessionsUsed + cp.sessionsRemaining;
        const pct = total > 0 ? (cp.sessionsUsed / total) * 100 : 0;

        return (
          <div
            key={cp.id}
            className="overflow-hidden rounded-xl border bg-white p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{cp.packageName}</p>
                <p className="text-xs text-gray-500">{cp.serviceName}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: secondaryColor }}
              >
                {cp.sessionsRemaining}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: secondaryColor,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-gray-400">
                {cp.sessionsUsed}/{total}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-gray-400">
              {cp.paymentStatus === "PAID" ? (
                <span className="text-green-600 font-medium">
                  {t("pkg.paid" as Parameters<typeof t>[0])}
                </span>
              ) : (
                <span className="text-amber-600 font-medium">
                  {t("pkg.pending" as Parameters<typeof t>[0])}
                </span>
              )}
              {cp.expiresAt && (
                <span>
                  {t("pkg.expires_on" as Parameters<typeof t>[0]).replace(
                    "{date}",
                    new Date(cp.expiresAt).toLocaleDateString(dateLocale, {
                      month: "short",
                      day: "numeric",
                    })
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
