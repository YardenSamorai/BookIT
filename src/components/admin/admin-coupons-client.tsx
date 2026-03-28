"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Tag,
  Loader2,
  Trash2,
  Power,
  PowerOff,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCoupon, deleteCoupon, toggleCoupon } from "@/actions/admin";

/** Row shape from `getCoupons` (dates may serialize as strings over RSC). */
export type AdminCouponRow = {
  id: string;
  code: string;
  description: string | null;
  discountPercent: number | null;
  freeMonths: number | null;
  targetPlan: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date | string;
  expiresAt: Date | string | null;
};

const ALL_PLANS_VALUE = "ALL";

const PLAN_LABELS: Record<string, string> = {
  [ALL_PLANS_VALUE]: "כולם",
  FREE: "FREE",
  STARTER: "STARTER",
  PRO: "PRO",
};

/** 8 characters, alphanumeric style like BOOK2024 (BOOK + 4 random digits). */
export function generateCouponCode(): string {
  return `BOOK${String(1000 + Math.floor(Math.random() * 9000))}`;
}

function parseDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = parseDate(d);
  if (!date) return "—";
  return date.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

type CouponStatus = "active" | "inactive" | "expired";

function getCouponStatus(row: AdminCouponRow): CouponStatus {
  const exp = parseDate(row.expiresAt);
  const now = Date.now();
  if (exp && exp.getTime() < now) return "expired";
  if (!row.isActive) return "inactive";
  return "active";
}

const STATUS_LABELS: Record<CouponStatus, string> = {
  active: "פעיל",
  inactive: "לא פעיל",
  expired: "פג תוקף",
};

function discountLabel(row: AdminCouponRow): string {
  if (row.discountPercent != null)
    return `${row.discountPercent}% הנחה`;
  if (row.freeMonths != null) return `${row.freeMonths} חודשים חינם`;
  return "—";
}

function usageLabel(row: AdminCouponRow): string {
  const used = row.usedCount ?? 0;
  if (row.maxUses == null) return `${used} שימושים (ללא הגבלה)`;
  return `${used}/${row.maxUses} שימושים`;
}

