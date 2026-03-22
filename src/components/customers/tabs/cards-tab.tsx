"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Plus,
  X,
  Loader2,
  Minus,
  PlusCircle,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { assignCustomerCard, cancelCustomerCard, updateCardPayment, adjustCardSessions } from "@/actions/cards";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import type { CustomerCardRow, CardTemplateRow } from "@/lib/db/queries/cards";
import type { CustomerPackageRow } from "@/lib/db/queries/customers";

const STATUS_BADGE_MAP: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PENDING_PAYMENT: "outline",
  EXPIRED: "secondary",
  FULLY_USED: "secondary",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

interface Props {
  customerId: string;
  cards: CustomerCardRow[];
  cardTemplates: CardTemplateRow[];
  customerPackages: CustomerPackageRow[];
  onRefresh: () => void;
}

export function CardsTab({ customerId, cards, cardTemplates, customerPackages, onRefresh }: Props) {
  const t = useT();
  const locale = useLocale();
  const [assignOpen, setAssignOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PAID");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "STRIPE" | "ON_SITE" | "OTHER">("CASH");
  const [notes, setNotes] = useState("");
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState("");

  const activeTemplates = cardTemplates.filter((t) => t.isActive && !t.isArchived);
  const pendingPayment = cards.filter((c) => c.status === "PENDING_PAYMENT");
  const active = cards.filter((c) => c.status === "ACTIVE");

  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 14 * 86400000);
  const expiringSoon = active.filter(
    (c) => c.expiresAt && new Date(c.expiresAt) <= soonThreshold
  );

  const terminal = cards.filter((c) =>
    ["EXPIRED", "FULLY_USED", "CANCELLED", "REFUNDED"].includes(c.status)
  );

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
      await adjustCardSessions({ customerCardId: adjustOpen, delta: adjustDelta, notes: adjustNotes });
      setAdjustOpen(null);
      setAdjustDelta(0);
      setAdjustNotes("");
      onRefresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("cust.tab_cards")}</h3>
        <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)} className="h-7 text-xs">
          <Plus className="me-1 size-3" />
          {t("card.assign")}
        </Button>
      </div>

      {/* Pending Payment section */}
      {pendingPayment.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
            {t("cust.pending_payment_section")} ({pendingPayment.length})
          </h4>
          <div className="grid gap-2 md:grid-cols-2">
            {pendingPayment.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                locale={locale}
                t={t}
                pending={pending}
                variant="pending"
                onCancel={handleCancel}
                onTogglePayment={handleTogglePayment}
                onAdjust={setAdjustOpen}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active section */}
      {active.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
            {t("cust.active_section")} ({active.length})
          </h4>
          {expiringSoon.length > 0 && (
            <p className="text-xs text-amber-600 mb-2">
              {t("cust.expiring_soon")}: {expiringSoon.length}
            </p>
          )}
          <div className="grid gap-2 md:grid-cols-2">
            {active.map((card) => {
              const isExpiring = expiringSoon.some((e) => e.id === card.id);
              return (
                <CardItem
                  key={card.id}
                  card={card}
                  locale={locale}
                  t={t}
                  pending={pending}
                  variant={isExpiring ? "expiring" : "active"}
                  onCancel={handleCancel}
                  onTogglePayment={handleTogglePayment}
                  onAdjust={setAdjustOpen}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pendingPayment.length === 0 && active.length === 0 && terminal.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Wallet className="size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("card.no_customer_cards_desc")}</p>
        </div>
      )}

      {/* History */}
      {terminal.length > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            {historyOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {t("cust.history_section")} ({terminal.length})
          </button>
          {historyOpen && (
            <div className="grid gap-2 md:grid-cols-2">
              {terminal.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  locale={locale}
                  t={t}
                  pending={pending}
                  variant="terminal"
                  onCancel={handleCancel}
                  onTogglePayment={handleTogglePayment}
                  onAdjust={setAdjustOpen}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legacy packages */}
      {customerPackages.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">
            {t("cust.legacy_packages")} ({customerPackages.length})
          </h4>
          <div className="grid gap-2 md:grid-cols-2 opacity-60">
            {customerPackages.map((pkg) => (
              <div key={pkg.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium">{pkg.packageName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pkg.serviceName}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(pkg.sessionsUsed / (pkg.sessionsUsed + pkg.sessionsRemaining)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {pkg.sessionsUsed}/{pkg.sessionsUsed + pkg.sessionsRemaining}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Card Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("card.assign")}</DialogTitle>
            <DialogDescription>{t("card.assign_desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("card.select_template")}</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">—</option>
                {activeTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} · {tpl.sessionCount} {t("card.sessions")} · ₪{tpl.price}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("card.payment_status")}</label>
              <div className="flex gap-2">
                <Button type="button" variant={paymentStatus === "PAID" ? "default" : "outline"} size="sm" onClick={() => setPaymentStatus("PAID")}>{t("card.paid")}</Button>
                <Button type="button" variant={paymentStatus === "PENDING" ? "default" : "outline"} size="sm" onClick={() => setPaymentStatus("PENDING")}>{t("card.pending")}</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("card.payment_method")}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={pending}>{t("common.cancel")}</Button>
            <Button onClick={handleAssign} disabled={pending || !selectedTemplateId}>
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("card.assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Sessions Dialog */}
      <Dialog open={!!adjustOpen} onOpenChange={(open) => { if (!open) { setAdjustOpen(null); setAdjustDelta(0); setAdjustNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("card.adjust_sessions")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdjustDelta((d) => d - 1)}>
                <Minus className="size-4" />
              </Button>
              <span className="min-w-[3rem] text-center text-lg font-bold tabular-nums">
                {adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => setAdjustDelta((d) => d + 1)}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("card.adjust_reason")}</label>
              <Input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} className="h-11" required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(null)} disabled={pending}>{t("common.cancel")}</Button>
            <Button onClick={handleAdjust} disabled={pending || adjustDelta === 0 || !adjustNotes.trim()}>
              {pending && <Loader2 className="me-2 size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardItem({
  card,
  locale,
  t,
  pending,
  variant,
  onCancel,
  onTogglePayment,
  onAdjust,
}: {
  card: CustomerCardRow;
  locale: string;
  t: ReturnType<typeof useT>;
  pending: boolean;
  variant: "pending" | "active" | "expiring" | "terminal";
  onCancel: (id: string) => void;
  onTogglePayment: (id: string, current: string) => void;
  onAdjust: (id: string) => void;
}) {
  const usagePct = card.sessionsTotal > 0 ? (card.sessionsUsed / card.sessionsTotal) * 100 : 0;
  const canAct = variant !== "terminal";

  const borderClass =
    variant === "pending"
      ? "border-s-4 border-s-amber-400"
      : variant === "expiring"
        ? "border-s-4 border-s-amber-400"
        : variant === "active"
          ? "border-s-4 border-s-green-500"
          : "opacity-60";

  return (
    <div className={`rounded-lg border p-3 ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{card.templateSnapshotName}</p>
            <Badge variant={STATUS_BADGE_MAP[card.status] ?? "secondary"} className="text-[10px] shrink-0">
              {t(`card.status_${card.status.toLowerCase()}` as Parameters<typeof t>[0])}
            </Badge>
          </div>
        </div>
        {canAct && (
          <div className="flex items-center gap-1 shrink-0">
            {variant === "pending" && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onTogglePayment(card.id, card.paymentStatus)} title={t("card.confirm_payment")}>
                <CreditCard className="size-4 text-amber-500" />
              </Button>
            )}
            {(variant === "active" || variant === "expiring") && (
              <>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onTogglePayment(card.id, card.paymentStatus)}>
                  <CreditCard className={`size-4 ${card.paymentStatus === "PAID" ? "text-green-600" : "text-amber-500"}`} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onAdjust(card.id)}>
                  <PlusCircle className="size-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => onCancel(card.id)} disabled={pending}>
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Progress value={usagePct} className="h-2 flex-1" />
        <span className="text-xs font-medium tabular-nums text-muted-foreground">{card.sessionsUsed}/{card.sessionsTotal}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
        <span>{t("card.sessions_remaining", { n: String(card.sessionsRemaining) })}</span>
        {card.paymentStatus === "PAID" ? (
          <span className="text-green-600 font-medium">{t("card.paid")}</span>
        ) : (
          <span className="text-amber-600 font-medium">{t("card.pending")}</span>
        )}
        {card.expiresAt && (
          <span className={variant === "expiring" ? "text-amber-600 font-medium" : ""}>
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
}
