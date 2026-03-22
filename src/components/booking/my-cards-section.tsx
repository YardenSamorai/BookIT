"use client";

import { Wallet, AlertTriangle } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerCardRow } from "@/lib/db/queries/cards";

interface Props {
  cards: CustomerCardRow[];
  secondaryColor: string;
}

function isExpiringSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const daysUntil = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntil > 0 && daysUntil <= 7;
}

export function MyCardsSection({ cards, secondaryColor }: Props) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const activeCards = cards.filter((c) => c.status === "ACTIVE");
  const otherCards = cards.filter((c) => c.status !== "ACTIVE");

  if (activeCards.length === 0 && otherCards.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
        <Wallet className="size-4" style={{ color: secondaryColor }} />
        {t("card.my_cards")}
      </h3>

      {activeCards.length > 0 && (
        <div className="space-y-2">
          {activeCards.map((card) => {
            const pct =
              card.sessionsTotal > 0
                ? (card.sessionsUsed / card.sessionsTotal) * 100
                : 0;
            const expiring = isExpiringSoon(card.expiresAt);

            return (
              <div
                key={card.id}
                className="overflow-hidden rounded-xl border bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {card.templateSnapshotName}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {card.sessionsRemaining}
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
                    {card.sessionsUsed}/{card.sessionsTotal}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-gray-400">
                  {card.paymentStatus === "PAID" ? (
                    <span className="text-green-600 font-medium">
                      {t("card.paid")}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      {t("card.pending")}
                    </span>
                  )}
                  {card.expiresAt && (
                    <span>
                      {t("card.expires_on", {
                        date: new Date(card.expiresAt).toLocaleDateString(
                          dateLocale,
                          { month: "short", day: "numeric" }
                        ),
                      })}
                    </span>
                  )}
                  {expiring && (
                    <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                      <AlertTriangle className="size-3" />
                      {t("card.expiring_soon")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {otherCards.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
            {t("card.history")} ({otherCards.length})
          </summary>
          <div className="mt-2 space-y-2">
            {otherCards.map((card) => (
              <div
                key={card.id}
                className="overflow-hidden rounded-xl border bg-white/60 p-3 opacity-60"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate">
                    {card.templateSnapshotName}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {t(`card.status_${card.status.toLowerCase()}` as Parameters<typeof t>[0])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
