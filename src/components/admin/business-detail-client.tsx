"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Check,
  Loader2,
  Save,
  Plus,
  MessageSquare,
  CreditCard,
  BarChart3,
  Settings,
  Power,
  PowerOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  changeBusinessPlan,
  changeBusinessStatus,
  toggleBusinessBranding,
  setMessageQuotaOverride,
  createBillingRecord,
  updateBillingRecord,
} from "@/actions/admin";

interface BusinessDetailData {
  business: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    messageQuotaOverride: number | null;
    brandingRemoved: boolean;
    createdAt: Date;
  };
  owner: { id: string; name: string; email: string | null; phone: string | null } | null;
  messages: {
    sent: number;
    quota: number;
    whatsapp: number;
    sms: number;
    byType: {
      confirmed: number;
      ownerNotif: number;
      reminder: number;
      cancellation: number;
      otp: number;
    };
    estimatedCost: { whatsapp: number; sms: number; total: number };
  };
  billing: Array<{
    id: string;
    periodLabel: string;
    planAtTime: string;
    amountIls: number;
    status: string;
    paidAt: Date | null;
    notes: string | null;
  }>;
  usage: {
    staff: { used: number; limit: number };
    services: { used: number; limit: number };
    bookings: { used: number; limit: number };
    cardTemplates: { used: number; limit: number };
    products: { used: number; limit: number };
  };
}

const PLAN_STYLES: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-600",
  STARTER: "bg-blue-100 text-blue-700",
  PRO: "bg-violet-100 text-violet-700",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const SMS_PACKAGES = [
  { label: "ברירת מחדל", desc: "לפי חבילה", value: null },
  { label: "100", desc: "בסיסי", value: 100 },
  { label: "300", desc: "Starter", value: 300 },
  { label: "500", desc: "בינוני", value: 500 },
  { label: "1,000", desc: "עסקי", value: 1000 },
  { label: "1,500", desc: "Pro", value: 1500 },
  { label: "3,000", desc: "פרימיום", value: 3000 },
  { label: "∞", desc: "ללא הגבלה", value: 999999 },
];

const tabs = [
  { key: "overview", label: "סקירה", icon: Settings },
  { key: "messages", label: "הודעות", icon: MessageSquare },
  { key: "billing", label: "חיובים", icon: CreditCard },
  { key: "limits", label: "מגבלות", icon: BarChart3 },
] as const;