export function AdminCouponsClient({
  coupons: initial,
}: {
  coupons: AdminCouponRow[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "months">("percent");
  const [percentValue, setPercentValue] = useState("20");
  const [monthsValue, setMonthsValue] = useState("1");
  const [targetPlan, setTargetPlan] = useState(ALL_PLANS_VALUE);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setCode("");
    setDescription("");
    setDiscountType("percent");
    setPercentValue("20");
    setMonthsValue("1");
    setTargetPlan(ALL_PLANS_VALUE);
    setMaxUses("");
    setExpiresAt("");
    setFormError(null);
  }

  function handleSuggestCode() {
    setCode(generateCouponCode());
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setFormError("יש להזין קוד קופון.");
      return;
    }

    let discountPercent: number | null = null;
    let freeMonths: number | null = null;

    if (discountType === "percent") {
      const p = Number.parseInt(percentValue, 10);
      if (Number.isNaN(p) || p < 1 || p > 100) {
        setFormError("אחוז הנחה חייב להיות בין 1 ל־100.");
        return;
      }
      discountPercent = p;
    } else {
      const m = Number.parseInt(monthsValue, 10);
      if (Number.isNaN(m) || m < 1 || m > 12) {
        setFormError("מספר חודשים חייב להיות בין 1 ל־12.");
        return;
      }
      freeMonths = m;
    }

    let maxUsesNum: number | null = null;
    if (maxUses.trim() !== "") {
      const n = Number.parseInt(maxUses, 10);
      if (Number.isNaN(n) || n < 1) {
        setFormError("מקסימום שימושים חייב להיות מספר חיובי.");
        return;
      }
      maxUsesNum = n;
    }

    startTransition(async () => {
      const res = await createCoupon({
        code: trimmedCode,
        description: description.trim(),
        discountPercent,
        freeMonths,
        targetPlan: targetPlan === ALL_PLANS_VALUE ? null : targetPlan,
        maxUses: maxUsesNum,
        expiresAt: expiresAt.trim() === "" ? null : expiresAt,
      });
      if (!res.success) {
        setFormError(res.error);
        return;
      }
      resetForm();
      setShowForm(false);
      router.refresh();
    });
  }

  function handleToggle(id: string, nextActive: boolean) {
    setPendingId(id);
    startTransition(async () => {
      const res = await toggleCoupon(id, nextActive);
      setPendingId(null);
      if (!res.success) {
        setFormError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("האם למחוק את הקופון? פעולה זו אינה הפיכה.")) return;
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteCoupon(id);
      setPendingId(null);
      if (!res.success) {
        setFormError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 p-2.5">
            <Tag className="size-6 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">קופונים</h1>
            <p className="text-sm text-muted-foreground">
              יצירה וניהול קודי הנחה וחודשים חינם
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
          }}
          className="shrink-0 gap-2"
        >
          {showForm ? (
            <>
              <X className="size-4" />
              סגור טופס
            </>
          ) : (
            <>
              <Plus className="size-4" />
              קופון חדש
            </>
          )}
        </Button>
      </div>

      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {formError}
        </p>
      )}

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">יצירת קופון</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">קוד</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="coupon-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    dir="ltr"
                    className="font-mono text-left sm:max-w-xs"
                    placeholder="BOOK2024"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 gap-2"
                    onClick={handleSuggestCode}
                  >
                    <Sparkles className="size-4" />
                    הצע קוד
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-desc">תיאור</Label>
                <Input
                  id="coupon-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  dir="rtl"
                  className="text-right"
                />
              </div>
              <div className="space-y-3">
                <Label>סוג הנחה</Label>
                <RadioGroup
                  value={discountType}
                  onValueChange={(v) => {
                    if (v === "percent" || v === "months") setDiscountType(v);
                  }}
                  className="flex flex-col gap-3 sm:flex-row sm:gap-6"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="percent" id="dt-percent" />
                    <Label htmlFor="dt-percent" className="cursor-pointer font-normal">
                      אחוז הנחה
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="months" id="dt-months" />
                    <Label htmlFor="dt-months" className="cursor-pointer font-normal">
                      חודשים חינם
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {discountType === "percent" ? (
                <div className="space-y-2">
                  <Label htmlFor="coupon-pct">אחוז (1–100)</Label>
                  <Input
                    id="coupon-pct"
                    type="number"
                    min={1}
                    max={100}
                    value={percentValue}
                    onChange={(e) => setPercentValue(e.target.value)}
                    className="max-w-[10rem] text-left"
                    dir="ltr"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="coupon-months">חודשים (1–12)</Label>
                  <Input
                    id="coupon-months"
                    type="number"
                    min={1}
                    max={12}
                    value={monthsValue}
                    onChange={(e) => setMonthsValue(e.target.value)}
                    className="max-w-[10rem] text-left"
                    dir="ltr"
                  />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>תוכנית יעד</Label>
                  <Select
                    value={targetPlan}
                    onValueChange={(v) => setTargetPlan(v ?? ALL_PLANS_VALUE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_PLANS_VALUE}>
                        {PLAN_LABELS[ALL_PLANS_VALUE]}
                      </SelectItem>
                      <SelectItem value="FREE">FREE</SelectItem>
                      <SelectItem value="STARTER">STARTER</SelectItem>
                      <SelectItem value="PRO">PRO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coupon-max">מקסימום שימושים (אופציונלי)</Label>
                  <Input
                    id="coupon-max"
                    type="number"
                    min={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="text-left"
                    dir="ltr"
                    placeholder="ללא הגבלה"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-expires">תאריך תפוגה (אופציונלי)</Label>
                <Input
                  id="coupon-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  צור קופון
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {initial.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            אין קופונים עדיין. לחץ על &quot;קופון חדש&quot; כדי ליצור את הראשון.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="w-full min-w-[56rem] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-right">
                  <th className="px-3 py-2.5 font-medium">קוד</th>
                  <th className="px-3 py-2.5 font-medium">תיאור</th>
                  <th className="px-3 py-2.5 font-medium">הנחה</th>
                  <th className="px-3 py-2.5 font-medium">יעד</th>
                  <th className="px-3 py-2.5 font-medium">שימושים</th>
                  <th className="px-3 py-2.5 font-medium">סטטוס</th>
                  <th className="px-3 py-2.5 font-medium">תפוגה</th>
                  <th className="px-3 py-2.5 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {initial.map((row) => {
                  const status = getCouponStatus(row);
                  const busy = pendingId === row.id && isPending;
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-3 py-3 font-mono font-bold" dir="ltr">
                        {row.code}
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-3 text-muted-foreground">
                        {row.description?.trim() || "—"}
                      </td>
                      <td className="px-3 py-3">{discountLabel(row)}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline">
                          {row.targetPlan == null || row.targetPlan === ""
                            ? PLAN_LABELS[ALL_PLANS_VALUE]
                            : PLAN_LABELS[row.targetPlan] ?? row.targetPlan}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{usageLabel(row)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            status === "active"
                              ? "text-emerald-700"
                              : status === "expired"
                                ? "text-red-700"
                                : "text-slate-500"
                          }`}
                        >
                          <span
                            className={`size-2 shrink-0 rounded-full ${
                              status === "active"
                                ? "bg-emerald-500"
                                : status === "expired"
                                  ? "bg-red-500"
                                  : "bg-slate-300"
                            }`}
                            aria-hidden
                          />
                          {STATUS_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDate(row.expiresAt)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            disabled={busy}
                            onClick={() => handleToggle(row.id, !row.isActive)}
                          >
                            {busy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : row.isActive ? (
                              <PowerOff className="size-3.5" />
                            ) : (
                              <Power className="size-3.5" />
                            )}
                            {row.isActive ? "השבת" : "הפעל"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-1.5"
                            disabled={busy}
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="size-3.5" />
                            מחק
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {initial.map((row) => {
              const status = getCouponStatus(row);
              const busy = pendingId === row.id && isPending;
              return (
                <Card key={row.id}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="font-mono text-base" dir="ltr">
                          {row.code}
                        </CardTitle>
                        <Badge variant="outline">
                          {row.targetPlan == null || row.targetPlan === ""
                            ? PLAN_LABELS[ALL_PLANS_VALUE]
                            : PLAN_LABELS[row.targetPlan] ?? row.targetPlan}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {row.description?.trim() || "—"}
                      </p>
                      <p className="text-sm font-medium">{discountLabel(row)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {usageLabel(row)}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        תפוגה: {formatDate(row.expiresAt)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          status === "active"
                            ? "text-emerald-700"
                            : status === "expired"
                              ? "text-red-700"
                              : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            status === "active"
                              ? "bg-emerald-500"
                              : status === "expired"
                                ? "bg-red-500"
                                : "bg-slate-300"
                          }`}
                          aria-hidden
                        />
                        {STATUS_LABELS[status]}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={busy}
                        onClick={() => handleToggle(row.id, !row.isActive)}
                      >
                        {busy ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : row.isActive ? (
                          <PowerOff className="size-3.5" />
                        ) : (
                          <Power className="size-3.5" />
                        )}
                        {row.isActive ? "השבת" : "הפעל"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-1.5"
                        disabled={busy}
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className="size-3.5" />
                        מחק
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
