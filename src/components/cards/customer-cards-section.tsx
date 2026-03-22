"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  Plus,
  X,
  Loader2,
  History,
  Minus,
  PlusCircle,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { assignCustomerCard, cancelCustomerCard, updateCardPayment, adjustCardSessions } from "@/actions/cards";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerCardRow, CardTemplateRow } from "@/lib/db/queries/cards";

const STATUS_BADGE_MAP: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING_PAYMENT: "outline",
  EXPIRED: "secondary",
  FULLY_USED: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

interface CustomerCardsSectionProps {
  customerId: string;
  cards: CustomerCardRow[];
  cardTemplates: CardTemplateRow[];
  onRefresh: () => void;
}

export function CustomerCardsSection({
  customerId,
  cards,
  cardTemplates,
  onRefresh,
}: CustomerCardsSectionProps) {
  const t = useT();
  const locale = useLocale();
  const [assignOpen, setAssignOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "STRIPE" | "ON_SITE" | "OTHER">("CASH");
  const [notes, setNotes] = useState("");

  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState("");

  const activeTemplates = cardTemplates.filter((t) => t.isActive && !t.isArchived);

  function handleAssign() {
    if (!selectedTemplateId) return;
    startTransition(async () => {
      const result = await assignCustomerCard({
        customerId,
        cardTemplateId: selectedTemplateId,
        paymentStatus,
        paymentMethod,
        notes: notes || undefined,
      });
      if (result.success) {
        setAssignOpen(false);
        setSelectedTemplateId("");
        setNotes("");
        onRefresh();
      }
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelCustomerCard(id);
      onRefresh();
    });
  }

  function handleTogglePayment(id: string, current: string) {
    const next = current === "PAID" ? "PENDING" : "PAID";
    startTransition(async () => {
      await updateCardPayment(id, next as "PAID" | "PENDING");
      onRefresh();
    });
  }

  function handleAdjust() {
    if (!adjustOpen || adjustDelta === 0 || !adjustNotes.trim()) return;
    startTransition(async () => {
      await adjustCardSessions({
        customerCardId: adjustOpen,
        delta: adjustDelta,
        notes: adjustNotes,
      });
      setAdjustOpen(null);
      setAdjustDelta(0);
      setAdjustNotes("");
      onRefresh();
    });
  }

  function getStatusLabel(status: string) {
    const key = `card.status_${status.toLowerCase()}` as Parameters<typeof t>[0];
    return t(key);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4" />
            {t("card.customer_title")}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAssignOpen(true)}
            className="h-7 text-xs"
          >
            <Plus className="me-1 size-3" />
            {t("card.assign")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CreditCard className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("card.no_customer_cards_desc")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => {
              const usagePct =
                card.sessionsTotal > 0
                  ? (card.sessionsUsed / card.sessionsTotal) * 100
                  : 0;
              const isActive = card.status === "ACTIVE";
              const isPending = card.status === "PENDING_PAYMENT";
              const canAct = isActive || isPending;
              const isTerminal = ["CANCELLED", "REFUNDED", "EXPIRED", "FULLY_USED"].includes(card.status);

              return (
                <div
                  key={card.id}
                  className={`rounded-lg border p-3 ${isTerminal ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {card.templateSnapshotName}
                        </p>
                        <Badge
                          variant={STATUS_BADGE_MAP[card.status] ?? "secondary"}
                          className="text-[10px] shrink-0"
                        >
                          {getStatusLabel(card.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canAct && (
                        <>
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleTogglePayment(card.id, card.paymentStatus)}
                              title={t("card.payment_status")}
                            >
                              <CreditCard className="size-3.5 text-amber-500" />
                            </Button>
                          )}
                          {isActive && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleTogglePayment(card.id, card.paymentStatus)}
                                title={t("card.payment_status")}
                              >
                                <CreditCard
                                  className={`size-3.5 ${
                                    card.paymentStatus === "PAID"
                                      ? "text-green-600"
                                      : "text-amber-500"
                                  }`}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setAdjustOpen(card.id)}
                                title={t("card.adjust_sessions")}
                              >
                                <PlusCircle className="size-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleCancel(card.id)}
                            disabled={pending}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Progress
                      value={usagePct}
                      className="h-2 flex-1"
                    />
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {card.sessionsUsed}/{card.sessionsTotal}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                    <span>
                      {t("card.sessions_remaining", {
                        n: String(card.sessionsRemaining),
                      })}
                    </span>
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
                            locale === "he" ? "he-IL" : "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          ),
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Assign Card Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("card.assign")}</DialogTitle>
            <DialogDescription>{t("card.assign_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("card.select_template")}
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">—</option>
                {activeTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} · {tpl.sessionCount} {t("card.sessions")} · ₪
                    {tpl.price}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("card.payment_status")}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentStatus === "PAID" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentStatus("PAID")}
                >
                  {t("card.paid")}
                </Button>
                <Button
                  type="button"
                  variant={paymentStatus === "PENDING" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentStatus("PENDING")}
                >
                  {t("card.pending")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("card.payment_method")}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="CASH">{t("card.method_cash")}</option>
                <option value="TRANSFER">{t("card.method_transfer")}</option>
                <option value="STRIPE">{t("card.method_stripe")}</option>
                <option value="ON_SITE">{t("card.method_on_site")}</option>
                <option value="OTHER">{t("card.method_other")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("common.notes")}</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignOpen(false)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAssign}
              disabled={pending || !selectedTemplateId}
            >
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("card.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Sessions Dialog */}
      <Dialog
        open={!!adjustOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAdjustOpen(null);
            setAdjustDelta(0);
            setAdjustNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("card.adjust_sessions")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustDelta((d) => d - 1)}
              >
                <Minus className="size-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-lg font-bold tabular-nums">
                {adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustDelta((d) => d + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("card.adjust_reason")}
              </label>
              <Input
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustOpen(null)}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={pending || adjustDelta === 0 || !adjustNotes.trim()}
            >
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