export function BusinessDetailClient({ data }: { data: BusinessDetailData }) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const biz = data.business;

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{biz.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{data.owner?.name}</span>
            <span>·</span>
            <span dir="ltr">{data.owner?.phone || data.owner?.email}</span>
            <span>·</span>
            <span dir="ltr">/{biz.slug}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PLAN_STYLES[biz.plan] ?? ""}`}>
            {biz.plan}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[biz.status] ?? ""}`}>
            {biz.status}
          </span>
          <Link
            href={`/b/${biz.slug}`}
            target="_blank"
            className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <ExternalLink className="size-3" />
            צפה באתר
          </Link>
        </div>
      </div>

      {/* Saved indicator */}
      {saved && (
        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="size-4" />
          נשמר בהצלחה
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-muted-foreground hover:text-slate-900"
            }`}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab
          data={data}
          pending={pending}
          startTransition={startTransition}
          onSaved={showSaved}
        />
      )}
      {activeTab === "messages" && <MessagesTab data={data} />}
      {activeTab === "billing" && (
        <BillingTab
          data={data}
          pending={pending}
          startTransition={startTransition}
          onSaved={showSaved}
        />
      )}
      {activeTab === "limits" && <LimitsTab data={data} />}
    </div>
  );
}

// ── Overview Tab ──

function OverviewTab({
  data,
  pending,
  startTransition,
  onSaved,
}: {
  data: BusinessDetailData;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onSaved: () => void;
}) {
  const biz = data.business;
  const [quotaInput, setQuotaInput] = useState(
    biz.messageQuotaOverride?.toString() ?? ""
  );

  function handlePlanChange(newPlan: string) {
    startTransition(async () => {
      await changeBusinessPlan(biz.id, newPlan as "FREE" | "STARTER" | "PRO");
      onSaved();
    });
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      await changeBusinessStatus(biz.id, newStatus as "ACTIVE" | "PAST_DUE" | "CANCELLED");
      onSaved();
    });
  }

  function handleBrandingToggle() {
    startTransition(async () => {
      await toggleBusinessBranding(biz.id, !biz.brandingRemoved);
      onSaved();
    });
  }

  function handleQuotaSet() {
    const val = quotaInput.trim() ? parseInt(quotaInput, 10) : null;
    startTransition(async () => {
      await setMessageQuotaOverride(biz.id, val && !isNaN(val) ? val : null);
      onSaved();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">חבילה</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={biz.plan}
            onChange={(e) => handlePlanChange(e.target.value)}
            disabled={pending}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="FREE">FREE</option>
            <option value="STARTER">STARTER</option>
            <option value="PRO">PRO</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">סטטוס מנוי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[biz.status] ?? ""}`}>
              {biz.status === "ACTIVE" ? "פעיל" : biz.status === "PAST_DUE" ? "חוב" : "מושעה"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {biz.status !== "ACTIVE" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleStatusChange("ACTIVE")}
                disabled={pending}
              >
                <Power className="mr-1 size-3.5" />
                הפעל חשבון
              </Button>
            )}
            {biz.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => handleStatusChange("PAST_DUE")}
                disabled={pending}
              >
                סמן כחוב
              </Button>
            )}
            {biz.status !== "CANCELLED" && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={pending}
              >
                <PowerOff className="mr-1 size-3.5" />
                השעה חשבון
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">מיתוג Bookit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {biz.brandingRemoved ? (
                <span className="text-emerald-600 font-medium">מוסר</span>
              ) : (
                <span className="text-slate-600">מוצג</span>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrandingToggle}
              disabled={pending}
            >
              {biz.brandingRemoved ? "הצג מיתוג" : "הסר מיתוג"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">חבילת הודעות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            {SMS_PACKAGES.map((pkg) => {
              const isActive =
                (pkg.value === null && !biz.messageQuotaOverride) ||
                pkg.value === biz.messageQuotaOverride;
              return (
                <button
                  key={pkg.label}
                  disabled={pending || isActive}
                  onClick={() => {
                    setQuotaInput(pkg.value?.toString() ?? "");
                    startTransition(async () => {
                      await setMessageQuotaOverride(biz.id, pkg.value);
                      onSaved();
                    });
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <span className="block text-sm font-bold">{pkg.label}</span>
                  <span className="text-[10px] text-muted-foreground">{pkg.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t pt-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">מכסה מותאמת:</span>
            <Input
              type="number"
              placeholder="הקלד מספר..."
              value={quotaInput}
              onChange={(e) => setQuotaInput(e.target.value)}
              disabled={pending}
              className="max-w-[120px]"
            />
            <Button variant="outline" size="sm" onClick={handleQuotaSet} disabled={pending}>
              {pending ? <Loader2 className="size-3 animate-spin" /> : "הגדר"}
            </Button>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            מכסה נוכחית: <strong>{data.messages.quota}</strong> הודעות/חודש
            {biz.messageQuotaOverride ? " (דריסה ידנית)" : " (ברירת מחדל לפי חבילה)"}
            {" · "}נוצלו: <strong>{data.messages.sent}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Messages Tab ──

function MessagesTab({ data }: { data: BusinessDetailData }) {
  const msg = data.messages;
  const pct = msg.quota > 0 ? Math.min(100, Math.round((msg.sent / msg.quota) * 100)) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">שימוש החודש</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>{msg.sent} / {msg.quota} הודעות</span>
            <span className={pct >= 80 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
              {pct}%
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{msg.whatsapp}</p>
            <p className="text-xs text-muted-foreground">WhatsApp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{msg.sms}</p>
            <p className="text-xs text-muted-foreground">SMS</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">${msg.estimatedCost.total}</p>
            <p className="text-xs text-muted-foreground">עלות משוערת</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">לפי סוג</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "אישורים", value: msg.byType.confirmed },
              { label: "התראות בעלים", value: msg.byType.ownerNotif },
              { label: "תזכורות", value: msg.byType.reminder },
              { label: "ביטולים", value: msg.byType.cancellation },
              { label: "OTP", value: msg.byType.otp },
            ].map((t) => (
              <div key={t.label} className="rounded-lg border px-3 py-2 text-center">
                <p className="text-lg font-bold">{t.value}</p>
                <p className="text-[10px] text-muted-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">פירוט עלויות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>WhatsApp ({msg.whatsapp} הודעות × $0.0084)</span>
              <span className="font-mono">${msg.estimatedCost.whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span>SMS ({msg.sms} הודעות × $0.2575)</span>
              <span className="font-mono">${msg.estimatedCost.sms}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>סה&quot;כ</span>
              <span className="font-mono">${msg.estimatedCost.total}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Billing Tab ──

function BillingTab({
  data,
  pending,
  startTransition,
  onSaved,
}: {
  data: BusinessDetailData;
  pending: boolean;
  startTransition: (fn: () => void) => void;
  onSaved: () => void;
}) {
  const [newPeriod, setNewPeriod] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const planPrices: Record<string, number> = { FREE: 0, STARTER: 79, PRO: 149 };

  function handleCreate() {
    if (!newPeriod) return;
    const amount = newAmount ? parseFloat(newAmount) : planPrices[data.business.plan] ?? 0;
    startTransition(async () => {
      await createBillingRecord(data.business.id, newPeriod, amount);
      setNewPeriod("");
      setNewAmount("");
      onSaved();
    });
  }

  function handleStatusChange(recordId: string, status: "PAID" | "OVERDUE" | "WAIVED") {
    startTransition(async () => {
      await updateBillingRecord(recordId, status);
      onSaved();
    });
  }

  return (
    <div className="space-y-4">
      {/* Create new record */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">צור רשומת חיוב</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">תקופה</Label>
              <Input
                placeholder="2026-04"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                className="w-[130px]"
                disabled={pending}
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-xs">סכום (₪)</Label>
              <Input
                type="number"
                placeholder={String(planPrices[data.business.plan] ?? 0)}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-[100px]"
                disabled={pending}
                dir="ltr"
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={pending || !newPeriod}>
              {pending ? <Loader2 className="me-1 size-3 animate-spin" /> : <Plus className="me-1 size-3" />}
              צור
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing records table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-right">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">תקופה</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">חבילה</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">סכום</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">סטטוס</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">שולם ב</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {data.billing.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      אין רשומות חיוב עדיין
                    </td>
                  </tr>
                ) : (
                  data.billing.map((rec) => (
                    <tr key={rec.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs" dir="ltr">{rec.periodLabel}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs">{rec.planAtTime}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono">₪{(rec.amountIls / 100).toFixed(0)}</td>
                      <td className="px-4 py-2.5">
                        <BillingStatusBadge status={rec.status} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {rec.paidAt
                          ? new Date(rec.paidAt).toLocaleDateString("he-IL")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          {rec.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-emerald-600"
                              onClick={() => handleStatusChange(rec.id, "PAID")}
                              disabled={pending}
                            >
                              שולם
                            </Button>
                          )}
                          {rec.status !== "OVERDUE" && rec.status !== "PAID" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-red-600"
                              onClick={() => handleStatusChange(rec.id, "OVERDUE")}
                              disabled={pending}
                            >
                              חוב
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    OVERDUE: "bg-red-100 text-red-700",
    WAIVED: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    PAID: "שולם",
    PENDING: "ממתין",
    OVERDUE: "חוב",
    WAIVED: "ויתור",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Limits Tab ──

function LimitsTab({ data }: { data: BusinessDetailData }) {
  const items = [
    { label: "צוות", ...data.usage.staff },
    { label: "שירותים", ...data.usage.services },
    { label: "תורים / חודש", ...data.usage.bookings },
    { label: "תבניות כרטיסיות", ...data.usage.cardTemplates },
    { label: "מוצרים", ...data.usage.products },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            שימוש מול מגבלות — חבילת {data.business.plan}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => {
            const isInfinity = item.limit === Infinity || item.limit > 999999;
            const limitLabel = isInfinity ? "∞" : item.limit.toString();
            const pct = isInfinity
              ? Math.min(100, item.used > 0 ? 15 : 0)
              : Math.min(100, Math.round((item.used / item.limit) * 100));

            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.used} / {limitLabel}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
