"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useT } from "@/lib/i18n/locale-context";
import { cancelCustomerCard, updateCardPayment } from "@/actions/cards";
import type { BusinessCustomerCardRow } from "@/lib/db/queries/cards";

function getStatusBadge(status: string, t: ReturnType<typeof useT>) {
  const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    ACTIVE: { variant: "default", label: t("card.status_active") },
    PENDING_PAYMENT: { variant: "outline", label: t("card.status_pending_payment") },
    EXPIRED: { variant: "secondary", label: t("card.status_expired") },
    FULLY_USED: { variant: "secondary", label: t("card.status_fully_used") },
    CANCELLED: { variant: "destructive", label: t("card.status_cancelled") },
    REFUNDED: { variant: "destructive", label: t("card.status_refunded") },
  };
  return map[status] ?? { variant: "secondary" as const, label: status };
}

function isExpiringSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  const daysUntil = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return daysUntil > 0 && daysUntil <= 7;
}

interface CustomerCardsListProps {
  cards: BusinessCustomerCardRow[];
}

export function CustomerCardsList({ cards }: CustomerCardsListProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleCancel(cardId: string) {
    startTransition(async () => {
      await cancelCustomerCard(cardId);
      router.refresh();
    });
  }

  function handleConfirmPayment(cardId: string) {
    startTransition(async () => {
      await updateCardPayment(cardId, "PAID");
      router.refresh();
    });
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">{t("card.no_customer_cards")}</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            {t("card.no_customer_cards_desc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const statusBadge = getStatusBadge(card.status, t);
        const usagePercent =
          card.sessionsTotal > 0
            ? Math.round((card.sessionsUsed / card.sessionsTotal) * 100)
            : 0;
        const expiring = card.status === "ACTIVE" && isExpiringSoon(card.expiresAt);
        const canCancel = card.status === "ACTIVE" || card.status === "PENDING_PAYMENT";
        const canConfirm = card.status === "PENDING_PAYMENT";

        return (
          <Card key={card.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {card.customerName || card.customerPhone || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {card.templateSnapshotName}
                  </p>
                </div>
                <Badge variant={statusBadge.variant} className="text-xs shrink-0">
                  {statusBadge.label}
                </Badge>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("card.sessions_used", {
                      used: String(card.sessionsUsed),
                      total: String(card.sessionsTotal),
                    })}
                  </span>
                  <span className="font-medium">
                    {card.sessionsRemaining} {t("card.sessions")}
                  </span>
                </div>
                <Progress value={usagePercent} className="h-1.5" />
              </div>

              {expiring && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="size-3.5" />
                  {t("card.expiring_soon")}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {card.expiresAt && (
                  <span>
                    {t("card.expires_on", {
                      date: new Date(card.expiresAt).toLocaleDateString(),
                    })}
                  </span>
                )}
                <span>·</span>
                <span>
                  {t("card.purchased_on", {
                    date: new Date(card.purchasedAt).toLocaleDateString(),
                  })}
                </span>
              </div>

              {(canConfirm || canCancel) && (
                <div className="mt-3 flex items-center gap-2 border-t pt-3">
                  {canConfirm && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs text-green-700 hover:text-green-800 hover:bg-green-50"
                      onClick={() => handleConfirmPayment(card.id)}
                      disabled={pending}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {t("card.confirm_payment")}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                      onClick={() => handleCancel(card.id)}
                      disabled={pending}
                    >
                      <X className="size-3.5" />
                      {t("card.cancel_card")}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
