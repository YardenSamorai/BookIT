"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Phone,
  DollarSign,
  CreditCard,
  ShieldAlert,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { ActivityTimeline } from "../activity-timeline";
import type { CustomerProfile, CustomerActivity, FinancialActivityRow } from "@/lib/db/queries/customers";
import type { CustomerCardRow } from "@/lib/db/queries/cards";

interface Props {
  customer: CustomerProfile;
  activities: CustomerActivity[];
  financialActivity: FinancialActivityRow[];
  customerCards: CustomerCardRow[];
  onSwitchTab: (tab: string) => void;
  onEdit: () => void;
}

export function OverviewTab({
  customer,
  activities,
  financialActivity,
  customerCards,
  onSwitchTab,
  onEdit,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const unpaid = parseFloat(customer.unpaidBalance) || 0;

  const callbacks = { onEdit, onSwitchTab };
  const alerts = buildAlerts(customer, customerCards, t, callbacks);
  const nextActions = buildNextActions(customer, customerCards, t, callbacks);
  const upcomingApt = customer.appointments.find(
    (a) => new Date(a.startTime) > new Date() && a.status !== "CANCELLED"
  );
  const activeCards = customerCards.filter((c) => c.status === "ACTIVE").slice(0, 3);
  const recentFinancial = financialActivity.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${alert.color}`}
            >
              <alert.icon className="size-4 shrink-0" />
              <span className="flex-1">{alert.message}</span>
              {alert.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs shrink-0"
                  onClick={alert.action.onClick}
                >
                  {alert.action.label}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Next Best Actions */}
      {nextActions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {nextActions.slice(0, 3).map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Next appointment */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{t("cust.next_appointment")}</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onSwitchTab("appointments")}>
                  {t("cust.view_all")} <ArrowRight className="size-3 ms-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingApt ? (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{upcomingApt.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{upcomingApt.staffName}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium">
                      {new Date(upcomingApt.startTime).toLocaleDateString(
                        locale === "he" ? "he-IL" : "en-US",
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {t("cust.no_upcoming")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active cards */}
          {activeCards.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t("cust.active_cards")}</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onSwitchTab("cards")}>
                    {t("cust.view_all")} <ArrowRight className="size-3 ms-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{card.templateSnapshotName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1.5 flex-1 max-w-[120px] rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${card.sessionsTotal > 0 ? (card.sessionsUsed / card.sessionsTotal) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {card.sessionsRemaining}/{card.sessionsTotal}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent financial activity */}
          {recentFinancial.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{t("cust.recent_financial")}</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onSwitchTab("financial")}>
                    {t("cust.view_all")} <ArrowRight className="size-3 ms-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {recentFinancial.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.type === "card" ? (
                          <CreditCard className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{item.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.amount && <span className="text-sm tabular-nums">₪{parseFloat(item.amount).toFixed(0)}</span>}
                        <Badge variant="outline" className="text-[10px]">
                          {item.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Activity Timeline */}
        <Card className="lg:max-h-[600px] lg:overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("cust.activity_timeline")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activities.slice(0, 15)} compact />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type AlertItem = {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  color: string;
  action?: { label: string; onClick: () => void };
};

type Callbacks = { onEdit: () => void; onSwitchTab: (tab: string) => void };

function buildAlerts(
  customer: CustomerProfile,
  cards: CustomerCardRow[],
  t: ReturnType<typeof useT>,
  cb: Callbacks
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const unpaid = parseFloat(customer.unpaidBalance) || 0;

  if (customer.status === "BLOCKED") {
    alerts.push({
      icon: ShieldAlert,
      message: t("cust.alert_blocked"),
      color: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
    });
  }

  if (!customer.phone) {
    alerts.push({
      icon: Phone,
      message: t("cust.alert_no_phone"),
      color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
      action: { label: t("cust.action_add_phone"), onClick: cb.onEdit },
    });
  }

  if (unpaid > 0) {
    alerts.push({
      icon: DollarSign,
      message: t("cust.alert_unpaid", { amount: `₪${unpaid.toFixed(0)}` }),
      color: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
      action: { label: t("cust.view_all"), onClick: () => cb.onSwitchTab("financial") },
    });
  }

  const pendingCards = cards.filter((c) => c.status === "PENDING_PAYMENT");
  if (pendingCards.length > 0) {
    alerts.push({
      icon: CreditCard,
      message: t("cust.alert_pending_cards", { n: pendingCards.length }),
      color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
      action: { label: t("cust.view_all"), onClick: () => cb.onSwitchTab("cards") },
    });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + 14 * 86400000);
  const expiring = cards.filter(
    (c) => c.status === "ACTIVE" && c.expiresAt && new Date(c.expiresAt) <= soon
  );
  for (const card of expiring.slice(0, 2)) {
    const days = Math.ceil((new Date(card.expiresAt!).getTime() - now.getTime()) / 86400000);
    alerts.push({
      icon: Clock,
      message: t("cust.alert_expiring_card", { name: card.templateSnapshotName, days }),
      color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
      action: { label: t("cust.view_all"), onClick: () => cb.onSwitchTab("cards") },
    });
  }

  if (customer.noShowCount >= 3) {
    alerts.push({
      icon: AlertTriangle,
      message: t("cust.alert_no_shows", { n: customer.noShowCount }),
      color: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400",
    });
  }

  return alerts;
}

type ActionItem = { label: string; onClick: () => void };

function buildNextActions(
  customer: CustomerProfile,
  cards: CustomerCardRow[],
  t: ReturnType<typeof useT>,
  cb: Callbacks
): ActionItem[] {
  const actions: ActionItem[] = [];

  if (customer.upcomingAppointments === 0) {
    actions.push({ label: t("cust.action_book"), onClick: () => cb.onSwitchTab("appointments") });
  }

  const pendingCards = cards.filter((c) => c.status === "PENDING_PAYMENT");
  if (pendingCards.length > 0) {
    actions.push({ label: t("cust.action_confirm_payment"), onClick: () => cb.onSwitchTab("cards") });
  }

  if (!customer.phone) {
    actions.push({ label: t("cust.action_add_phone"), onClick: cb.onEdit });
  }

  if (!customer.email) {
    actions.push({ label: t("cust.action_add_email"), onClick: cb.onEdit });
  }

  const unpaid = parseFloat(customer.unpaidBalance) || 0;
  if (unpaid > 0) {
    actions.push({ label: t("cust.action_follow_up"), onClick: () => cb.onSwitchTab("financial") });
  }

  return actions;
}
